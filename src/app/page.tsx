'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { User } from '@supabase/supabase-js';

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get the current session and update state.
    async function getSession() {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Error getting session:', error);
        // If there's an "Invalid Refresh Token" error, set user to null.
        setUser(null);
      } else {
        setUser(session?.user ?? null);
      }
      setLoading(false);
    }
    getSession();

    // Subscribe to auth changes.
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      // Unsubscribe from auth listener
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Optionally show a loading message while checking auth status.
  if (loading) {
    return <p className="text-center mt-10 text-white">Loading...</p>;
  }

  return (
    <div className="relative bg-gradient-to-r from-pink-500 to-orange-500 rounded-xl shadow-lg overflow-hidden">
      {/* Hero Section */}
      <div className="px-8 py-16 text-center text-white">
        <h2 className="text-4xl font-extrabold mb-4 drop-shadow-md">
          Welcome to TurnTalks
        </h2>
        <p className="mb-8 text-lg max-w-2xl mx-auto">
          Create sessions, join interactive discussions, and let AI help you transform your ideas!
        </p>
        <div className="flex justify-center space-x-4">
          {user ? (
            <Link
              href="/dashboard"
              className="px-6 py-3 bg-white text-pink-600 font-semibold rounded-md shadow hover:shadow-lg transition transform hover:-translate-y-0.5"
            >
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="px-6 py-3 bg-white text-pink-600 font-semibold rounded-md shadow hover:shadow-lg transition transform hover:-translate-y-0.5"
              >
                Login
              </Link>
              <Link
                href="/auth/signup"
                className="px-6 py-3 bg-pink-600 text-white font-semibold rounded-md shadow hover:shadow-lg transition transform hover:-translate-y-0.5"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
