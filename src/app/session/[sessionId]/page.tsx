'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import QuestionDisplay from '@/components/QuestionDisplay';
import SpeechToText from '@/components/SpeechToText';
import Timer from '@/components/Timer';

// Helper function to call our API route for generating a question.
async function fetchGeneratedQuestion(prompt: string, context: string): Promise<string> {
  const res = await fetch('/api/generate-question', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, context }),
  });
  const data = await res.json();
  if (data.error) {
    throw new Error(data.error);
  }
  return data.question;
}

export default function SessionPage() {
  // Unwrap route parameters using useParams()
  const params = useParams();
  const { sessionId } = params as { sessionId: string };

  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [currentQuestion, setCurrentQuestion] = useState<string>('');
  const [currentTurn, setCurrentTurn] = useState<number>(0);
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const [loadingQuestion, setLoadingQuestion] = useState<boolean>(false);
  const [timerKey, setTimerKey] = useState<number>(0); // used to reset Timer
  const [answerStarted, setAnswerStarted] = useState<boolean>(false); // controls answer UI visibility

  // Fetch session details from Supabase on mount.
  useEffect(() => {
    async function fetchSession() {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('id', sessionId)
        .single();
      if (error) {
        alert(error.message);
      } else {
        setSession(data);
        // Initialize question using the prompt if not already set.
        if (!data.current_question) {
          try {
            const question = await fetchGeneratedQuestion(data.prompt, '');
            const { error: updateError } = await supabase
              .from('sessions')
              .update({ current_question: question })
              .eq('id', sessionId);
            if (updateError) {
              alert(updateError.message);
              return;
            }
            setCurrentQuestion(question);
          } catch (err: any) {
            alert(err.message);
          }
        } else {
          setCurrentQuestion(data.current_question);
        }
      }
    }
    fetchSession();
  }, [sessionId]);

  // Handle answer submission from SpeechToText component.
  const handleAnswer = async (answerText: string) => {
    if (!session) return;

    // Append the new answer.
    const newAnswers = [
      ...(session.answers || []),
      { participant: session.participants[currentTurn], answer: answerText },
    ];

    // Calculate how many questions have been completed so far.
    const questionsCompleted = Math.floor(newAnswers.length / session.participants.length);
    // If reached or exceeded total desired questions, finish session.
    if (questionsCompleted >= session.num_questions) {
      const { data: finishedSession, error } = await supabase
        .from('sessions')
        .update({ answers: newAnswers, status: 'finished' })
        .eq('id', sessionId)
        .select('*')
        .single();
      if (error) {
        alert(error.message);
      } else {
        setSession(finishedSession);
      }
      router.push(`/conclusion/${sessionId}`);
      return;
    }

    let newQuestion = currentQuestion;
    let newTurn = currentTurn;
    // If the current participant is the last in the list, generate a new question.
    if (currentTurn >= session.participants.length - 1) {
      newTurn = 0;
      setLoadingQuestion(true);
      try {
        newQuestion = await fetchGeneratedQuestion(session.prompt, JSON.stringify(newAnswers));
      } catch (err: any) {
        alert(err.message);
      }
      setLoadingQuestion(false);
    } else {
      newTurn = currentTurn + 1;
    }

    // Update the session record in Supabase and re-fetch the updated record.
    const { data: updatedSession, error } = await supabase
      .from('sessions')
      .update({ answers: newAnswers, current_question: newQuestion })
      .eq('id', sessionId)
      .select('*')
      .single();
    if (error) {
      alert(error.message);
      return;
    }
    // Update local state with the updated session.
    setSession(updatedSession);
    setCurrentTurn(newTurn);
    setLiveTranscript('');
    setTimerKey(prev => prev + 1); // reset Timer
    setAnswerStarted(false); // require new "Start Answer" click for next turn.
    setCurrentQuestion(updatedSession.current_question);
  };

  // Callback when the timer finishes (auto end the answer).
  const handleTimeUp = () => {
    handleAnswer(liveTranscript);
  };

  // Manual "End Answer" button handler.
  const endAnswerManually = () => {
    handleAnswer(liveTranscript);
  };

  // Finish session and redirect to conclusion.
  const finishSession = () => {
    router.push(`/conclusion/${sessionId}`);
  };

  if (!session) return <p>Loading session...</p>;

  return (
    <div className="max-w-2xl mx-auto p-4 bg-white shadow rounded">
      <h2 className="text-2xl font-bold mb-4">Session {sessionId}</h2>
      <QuestionDisplay question={currentQuestion} />
      <p className="mt-4 font-bold">
        Current Participant: {session.participants[currentTurn]}
      </p>
      
      {!answerStarted ? (
        <button
          onClick={() => setAnswerStarted(true)}
          className="mt-4 px-4 py-2 bg-green-500 text-white rounded"
        >
          Start Answer
        </button>
      ) : (
        <>
          <div className="mt-4">
            <Timer initialTime={session.time_limit || 30} onTimeUp={handleTimeUp} key={timerKey} />
          </div>
          <div className="mt-4">
            <SpeechToText onResult={(text) => setLiveTranscript(text)} autoStart={true} />
            <p className="mt-2">Live Transcript: {liveTranscript}</p>
          </div>
          <button onClick={endAnswerManually} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded">
            End Answer
          </button>
        </>
      )}

      {loadingQuestion && <p className="mt-4">Generating next question...</p>}
      <button onClick={finishSession} className="mt-4 px-4 py-2 bg-red-500 text-white rounded">
        Finish Session
      </button>
    </div>
  );
}
