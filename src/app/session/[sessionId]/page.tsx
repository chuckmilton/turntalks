'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import QuestionDisplay from '@/components/QuestionDisplay';
import SpeechToText from '@/components/SpeechToText';
import Timer from '@/components/Timer';
import useRequireAuth from '@/hooks/useRequireAuth';

// Updated helper to pass file context
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

// Define a minimal interface for the session data.
interface Session {
  id: string;
  summary?: string;
  rating?: number;
  openai_file_id?: string;
  prompt: string;
  // The following are added to fix type errors
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

  // Set session state with the Session interface.
  const [session, setSession] = useState<Session | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<string>('');
  const [currentTurn, setCurrentTurn] = useState<number>(0);
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const [loadingQuestion, setLoadingQuestion] = useState<boolean>(false);
  const [timerKey, setTimerKey] = useState<number>(0);
  const [answerStarted, setAnswerStarted] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

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
        if (!sessionData.current_question) {
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
  }, [sessionId]);

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
        .select('*')
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
    setLiveTranscript('');
    setTimerKey(prev => prev + 1);
    setAnswerStarted(false);
    setCurrentQuestion((updatedSession as Session).current_question as string);
  };

  const handleTimeUp = () => {
    handleAnswer(liveTranscript);
  };

  const endAnswerManually = () => {
    handleAnswer(liveTranscript);
  };

  const finishSession = () => {
    router.push(`/conclusion/${sessionId}`);
  };

  if (!session) return <p className="text-center mt-10">Loading session...</p>;

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
          className="mt-6 px-6 py-3 bg-green-600 text-white font-semibold rounded-md shadow hover:shadow-lg transition-transform hover:-translate-y-0.5"
        >
          Start Answer
        </button>
      ) : (
        <>
          <div className="mt-6">
            <Timer initialTime={session.time_limit ?? 30} onTimeUp={handleTimeUp} key={timerKey} />
          </div>
          <div className="mt-6">
            <SpeechToText onResult={(text: string) => setLiveTranscript(text)} autoStart={true} />
          </div>
          <button
            onClick={endAnswerManually}
            className="mt-6 px-6 py-3 bg-blue-600 text-white font-semibold rounded-md shadow hover:shadow-lg transition-transform hover:-translate-y-0.5"
          >
            End Answer
          </button>
        </>
      )}
      {loadingQuestion && (
        <p className="mt-4 text-center text-gray-500 italic">
          Generating next question...
        </p>
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
