"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import QuestionDisplay from "@/components/QuestionDisplay";
import SpeechToText from "@/components/SpeechToText";
import Timer from "@/components/Timer";
import useRequireAuth from "@/hooks/useRequireAuth";
import { motion } from "framer-motion";

// Helper function to generate a question.
async function fetchGeneratedQuestion(
  prompt: string,
  context: string,
  fileInput?: { file_id?: string },
  previousQuestions: string[] = []
): Promise<string> {
  const res = await fetch("/api/generate-question", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, context, fileInput, previousQuestions }),
  });
  const data = await res.json();
  if (data.error) {
    throw new Error(data.error);
  }
  return data.question;
}

// Helper function to truncate text.
function truncate(text: string, limit = 50) {
  return text.length > limit ? text.substring(0, limit) + "..." : text;
}

interface Session {
  id: string;
  summary?: string;
  rating?: number;
  openai_file_id?: string;
  prompt: string;
  participants: string[];
  num_questions: number;
  time_limit: number;
  answers?: unknown[];
  current_question?: string;
  [key: string]: unknown;
}

interface User {
  id: string;
  user_metadata?: {
    display_name?: string;
    [key: string]: unknown;
  };
}

export default function SessionPage() {
  useRequireAuth();
  const params = useParams();
  const { sessionId } = params as { sessionId: string };
  const router = useRouter();

  // Session & question state
  const [session, setSession] = useState<Session | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<string>("");
  const [currentTurn, setCurrentTurn] = useState<number>(0);
  const [loadingQuestion, setLoadingQuestion] = useState<boolean>(false);
  const [timerKey, setTimerKey] = useState<number>(0);
  const [answerStarted, setAnswerStarted] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  // New state for previously asked questions
  const [askedQuestions, setAskedQuestions] = useState<string[]>([]);

  // Transcript state for answer transcription
  const [finalTranscript, setFinalTranscript] = useState<string>("");
  const [liveTranscript, setLiveTranscript] = useState<string>("");
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editedText, setEditedText] = useState<string>("");

  // Prevent redundant generation of question.
  const [hasGeneratedQuestion, setHasGeneratedQuestion] = useState<boolean>(false);
  // Track if the question audio is currently playing.
  const [audioPlaying, setAudioPlaying] = useState<boolean>(false);

  // Helper to play button sound.
  const playButtonSound = () => {
    const sound = new Audio("/button-snap.mp3");
    sound.play().catch((err) =>
      console.error("Failed to play button snap sound:", err)
    );
  };

  // Fetch session details on load.
  useEffect(() => {
    async function fetchSession() {
      const { data, error } = await supabase
        .from("sessions")
        .select("*")
        .eq("id", sessionId)
        .single();
      if (error) {
        setErrorMessage(error.message);
      } else {
        const sessionData = data as Session;
        setSession(sessionData);
        // Only generate question if there isn't one already and if it hasn't been generated for this turn.
        if (!sessionData.current_question && !hasGeneratedQuestion) {
          try {
            const fileInput = sessionData.openai_file_id
              ? { file_id: sessionData.openai_file_id }
              : undefined;
            // For the first question, no previous questions exist.
            const question = await fetchGeneratedQuestion(
              sessionData.prompt,
              "",
              fileInput
            );
            const { data: authData, error: authError } =
              await supabase.auth.getSession();
            if (authError || !authData.session?.user) {
              setErrorMessage("Authentication error. Please log in again.");
              return;
            }
            const userId = authData.session.user.id;
            const { error: updateError } = await supabase
              .from("sessions")
              .update({ current_question: question, user_id: userId })
              .eq("id", sessionId);
            if (updateError) {
              setErrorMessage(updateError.message);
              return;
            }
            setCurrentQuestion(question);
            setHasGeneratedQuestion(true);
          } catch (err: unknown) {
            if (err instanceof Error) {
              setErrorMessage(err.message);
            } else {
              setErrorMessage("An unexpected error occurred.");
            }
          }
        } else {
          setCurrentQuestion(sessionData.current_question as string);
        }
      }
    }
    fetchSession();
  }, [sessionId, hasGeneratedQuestion]);

  // Answer submission and question turn handling.
  const handleAnswer = async (answerText: string) => {
    if (!session) return;
    setErrorMessage("");
    const newAnswers = [
      ...(session.answers ?? []),
      { participant: session.participants[currentTurn], answer: answerText },
    ];
    const questionsCompleted = Math.floor(
      newAnswers.length / session.participants.length
    );
    // If all questions are done:
    if (questionsCompleted >= session.num_questions) {
      const { data: authData, error: authError } =
        await supabase.auth.getSession();
      if (authError || !authData.session?.user) {
        setErrorMessage("Authentication error. Please log in again.");
        return;
      }
      const userId = authData.session.user.id;
      const { data: finishedSession, error } = await supabase
        .from("sessions")
        .update({ answers: newAnswers, status: "finished", user_id: userId })
        .eq("id", sessionId)
        .select()
        .single();
      if (error) {
        setErrorMessage(error.message);
      } else {
        setSession(finishedSession as Session);
      }
      playButtonSound();
      router.push(`/conclusion/${sessionId}`);
      return;
    }

    let newQuestion = currentQuestion;
    let newTurn = currentTurn;
    // When the current turn is the last participant, time to generate a new question.
    if (currentTurn >= session.participants.length - 1) {
      // Add the current question to the list of already asked questions.
      setAskedQuestions((prev) => [...prev, currentQuestion]);

      newTurn = 0;
      setLoadingQuestion(true);
      try {
        // Build context string including new answers and previously asked questions.
        const contextString =
          JSON.stringify(newAnswers) +
          (askedQuestions.length > 0
            ? "\nPreviously asked questions:\n" + askedQuestions.join("\n")
            : "");
        const fileInput = session.openai_file_id
          ? { file_id: session.openai_file_id }
          : undefined;
        newQuestion = await fetchGeneratedQuestion(
          session.prompt,
          contextString,
          fileInput,
          askedQuestions
        );
      } catch (err: unknown) {
        if (err instanceof Error) {
          setErrorMessage(err.message);
        } else {
          setErrorMessage("An unexpected error occurred.");
        }
      }
      setLoadingQuestion(false);
    } else {
      newTurn = currentTurn + 1;
    }

    const { data: authData, error: authError } = await supabase.auth.getSession();
    if (authError || !authData.session?.user) {
      setErrorMessage("Authentication error. Please log in again.");
      return;
    }
    const userId = authData.session.user.id;
    const { data: updatedSession, error } = await supabase
      .from("sessions")
      .update({ answers: newAnswers, current_question: newQuestion, user_id: userId })
      .eq("id", sessionId)
      .select()
      .single();
    if (error) {
      setErrorMessage(error.message);
      return;
    }
    setSession(updatedSession as Session);
    setCurrentTurn(newTurn);
    // Reset transcription states for the next turn.
    setFinalTranscript("");
    setLiveTranscript("");
    setTimerKey((prev) => prev + 1);
    setAnswerStarted(false);
    setCurrentQuestion((updatedSession as Session).current_question as string);
    // Allow new question generation on the next turn.
    setHasGeneratedQuestion(false);
    playButtonSound();
  };

  const handleTimeUp = () => {
    handleAnswer(finalTranscript + liveTranscript);
  };

  const endAnswerManually = () => {
    playButtonSound();
    handleAnswer(finalTranscript + liveTranscript);
  };

  const finishSession = () => {
    playButtonSound();
    router.push(`/conclusion/${sessionId}`);
  };

  if (!session)
    return <p className="text-center mt-10 text-gray-700">Loading session...</p>;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="relative max-w-5xl mx-auto p-10 bg-white shadow-2xl rounded-xl animate-fadeInUp pb-20"
    >
      {errorMessage && (
        <div className="mb-4 p-3 bg-red-100 text-red-600 border border-red-200 rounded">
          {errorMessage}
        </div>
      )}
      <h2 className="text-3xl font-bold mb-6 text-gray-800">Session Details</h2>
      {/* Animated Question Display Section with Audio Controls */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <QuestionDisplay
          question={currentQuestion}
          onAudioStatusChange={setAudioPlaying}
        />
      </motion.div>
      <p className="mt-6 font-bold text-gray-700">
        Current Participant:{" "}
        <span className="text-pink-600">{session.participants[currentTurn]}</span>
      </p>
      {/* Answer Controls */}
      {!answerStarted ? (
        <motion.button
          onClick={() => {
            playButtonSound();
            setAnswerStarted(true);
          }}
          disabled={audioPlaying}
          className={`mt-6 w-full flex items-center justify-center px-6 py-3 font-semibold rounded-md shadow transition-transform hover:-translate-y-1 ${
            audioPlaying
              ? "bg-gray-400 text-white cursor-not-allowed"
              : "bg-pink-600 text-white hover:shadow-xl"
          }`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          {/* Microphone Icon */}
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 1v11m0 0a3 3 0 003 3h1a4 4 0 01-4 4v0a4 4 0 01-4-4h1a3 3 0 003-3z"
            ></path>
          </svg>
          Start Answer
        </motion.button>
      ) : (
        <>
          <motion.div
            className="mt-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            <Timer initialTime={session.time_limit ?? 60} onTimeUp={handleTimeUp} key={timerKey} />
          </motion.div>
          {isEditing ? (
            <motion.div
              className="mt-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.6 }}
            >
              <textarea
                className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-pink-600"
                rows={4}
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
              />
              <motion.button
                onClick={() => {
                  playButtonSound();
                  setFinalTranscript(editedText);
                  setLiveTranscript("");
                  setIsEditing(false);
                }}
                className="mt-3 w-full px-6 py-3 bg-green-600 text-white font-semibold rounded-md shadow hover:shadow-xl transition-transform hover:-translate-y-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.6 }}
              >
                <span className="mr-2">
                  {/* Check Icon */}
                  <svg
                    className="w-5 h-5 inline"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    ></path>
                  </svg>
                </span>
                Finish Editing
              </motion.button>
            </motion.div>
          ) : (
            <>
              <motion.div
                className="mt-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.6 }}
              >
                <SpeechToText
                  key={timerKey} // Forces remount on new turn.
                  onResult={(text: string) => {
                    if (!isEditing) {
                      if (text.startsWith(finalTranscript)) {
                        setLiveTranscript(text.slice(finalTranscript.length));
                      } else {
                        setLiveTranscript(text);
                      }
                    }
                  }}
                  autoStart={!isEditing}
                  initialTranscript={finalTranscript}
                />
              </motion.div>
              <motion.div
                className="mt-6 flex flex-col sm:flex-row gap-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.6 }}
              >
                <button
                  onClick={() => {
                    playButtonSound();
                    setEditedText(finalTranscript + liveTranscript);
                    setIsEditing(true);
                  }}
                  className="flex-1 flex items-center justify-center px-6 py-3 bg-yellow-600 text-white font-semibold rounded-md shadow hover:shadow-xl transition-transform hover:-translate-y-1"
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M11 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2v-5"
                    ></path>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M18.5 2.5a2.121 2.121 0 113 3L12 15l-4 1 1-4 9.5-9.5z"
                    ></path>
                  </svg>
                  Edit Answer
                </button>
                <button
                  onClick={() => {
                    playButtonSound();
                    endAnswerManually();
                  }}
                  className="flex-1 flex items-center justify-center px-6 py-3 bg-pink-600 text-white font-semibold rounded-md shadow hover:shadow-xl transition-transform hover:-translate-y-1"
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    ></path>
                  </svg>
                  End Answer
                </button>
              </motion.div>
            </>
          )}
        </>
      )}
      {loadingQuestion && (
        <motion.p
          className="mt-4 text-center text-gray-500 italic"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.6 }}
        >
          Generating next question...
        </motion.p>
      )}
      {/* Finish Session Button positioned at bottom-right; additional bottom padding on container prevents overlap */}
      <motion.button
        onClick={() => {
          playButtonSound();
          finishSession();
        }}
        className="absolute bottom-6 right-6 px-6 py-3 bg-red-600 text-white font-semibold rounded-md shadow hover:shadow-xl transition-transform hover:-translate-y-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.6 }}
      >
        Finish Session
      </motion.button>
    </motion.div>
  );
}
