'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import QuestionDisplay from '@/components/QuestionDisplay';
import SpeechToText from '@/components/SpeechToText';
import Timer from '@/components/Timer';
import useRequireAuth from '@/hooks/useRequireAuth';

// Updated helper to pass file context.
async function fetchGeneratedQuestion(
  prompt: string,
  context: string,
  fileInput?: { file_id?: string }
): Promise<string> {
  const res = await fetch('/api/generate-question', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, context, fileInput }),
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

  // Session and question state.
  const [session, setSession] = useState<Session | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<string>('');
  const [currentTurn, setCurrentTurn] = useState<number>(0);
  const [loadingQuestion, setLoadingQuestion] = useState<boolean>(false);
  const [timerKey, setTimerKey] = useState<number>(0);
  const [answerStarted, setAnswerStarted] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Transcript states for answer transcription.
  const [finalTranscript, setFinalTranscript] = useState<string>('');
  const [liveTranscript, setLiveTranscript] = useState<string>('');

  // Editing mode state.
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editedText, setEditedText] = useState<string>('');

  // State flag to ensure a question isn't regenerated repeatedly.
  const [hasGeneratedQuestion, setHasGeneratedQuestion] = useState<boolean>(false);

  // ---- Audio for the QUESTION TTS ----
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Cleanup audio on unmount (or when navigating away).
  useEffect(() => {
    return () => {
      if (audioElement) {
        audioElement.pause();
        audioElement.currentTime = 0;
      }
    };
  }, [audioElement]);

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
        if (!sessionData.current_question && !hasGeneratedQuestion) {
          try {
            const fileInput = sessionData.openai_file_id
              ? { file_id: sessionData.openai_file_id }
              : undefined;
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

  // Automatically generate and play TTS for the question when it loads.
  useEffect(() => {
    if (currentQuestion) {
      // First, stop any previously playing audio.
      if (audioElement) {
        audioElement.pause();
        audioElement.currentTime = 0;
      }
      // Generate new audio for the question.
      (async () => {
        try {
          const res = await fetch('/api/generate-speech', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: currentQuestion,
              voice: 'coral', // Adjust as desired.
              instructions: 'Speak clearly in a neutral tone.'
            }),
          });
          if (!res.ok) {
            setErrorMessage("Failed to generate question audio.");
            return;
          }
          const audioBuffer = await res.arrayBuffer();
          const blob = new Blob([audioBuffer], { type: 'audio/mpeg' });
          const audioUrl = URL.createObjectURL(blob);
          const audio = new Audio(audioUrl);
          // When audio ends, update state so that the play button reappears.
          audio.addEventListener('ended', () => {
            setIsPlaying(false);
          });
          // Auto-play the audio.
          audio.play().then(() => {
            setAudioElement(audio);
            setIsPlaying(true);
          }).catch((err) => {
            console.error("Autoplay blocked for question audio:", err);
            setAudioElement(audio);
            setIsPlaying(false);
          });
        } catch (err: unknown) {
          if (err instanceof Error) {
            setErrorMessage(err.message);
          } else {
            setErrorMessage("An unexpected error occurred while generating question audio.");
          }
        }
      })();
    }
  }, [currentQuestion]);

  // Audio control handlers for question TTS.
  const handlePlay = () => {
    if (audioElement) {
      audioElement.play();
      setIsPlaying(true);
    }
  };

  const handlePause = () => {
    if (audioElement) {
      audioElement.pause();
      setIsPlaying(false);
    }
  };

  const handleStop = () => {
    if (audioElement) {
      audioElement.pause();
      audioElement.currentTime = 0;
      setIsPlaying(false);
    }
  };

  // Handle answer submission.
  const handleAnswer = async (answerText: string) => {
    if (!session) return;
    setErrorMessage('');
    const newAnswers = [
      ...(session.answers ?? []),
      { participant: session.participants[currentTurn], answer: answerText },
    ];
    const questionsCompleted = Math.floor(newAnswers.length / session.participants.length);
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
      router.push(`/conclusion/${sessionId}`);
      return;
    }

    let newQuestion = currentQuestion;
    let newTurn = currentTurn;
    if (currentTurn >= session.participants.length - 1) {
      newTurn = 0;
      setLoadingQuestion(true);
      try {
        const fileInput = session.openai_file_id ? { file_id: session.openai_file_id } : undefined;
        newQuestion = await fetchGeneratedQuestion(session.prompt, JSON.stringify(newAnswers), fileInput);
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
    // Reset transcription states for next turn.
    setFinalTranscript('');
    setLiveTranscript('');
    setTimerKey(prev => prev + 1);
    setAnswerStarted(false);
    setCurrentQuestion((updatedSession as Session).current_question as string);
  };

  const handleTimeUp = () => {
    handleAnswer(finalTranscript + liveTranscript);
  };

  const endAnswerManually = () => {
    handleAnswer(finalTranscript + liveTranscript);
  };

  const finishSession = () => {
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
      <QuestionDisplay question={currentQuestion} />
      <p className="mt-6 font-bold text-gray-700">
        Current Participant: {session.participants[currentTurn]}
      </p>
      {!answerStarted ? (
        <button
          onClick={() => setAnswerStarted(true)}
          className="mt-6 px-6 py-3 bg-pink-600 text-white font-semibold rounded-md shadow hover:shadow-lg transition-transform hover:-translate-y-0.5"
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
                onClick={() => {
                  setFinalTranscript(editedText);
                  setLiveTranscript('');
                  setIsEditing(false);
                }}
                className="mt-2 px-6 py-3 bg-green-600 text-white font-semibold rounded-md shadow hover:shadow-lg transition-transform hover:-translate-y-0.5"
              >
                Finish Editing
              </button>
            </div>
          ) : (
            <>
              <div className="mt-6">
                <SpeechToText
                  key={timerKey} // key forces remount when timerKey changes, resetting transcription.
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
                onClick={() => {
                  setEditedText(finalTranscript + liveTranscript);
                  setIsEditing(true);
                }}
                className="mt-6 px-6 py-3 bg-yellow-600 text-white font-semibold rounded-md shadow hover:shadow-lg transition-transform hover:-translate-y-0.5"
              >
                Edit Answer
              </button>
              <button
                onClick={endAnswerManually}
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
        onClick={finishSession}
        className="mt-6 w-full px-6 py-3 bg-red-600 text-white font-semibold rounded-md shadow hover:shadow-lg transition-transform hover:-translate-y-0.5"
      >
        Finish Session
      </button>
    </div>
  );
}
