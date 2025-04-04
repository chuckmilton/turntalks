// /src/app/dashboard/page.tsx
'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

export default function DashboardPage() {
  const [sessions, setSessions] = useState<any[]>([]);

  useEffect(() => {
    async function fetchSessions() {
      // Fetch sessions created by the logged-in user (adjust filter as needed)
      const { data, error } = await supabase.from('sessions').select('*').order('created_at', { ascending: false });
      if (!error) {
        setSessions(data);
      }
    }
    fetchSessions();
  }, []);

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Dashboard</h2>
      <Link href="/session/create" className="px-4 py-2 bg-green-500 text-white rounded mb-4 inline-block">
        Create New Session
      </Link>
      {sessions.length === 0 ? (
        <p>No sessions found.</p>
      ) : (
        <ul>
          {sessions.map((session) => (
            <li key={session.id} className="border p-2 mb-2">
              <p><strong>Session ID:</strong> {session.id}</p>
              <p><strong>Prompt:</strong> {session.prompt}</p>
              <p><strong>Summary:</strong> {session.summary || 'Pending'}</p>
              <Link href={`/conclusion/${session.id}`} className="text-blue-500">
                View Details
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
