'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import QuestionDisplay from '@/components/QuestionDisplay';
import SpeechToText from '@/components/SpeechToText';
import Timer from '@/components/Timer';
import useRequireAuth from '@/hooks/useRequireAuth';

async function fetchGeneratedQuestion(
  prompt: string,
  context: string,
  fileInput?: { file_id?: string },
  previousQuestions: string[] = [] // Pass previously asked questions here.
): Promise<string> {
  const res = await fetch('/api/generate-question', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, context, fileInput, previousQuestions }),
  });
  const data = await res.json();
  if (data.error) {
    throw new Error(data.error);
  }
  return data.question;
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

export default function SessionPage() {
  useRequireAuth();
  const params = useParams();
  const { sessionId } = params as { sessionId: string };
  const router = useRouter();

  // Session & question state
  const [session, setSession] = useState<Session | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<string>('');
  const [currentTurn, setCurrentTurn] = useState<number>(0);
  const [loadingQuestion, setLoadingQuestion] = useState<boolean>(false);
  const [timerKey, setTimerKey] = useState<number>(0);
  const [answerStarted, setAnswerStarted] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // New state for previously asked questions
  const [askedQuestions, setAskedQuestions] = useState<string[]>([]);

  // Transcript state for answer transcription
  const [finalTranscript, setFinalTranscript] = useState<string>('');
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editedText, setEditedText] = useState<string>('');

  // Prevent redundant generation of question.
  const [hasGeneratedQuestion, setHasGeneratedQuestion] = useState<boolean>(false);
  // Track if the question audio is currently playing.
  const [audioPlaying, setAudioPlaying] = useState<boolean>(false);

  // Helper to play the button sound (from public/button-snap.mp3)
  const playButtonSound = () => {
    const sound = new Audio('/button-snap.mp3');
    sound.play().catch(err => console.error('Failed to play button snap sound:', err));
  };

  // Fetch session details on load.
  useEffect(() => {
    async function fetchSession() {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('id', sessionId)
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
            const question = await fetchGeneratedQuestion(sessionData.prompt, '', fileInput);
            const { data: authData, error: authError } = await supabase.auth.getSession();
            if (authError || !authData.session?.user) {
              setErrorMessage("Authentication error. Please log in again.");
              return;
            }
            const userId = authData.session.user.id;
            const { error: updateError } = await supabase
              .from('sessions')
              .update({ current_question: question, user_id: userId })
              .eq('id', sessionId);
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
    setErrorMessage('');
    const newAnswers = [
      ...(session.answers ?? []),
      { participant: session.participants[currentTurn], answer: answerText },
    ];
    const questionsCompleted = Math.floor(newAnswers.length / session.participants.length);
    // If all questions are done:
    if (questionsCompleted >= session.num_questions) {
      const { data: authData, error: authError } = await supabase.auth.getSession();
      if (authError || !authData.session?.user) {
        setErrorMessage("Authentication error. Please log in again.");
        return;
      }
      const userId = authData.session.user.id;
      const { data: finishedSession, error } = await supabase
        .from('sessions')
        .update({ answers: newAnswers, status: 'finished', user_id: userId })
        .eq('id', sessionId)
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
      setAskedQuestions(prev => [...prev, currentQuestion]);

      newTurn = 0;
      setLoadingQuestion(true);
      try {
        // Build context string including new answers and previously asked questions.
        const contextString =
          JSON.stringify(newAnswers) +
          (askedQuestions.length > 0
            ? "\nPreviously asked questions:\n" + askedQuestions.join("\n")
            : "");
        const fileInput = session.openai_file_id ? { file_id: session.openai_file_id } : undefined;
        newQuestion = await fetchGeneratedQuestion(session.prompt, contextString, fileInput, askedQuestions);
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
      .from('sessions')
      .update({ answers: newAnswers, current_question: newQuestion, user_id: userId })
      .eq('id', sessionId)
      .select()
      .single();
    if (error) {
      setErrorMessage(error.message);
      return;
    }
    setSession(updatedSession as Session);
    setCurrentTurn(newTurn);
    // Reset transcription states for the next turn.
    setFinalTranscript('');
    setLiveTranscript('');
    setTimerKey(prev => prev + 1);
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
    return <p className="text-center mt-10">Loading session...</p>;

  return (
    <div className="max-w-2xl mx-auto p-8 bg-white shadow-lg rounded-xl animate-fadeInUp">
      {errorMessage && (
        <div className="mb-4 p-3 bg-red-100 text-red-600 border border-red-200 rounded">
          {errorMessage}
        </div>
      )}
      <h2 className="text-3xl font-bold mb-6 text-gray-800">Session Details</h2>
      {/* Render the QuestionDisplay with both the question text and audio controls */}
      <QuestionDisplay 
        question={currentQuestion} 
        onAudioStatusChange={setAudioPlaying} 
      />
      <p className="mt-6 font-bold text-gray-700">
        Current Participant: {session.participants[currentTurn]}
      </p>
      {/* Answer Controls */}
      {!answerStarted ? (
        <button
          onClick={() => { playButtonSound(); setAnswerStarted(true); }}
          disabled={audioPlaying}
          className={`mt-6 px-6 py-3 font-semibold rounded-md shadow transition-transform hover:-translate-y-0.5 ${
            audioPlaying 
              ? 'bg-gray-400 text-white cursor-not-allowed'
              : 'bg-pink-600 text-white hover:shadow-lg'
          }`}
        >
          Start Answer
        </button>
      ) : (
        <>
          <div className="mt-6">
            <Timer initialTime={session.time_limit ?? 60} onTimeUp={handleTimeUp} key={timerKey} />
          </div>
          {isEditing ? (
            <div className="mt-6">
              <textarea
                className="w-full p-2 border rounded"
                rows={4}
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
              />
              <button
                onClick={() => { playButtonSound(); setFinalTranscript(editedText); setLiveTranscript(''); setIsEditing(false); }}
                className="mt-2 px-6 py-3 bg-green-600 text-white font-semibold rounded-md shadow hover:shadow-lg transition-transform hover:-translate-y-0.5"
              >
                Finish Editing
              </button>
            </div>
          ) : (
            <>
              <div className="mt-6">
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
              </div>
              <button
                onClick={() => { playButtonSound(); setEditedText(finalTranscript + liveTranscript); setIsEditing(true); }}
                className="mt-6 px-6 py-3 bg-yellow-600 text-white font-semibold rounded-md shadow hover:shadow-lg transition-transform hover:-translate-y-0.5"
              >
                Edit Answer
              </button>
              <button
                onClick={() => { playButtonSound(); endAnswerManually(); }}
                className="mt-6 px-6 py-3 bg-pink-600 text-white font-semibold rounded-md shadow hover:shadow-lg transition-transform hover:-translate-y-0.5"
              >
                End Answer
              </button>
            </>
          )}
        </>
      )}
      {loadingQuestion && (
        <p className="mt-4 text-center text-gray-500 italic">Generating next question...</p>
      )}
      <button
        onClick={() => { playButtonSound(); finishSession(); }}
        className="mt-6 w-full px-6 py-3 bg-red-600 text-white font-semibold rounded-md shadow hover:shadow-lg transition-transform hover:-translate-y-0.5"
      >
        Finish Session
      </button>
    </div>
  );
}
