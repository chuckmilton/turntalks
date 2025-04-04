'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

export default function DashboardPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedSessions, setSelectedSessions] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState<boolean>(false);

  // Fetch sessions from Supabase
  const fetchSessions = async () => {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      alert(error.message);
    } else {
      setSessions(data);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  // Handle selecting/unselecting an individual session.
  const handleSelectSession = (sessionId: string) => {
    if (selectedSessions.includes(sessionId)) {
      setSelectedSessions(selectedSessions.filter((id) => id !== sessionId));
    } else {
      setSelectedSessions([...selectedSessions, sessionId]);
    }
  };

  // Toggle "Select All"
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedSessions([]);
      setSelectAll(false);
    } else {
      const allIds = sessions.map((session) => session.id);
      setSelectedSessions(allIds);
      setSelectAll(true);
    }
  };

  // Delete the selected sessions.
  const handleDeleteSelected = async () => {
    if (selectedSessions.length === 0) {
      alert('No sessions selected for deletion.');
      return;
    }
    if (!confirm('Are you sure you want to delete the selected sessions?')) return;

    const { error } = await supabase
      .from('sessions')
      .delete()
      .in('id', selectedSessions);
    if (error) {
      alert(error.message);
      return;
    }
    // Refresh sessions and reset selection.
    await fetchSessions();
    setSelectedSessions([]);
    setSelectAll(false);
  };

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Dashboard</h2>
      <div className="mb-4">
        <Link
          href="/session/create"
          className="px-4 py-2 bg-green-500 text-white rounded mb-4 inline-block"
        >
          Create New Session
        </Link>
      </div>
      <div className="mb-4">
        <button
          onClick={handleDeleteSelected}
          className="px-4 py-2 bg-red-500 text-white rounded"
        >
          Delete Selected
        </button>
      </div>
      {sessions.length === 0 ? (
        <p>No sessions found.</p>
      ) : (
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="border p-2">
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={handleSelectAll}
                />
              </th>
              <th className="border p-2">Session ID</th>
              <th className="border p-2">Prompt</th>
              <th className="border p-2">Summary</th>
              <th className="border p-2">Rating</th>
              <th className="border p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((session) => (
              <tr key={session.id}>
                <td className="border p-2 text-center">
                  <input
                    type="checkbox"
                    checked={selectedSessions.includes(session.id)}
                    onChange={() => handleSelectSession(session.id)}
                  />
                </td>
                <td className="border p-2">{session.id}</td>
                <td className="border p-2">{session.prompt}</td>
                <td className="border p-2">{session.summary || 'Pending'}</td>
                <td className="border p-2">
                  {session.rating ? (
                    <span className="bg-yellow-300 p-1 rounded">{session.rating}</span>
                  ) : (
                    'Not Rated'
                  )}
                </td>
                <td className="border p-2">
                  <Link href={`/conclusion/${session.id}`} className="text-blue-500">
                    View Details
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
