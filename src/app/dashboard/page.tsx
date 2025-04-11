'use client';
import useRequireAuth from '@/hooks/useRequireAuth';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

function truncate(text: string, limit = 50) {
  return text.length > limit ? text.substring(0, limit) + '...' : text;
}

interface Session {
  id: string;
  created_at?: string;
  prompt: string;
  summary?: string;
  rating?: number;
  [key: string]: unknown;
}

interface User {
  id: string;
  user_metadata?: {
    display_name?: string;
    [key: string]: any;
  };
}

export default function DashboardPage() {
  useRequireAuth();

  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSessions, setSelectedSessions] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);

  // Fetch current user.
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        console.error("Error fetching user:", error.message);
      } else {
        setUser(user);
      }
    };
    fetchUser();
  }, []);

  // Fetch sessions from Supabase.
  const fetchSessions = async () => {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      alert(error.message);
    } else {
      setSessions(data as Session[]);
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

  // Toggle "Select All".
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

  // Logout handler.
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  return (
    <div className="bg-white rounded-xl shadow p-6 animate-fadeInUp">
      {/* Welcome message using display name only */}
      <h2 className="text-3xl font-bold mb-2 text-gray-800">
        {user && user.user_metadata?.display_name
          ? `Welcome, ${user.user_metadata.display_name}`
          : "Welcome!"}
      </h2>
      <div className="mb-6 text-right">
        {/* Link to Profile/Settings page */}
        <Link
          href="/profile"
          className="mr-4 px-4 py-2 bg-blue-600 text-white font-semibold rounded-md shadow hover:shadow-lg transition-transform hover:-translate-y-0.5"
        >
          Profile
        </Link>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-pink-600 text-white font-semibold rounded-md shadow hover:shadow-lg transition-transform hover:-translate-y-0.5"
        >
          Logout
        </button>
      </div>

      <div className="flex items-center justify-between mb-6">
        <Link
          href="/session/create"
          className="px-6 py-2 bg-pink-600 text-white font-semibold rounded-md shadow hover:shadow-lg transition-transform hover:-translate-y-0.5"
        >
          Create New Session
        </Link>
        <button
          onClick={handleDeleteSelected}
          className="px-6 py-2 bg-red-600 text-white font-semibold rounded-md shadow hover:shadow-lg transition-transform hover:-translate-y-0.5"
        >
          Delete Selected
        </button>
      </div>
      {sessions.length === 0 ? (
        <p className="text-gray-600 text-center">No sessions found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-pink-50">
                <th className="border p-3 text-center">
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={handleSelectAll}
                  />
                </th>
                <th className="border p-3">Date</th>
                <th className="border p-3">Prompt</th>
                <th className="border p-3">Summary</th>
                <th className="border p-3">Rating</th>
                <th className="border p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((session, index) => (
                <tr
                  key={session.id}
                  className={`transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                >
                  <td className="border p-3 text-center">
                    <input
                      type="checkbox"
                      checked={selectedSessions.includes(session.id)}
                      onChange={() => handleSelectSession(session.id)}
                    />
                  </td>
                  <td className="border p-3">
                    {session.created_at
                      ? new Date(session.created_at).toLocaleDateString()
                      : 'N/A'}
                  </td>
                  <td className="border p-3">{truncate(session.prompt, 50)}</td>
                  <td className="border p-3">
                    {session.summary ? truncate(session.summary, 50) : 'Pending'}
                  </td>
                  <td className="border p-3">
                    {session.rating ? (
                      <span className="bg-yellow-300 px-2 py-1 rounded font-semibold">
                        {session.rating}
                      </span>
                    ) : (
                      'Not Rated'
                    )}
                  </td>
                  <td className="border p-3">
                    <Link
                      href={`/conclusion/${session.id}`}
                      className="text-pink-600 hover:underline"
                    >
                      View Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
