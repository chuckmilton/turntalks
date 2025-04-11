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
  const [resetMessage, setResetMessage] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(''); // Clear previous errors
    setResetMessage(''); // Clear previous reset messages

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      // Display the error inline
      setErrorMessage(error.message);
    } else {
      router.push('/dashboard');
    }
  };

  const handleForgotPassword = async () => {
    setErrorMessage('');
    setResetMessage('');
    if (!email) {
      setErrorMessage("Please enter your email address to reset your password.");
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      // Update this URL to the appropriate password reset page in your app.
      redirectTo: 'http://localhost:3000/auth/reset',
    });
    if (error) {
      setErrorMessage(error.message);
    } else {
      setResetMessage("Password reset email has been sent. Please check your inbox.");
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto my-10 p-10 bg-white shadow-lg rounded-xl animate-fadeInUp">
      <h2 className="text-4xl font-bold mb-6 text-center text-gray-800">Login</h2>
      {/* Display error messages */}
      {errorMessage && (
        <div className="mb-6 p-3 bg-red-100 text-red-600 border border-red-200 rounded">
          {errorMessage}
        </div>
      )}
      {resetMessage && (
        <div className="mb-6 p-3 bg-green-100 text-green-600 border border-green-200 rounded">
          {resetMessage}
        </div>
      )}
      <form onSubmit={handleLogin}>
        <label className="block mb-4">
          <span className="block text-gray-700 font-semibold mb-1">Email:</span>
          <input
            type="email"
            className="w-full border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-pink-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label className="block mb-6">
          <span className="block text-gray-700 font-semibold mb-1">Password:</span>
          <input
            type="password"
            className="w-full border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-pink-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        <button
          type="submit"
          className="w-full py-3 bg-pink-600 hover:bg-pink-700 text-white font-semibold rounded-md shadow hover:shadow-lg transition-transform hover:-translate-y-0.5"
        >
          Login
        </button>
      </form>
      <p className="mt-4 text-center">
        <button
          type="button"
          onClick={handleForgotPassword}
          className="text-pink-600 hover:text-pink-700 font-bold"
        >
          Forgot Password?
        </button>
      </p>
      <p className="mt-6 text-center text-gray-600">
        Don&apos;t have an account?{' '}
        <Link href="/auth/signup" className="text-pink-600 hover:text-pink-700 font-bold">
          Sign Up
        </Link>
      </p>
    </div>
  );
}
