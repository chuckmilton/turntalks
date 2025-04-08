// /src/app/auth/login/page.tsx
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import useRedirectIfAuth from '@/hooks/useRedirectIfAuth';

export default function LoginPage() {
  useRedirectIfAuth();

  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(''); // Clear previous errors
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      // Instead of using alert, display the error inline.
      setErrorMessage(error.message);
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <div className="max-w-xl mx-auto my-10 p-10 bg-white shadow-lg rounded-xl animate-fadeInUp">
      <h2 className="text-4xl font-bold mb-6 text-center text-gray-800">Login</h2>
      {/* Inline error message */}
      {errorMessage && (
        <div className="mb-6 p-3 bg-red-100 text-red-600 border border-red-200 rounded">
          {errorMessage}
        </div>
      )}
      <form onSubmit={handleLogin}>
        <label className="block mb-4">
          <span className="block text-gray-700 font-semibold mb-1">Email:</span>
          <input
            type="email"
            className="w-full border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label className="block mb-6">
          <span className="block text-gray-700 font-semibold mb-1">Password:</span>
          <input
            type="password"
            className="w-full border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        <button
          type="submit"
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md shadow hover:shadow-lg transition-transform hover:-translate-y-0.5"
        >
          Login
        </button>
      </form>
      <p className="mt-6 text-center text-gray-600">
        Don't have an account?{' '}
        <Link href="/auth/signup" className="text-blue-600 hover:text-blue-700 font-bold">
          Sign Up
        </Link>
      </p>
    </div>
  );
}
