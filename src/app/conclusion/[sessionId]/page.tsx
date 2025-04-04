'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Rating from '@/components/Rating';
import { useRouter, useParams } from 'next/navigation';

export default function ConclusionPage() {
  // Unwrap route parameters using useParams()
  const params = useParams();
  const { sessionId } = params as { sessionId: string };
  const [session, setSession] = useState<any>(null);
  const [summary, setSummary] = useState<string>('');
  const [loadingSummary, setLoadingSummary] = useState<boolean>(false);
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
      // Save summary to Supabase and mark session as finished (only if not already set).
      if (!sessionData.summary) {
        const { error } = await supabase
          .from('sessions')
          .update({ summary: summaryText, status: 'finished' })
          .eq('id', sessionId);
        if (error) {
          alert(error.message);
        }
      }
    } catch (err: any) {
      alert(err.message);
    }
    setLoadingSummary(false);
  }

  // Fetch session details on mount and auto-generate summary if missing.
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
        if (data.summary) {
          setSummary(data.summary);
        } else {
          // Auto-generate summary only once if it's not present.
          await handleGenerateSummary(data);
        }
      }
    }
    fetchSession();
  }, [sessionId]);

  if (!session) return <p>Loading session data...</p>;

  return (
    <div className="max-w-2xl mx-auto p-4 bg-white shadow rounded">
      <h2 className="text-2xl font-bold mb-4 text-gray-700">Session Summary: {sessionId}</h2>
      {loadingSummary ? (
        <p className="mb-4">Generating Summary...</p>
      ) : (
        summary && (
          <div className="p-4 border rounded bg-gray-100 mb-4">
            <h3 className="font-bold text-gray-700">Summary:</h3>
            <p className="text-gray-700">{summary}</p>
          </div>
        )
      )}
      <div>
        <h3 className="font-bold mb-2 text-gray-700">Rate the Session:</h3>
        {/* Pass the stored rating to the Rating component */}
        <Rating sessionId={sessionId} initialRating={session.rating} />
      </div>
      <button
        onClick={() => router.push('/dashboard')}
        className="mt-4 px-4 py-2 bg-green-500 text-white rounded"
      >
        Back to Dashboard
      </button>
    </div>
  );
}
