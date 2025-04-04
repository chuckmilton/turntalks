'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Rating from '@/components/Rating';
import { useRouter, useParams } from 'next/navigation';

export default function ConclusionPage() {
  // Use useParams() to get the dynamic route parameters
  const params = useParams();
  const { sessionId } = params as { sessionId: string };
  const [session, setSession] = useState<any>(null);
  const [summary, setSummary] = useState<string>('');
  const [loadingSummary, setLoadingSummary] = useState(false);
  const router = useRouter();

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
      }
    }
    fetchSession();
  }, [sessionId]);

  const handleGenerateSummary = async () => {
    if (!session) return;
    setLoadingSummary(true);
    try {
      const res = await fetch('/api/generate-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionData: session }),
      });
      const result = await res.json();
      if (result.error) throw new Error(result.error);
      const summaryText = result.summary;
      setSummary(summaryText);
      // Save summary to Supabase and mark session as finished
      const { error } = await supabase
        .from('sessions')
        .update({ summary: summaryText, status: 'finished' })
        .eq('id', sessionId);
      if (error) {
        alert(error.message);
      }
    } catch (err: any) {
      alert(err.message);
    }
    setLoadingSummary(false);
  };

  if (!session) return <p>Loading session data...</p>;

  return (
    <div className="max-w-2xl mx-auto p-4 bg-white shadow rounded">
      <h2 className="text-2xl font-bold mb-4">Session Summary: {sessionId}</h2>
      <button
        onClick={handleGenerateSummary}
        className="mb-4 px-4 py-2 bg-blue-500 text-white rounded"
      >
        {loadingSummary ? 'Generating Summary...' : 'Generate Summary'}
      </button>
      {summary && (
        <div className="p-4 border rounded bg-gray-100 mb-4">
          <h3 className="font-bold">Summary:</h3>
          <p>{summary}</p>
        </div>
      )}
      <div>
        <h3 className="font-bold mb-2">Rate the Session:</h3>
        <Rating sessionId={sessionId} />
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
