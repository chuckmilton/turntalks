// /src/app/conclusion/[sessionId]/page.tsx
'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Rating from '@/components/Rating';
import { useRouter, useParams } from 'next/navigation';
import useRequireAuth from '@/hooks/useRequireAuth';

export default function ConclusionPage() {
  useRequireAuth();

  const params = useParams();
  const { sessionId } = params as { sessionId: string };
  const [session, setSession] = useState<any>(null);
  const [summary, setSummary] = useState<string>('');
  const [loadingSummary, setLoadingSummary] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState('');
  const router = useRouter();

  // Function to auto-generate summary if it doesn't exist.
  async function handleGenerateSummary(sessionData: any) {
    if (!sessionData) return;
    setLoadingSummary(true);
    try {
      const res = await fetch('/api/generate-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionData }),
      });
      const result = await res.json();
      if (result.error) throw new Error(result.error);
      const summaryText = result.summary;
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
    } catch (err: any) {
      setErrorMessage(err.message);
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
        setSession(data);
        if (data.summary) {
          setSummary(data.summary);
        } else {
          await handleGenerateSummary(data);
        }
      }
    }
    fetchSession();
  }, [sessionId]);

  if (!session) return <p className="text-center mt-10">Loading session data...</p>;

  return (
    <div className="max-w-2xl mx-auto p-8 bg-white shadow-lg rounded-xl animate-fadeInUp">
      {errorMessage && (
        <div className="mb-6 p-3 bg-red-100 text-red-600 border border-red-200 rounded">
          {errorMessage}
        </div>
      )}
      <h2 className="text-3xl font-bold mb-6 text-gray-800">Session Summary</h2>
      {loadingSummary ? (
        <p className="mb-6 text-center text-gray-500 italic">Generating Summary...</p>
      ) : (
        summary && (
          <div className="p-6 border rounded bg-gray-100 mb-6">
            <h3 className="font-bold text-xl text-gray-700 mb-2">Summary:</h3>
            <p className="text-gray-700 leading-relaxed">{summary}</p>
          </div>
        )
      )}
      <div className="mb-6">
        <h3 className="font-bold text-xl mb-2 text-gray-800">Rate the Session:</h3>
        <Rating sessionId={sessionId} initialRating={session.rating} />
      </div>
      <button
        onClick={() => router.push('/dashboard')}
        className="w-full py-3 bg-green-600 text-white font-semibold rounded-md shadow hover:shadow-lg transition-transform hover:-translate-y-0.5"
      >
        Back to Dashboard
      </button>
    </div>
  );
}
