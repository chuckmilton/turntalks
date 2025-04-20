'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { User } from '@supabase/supabase-js';
import { motion } from 'framer-motion';

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getSession() {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();
      if (error) {
        console.error('Error getting session:', error);
        setUser(null);
      } else {
        setUser(session?.user ?? null);
      }
      setLoading(false);
    }
    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return <p className="text-center mt-10 text-gray-700">Loading...</p>;
  }

  // Animation variants for section transitions
  const sectionVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number = 0) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.2, duration: 0.6, ease: "easeOut" },
    }),
  };

  return (
    <>
      {/* Hero Section */}
      <motion.section
        initial="hidden"
        animate="visible"
        custom={0}
        variants={sectionVariants}
        className="relative bg-gradient-to-r from-pink-500 to-orange-500 rounded-xl shadow-lg overflow-hidden mb-16"
      >
        <div className="px-8 py-20 text-center text-white">
          <motion.h1
            className="text-5xl font-extrabold mb-6 drop-shadow-lg"
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            Welcome to TurnTalks
          </motion.h1>
          <motion.p
            className="mb-10 text-xl max-w-3xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            Dive into engaging AI-powered book clubs, create sessions, and share your ideas in an inspiring community.
          </motion.p>
          <div className="flex justify-center space-x-6">
            {user ? (
              <Link
                href="/dashboard"
                className="px-8 py-3 bg-white text-pink-600 font-semibold rounded-md shadow hover:shadow-lg transition transform hover:-translate-y-1"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="px-8 py-3 bg-white text-pink-600 font-semibold rounded-md shadow hover:shadow-lg transition transform hover:-translate-y-1"
                >
                  Login
                </Link>
                <Link
                  href="/auth/signup"
                  className="px-8 py-3 bg-pink-600 text-white font-semibold rounded-md shadow hover:shadow-lg transition transform hover:-translate-y-1"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </motion.section>

      {/* Features Section */}
      <motion.section
        initial="hidden"
        animate="visible"
        custom={1}
        variants={sectionVariants}
        className="mb-16 max-w-7xl mx-auto px-6"
      >
        <h2 className="text-3xl font-bold text-center mb-10">What We Offer</h2>
        <div className="grid gap-10 md:grid-cols-3">
          <div className="bg-white rounded-xl p-6 shadow hover:shadow-xl transition-shadow duration-300">
            <h3 className="text-xl font-semibold mb-3">Interactive Sessions</h3>
            <p className="text-gray-600">
              Engage with dynamic discussions and explore thought-provoking topics powered by AI.
            </p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow hover:shadow-xl transition-shadow duration-300">
            <h3 className="text-xl font-semibold mb-3">Community Driven</h3>
            <p className="text-gray-600">
              Connect, share insights, and foster a vibrant community of avid readers.
            </p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow hover:shadow-xl transition-shadow duration-300">
            <h3 className="text-xl font-semibold mb-3">Modern Interface</h3>
            <p className="text-gray-600">
              Enjoy a seamless user experience with a clean, modern design and smooth interactions.
            </p>
          </div>
        </div>
      </motion.section>

      {/* Call to Action Section */}
      <motion.section
        initial="hidden"
        animate="visible"
        custom={2}
        variants={sectionVariants}
        className="bg-white rounded-xl shadow-lg overflow-hidden mb-16 mx-6"
      >
        <div className="px-8 py-16 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Discussions?</h2>
          <p className="mb-8 text-gray-700 max-w-2xl mx-auto">
            Join our community today and experience the future of interactive book clubs.
          </p>
          <div className="flex justify-center space-x-6">
            {user ? (
              <Link
                href="/dashboard"
                className="px-8 py-3 bg-pink-600 text-white font-semibold rounded-md shadow hover:shadow-xl transition transform hover:-translate-y-1"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="px-8 py-3 bg-pink-600 text-white font-semibold rounded-md shadow hover:shadow-xl transition transform hover:-translate-y-1"
                >
                  Login
                </Link>
                <Link
                  href="/auth/signup"
                  className="text-nowrap px-8 py-3 bg-gray-200 text-gray-800 font-semibold rounded-md shadow hover:shadow-xl transition transform hover:-translate-y-1"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </motion.section>
    </>
  );
}
