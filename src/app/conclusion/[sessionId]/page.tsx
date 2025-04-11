'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Rating from '@/components/Rating';
import { useRouter, useParams } from 'next/navigation';
import useRequireAuth from '@/hooks/useRequireAuth';
import SpeechRecognition from 'react-speech-recognition'; // To stop the mic

// Extended Session interface.
interface Session {
  id: string;
  summary?: string;
  rating?: number;
  openai_file_id?: string;
  prompt: string;
  end_goal?: string; // Optional end goal.
  participants: string[];
  num_questions: number;
  time_limit: number;
  answers?: unknown[];
  current_question?: string;
  [key: string]: unknown;
}

export default function ConclusionPage() {
  useRequireAuth();

  const params = useParams();
  const { sessionId } = params as { sessionId: string };
  const [session, setSession] = useState<Session | null>(null);
  const [summary, setSummary] = useState<string>('');
  const [loadingSummary, setLoadingSummary] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const router = useRouter();

  // Ensure the mic is off when this page loads.
  useEffect(() => {
    SpeechRecognition.stopListening();
  }, []);

  // Function to auto-generate summary if it doesn't exist.
  async function handleGenerateSummary(sessionData: Session | null) {
    if (!sessionData) return;
    setLoadingSummary(true);
    try {
      // Create a fileInput object if available.
      const fileInput = sessionData.openai_file_id
        ? { file_id: sessionData.openai_file_id }
        : undefined;

      const res = await fetch('/api/generate-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Send sessionData and fileInput to the API.
        body: JSON.stringify({ sessionData, fileInput }),
      });
      const result = await res.json();
      if (result.error) throw new Error(result.error);
      const summaryText: string = result.summary;
      setSummary(summaryText);

      // Retrieve current user id.
      const { data: authData, error: authError } = await supabase.auth.getSession();
      if (authError || !authData.session?.user) {
        setErrorMessage("Authentication error. Please log in again.");
        return;
      }
      const userId = authData.session.user.id;

      // Save summary to Supabase including the user_id.
      const { error } = await supabase
        .from('sessions')
        .update({ summary: summaryText, status: 'finished', user_id: userId })
        .eq('id', sessionId);
      if (error) {
        setErrorMessage(error.message);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('An unexpected error occurred.');
      }
    }
    setLoadingSummary(false);
  }

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
        if (sessionData.summary) {
          setSummary(sessionData.summary);
        } else {
          await handleGenerateSummary(sessionData);
        }
      }
    }
    fetchSession();
  }, [sessionId]);

  if (!session)
    return <p className="text-center mt-10 text-gray-600">Loading session data...</p>;

  return (
    <div className="max-w-2xl mx-auto p-8 bg-white shadow-lg rounded-xl animate-fadeInUp">
      {errorMessage && (
        <div className="mb-6 p-3 bg-red-100 text-red-600 border border-red-200 rounded">
          {errorMessage}
        </div>
      )}
      <h2 className="text-3xl font-bold mb-6 text-gray-800">Session Summary</h2>
      
      {/* Display Prompt */}
      <div className="mb-6">
        <h3 className="font-bold text-xl text-gray-700 mb-2">Prompt:</h3>
        <p className="text-gray-700">{session.prompt}</p>
      </div>
      
      {/* Display End Goal if available */}
      {session.end_goal && (
        <div className="mb-6">
          <h3 className="font-bold text-xl text-gray-700 mb-2">End Goal:</h3>
          <p className="text-gray-700">{session.end_goal}</p>
        </div>
      )}

      {/* Display Participants */}
      <div className="mb-6">
        <h3 className="font-bold text-xl text-gray-700 mb-2">Participants:</h3>
        {session.participants.length > 0 ? (
          <ul className="list-disc list-inside text-gray-700">
            {session.participants.map((participant, index) => (
              <li key={index}>{participant}</li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-700">No participants listed.</p>
        )}
      </div>

      {/* Display Summary or Summary Generation */}
      {loadingSummary ? (
        <p className="mb-6 text-center text-gray-500 italic">Generating Summary...</p>
      ) : (
        summary && (
          <div
            className="p-6 border border-gray-300 rounded bg-gray-50 mb-6 animate-fadeIn"
            style={{ animation: 'fadeIn 1s ease forwards' }}
          >
            <h3 className="font-bold text-xl text-gray-700 mb-2">Summary:</h3>
            <p className="text-gray-700 leading-relaxed">{summary}</p>
          </div>
        )
      )}

      {/* Rating Section */}
      <div className="mb-6">
        <h3 className="font-bold text-xl mb-2 text-gray-800">Rate the Session:</h3>
        <Rating sessionId={sessionId} initialRating={session.rating} />
      </div>

      <button
        onClick={() => router.push('/dashboard')}
        className="w-full py-3 bg-pink-600 text-white font-semibold rounded-md shadow hover:shadow-lg transition-transform hover:-translate-y-0.5"
      >
        Back to Dashboard
      </button>
    </div>
  );
}
