"use client";
import useRequireAuth from "@/hooks/useRequireAuth";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

// Helper function to truncate text.
function truncate(text: string, limit = 50) {
  return text.length > limit ? text.substring(0, limit) + "..." : text;
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
    [key: string]: unknown;
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
      .from("sessions")
      .select("*")
      .order("created_at", { ascending: false });
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
      alert("No sessions selected for deletion.");
      return;
    }
    if (!confirm("Are you sure you want to delete the selected sessions?")) return;

    const { error } = await supabase
      .from("sessions")
      .delete()
      .in("id", selectedSessions);
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
    router.push("/auth/login");
  };

  // Framer Motion Variants.
  const containerVariant = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: "easeOut" },
    },
  };

  const itemVariant = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariant}
      className="rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen p-8"
    >
      {/* Header Section with energetic background */}
      <motion.div
        variants={itemVariant}
        className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-2xl p-8 mb-10 text-white flex flex-col sm:flex-row items-center justify-between"
      >
        <div>
          <h2 className="text-3xl font-bold">
            {user?.user_metadata?.display_name
              ? `Hello, ${user.user_metadata.display_name}!`
              : "Welcome!"}
          </h2>
          <p className="mt-2 text-lg">Your sessions at a glance.</p>
        </div>
        <div className="flex space-x-4 mt-4 sm:mt-0">
          <Link
            href="/profile"
            className="flex items-center px-4 py-2 bg-blue-700 rounded-md shadow hover:shadow-xl transition transform hover:-translate-y-1"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5.121 17.804A9 9 0 1118.364 6.636 9 9 0 015.121 17.804z"
              ></path>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              ></path>
            </svg>
            Profile
          </Link>
          <button
            onClick={() => {
              if (window.confirm("Are you sure you want to log out?")) {
                handleLogout(); // Only log out if they confirm
              }
            }}
            className="flex items-center px-4 py-2 bg-pink-700 rounded-md shadow hover:shadow-xl transition transform hover:-translate-y-1"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M17 16l4-4m0 0l-4-4m4 4H7"
              ></path>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M7 16v1a3 3 0 003 3h4a3 3 0 003-3v-1"
              ></path>
            </svg>
            Logout
          </button>
        </div>
      </motion.div>

      {/* Actions Section */}
      <motion.div
        variants={itemVariant}
        className="flex flex-col sm:flex-row items-center justify-between mb-8"
      >
        <Link
          href="/session/create"
          className="flex items-center px-6 py-3 bg-pink-600 text-white font-semibold rounded-md shadow hover:shadow-xl transition transform hover:-translate-y-1 mb-4 sm:mb-0"
        >
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 4v16m8-8H4"
            ></path>
          </svg>
          Create New Session
        </Link>
        {/* Only show Delete Selected button if any sessions are checked */}
        {selectedSessions.length > 0 && (
          <button
            onClick={handleDeleteSelected}
            className="flex items-center px-4 py-2 text-red-600 font-semibold rounded-md transition hover:underline"
          >
            <svg
              className="w-4 h-4 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3"
              ></path>
            </svg>
            Delete Selected
          </button>
        )}
      </motion.div>

      {/* Sessions Table */}
      {sessions.length === 0 ? (
        <p className="text-gray-600 text-center">No sessions found.</p>
      ) : (
        <motion.div variants={itemVariant} className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="bg-pink-50">
              <tr>
                <th className="border p-3 text-center">
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={handleSelectAll}
                  />
                </th>
                <th className="border p-3 text-left">Date</th>
                <th className="border p-3 text-left">Prompt</th>
                <th className="border p-3 text-left">Summary</th>
                <th className="border p-3 text-center">Rating</th>
                <th className="border p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((session, index) => (
                <motion.tr
                  key={session.id}
                  initial="hidden"
                  animate="visible"
                  variants={itemVariant}
                  className={`transition-colors ${
                    index % 2 === 0 ? "bg-white" : "bg-gray-50"
                  }`}
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
                      : "N/A"}
                  </td>
                  <td className="border p-3">{truncate(session.prompt, 50)}</td>
                  <td className="border p-3">
                    {session.summary
                      ? truncate(session.summary, 50)
                      : "Pending"}
                  </td>
                  <td className="border p-3 text-center">
                    {session.rating ? (
                      <span className="bg-yellow-300 text-yellow-900 px-2 py-1 rounded font-semibold">
                        {session.rating}
                      </span>
                    ) : (
                      "Not Rated"
                    )}
                  </td>
                  <td className="border p-3 text-center">
                    <Link
                      href={`/conclusion/${session.id}`}
                      className="flex items-center text-pink-600 hover:underline justify-center"
                    >
                      <svg
                        className="w-5 h-5 mr-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                      </svg>
                      View Details
                    </Link>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      )}
    </motion.div>
  );
}
