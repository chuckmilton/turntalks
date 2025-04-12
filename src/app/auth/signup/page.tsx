'use client';
import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import useRedirectIfAuth from '@/hooks/useRedirectIfAuth';

export default function SignupPage() {
  useRedirectIfAuth();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    });

    if (error) {
      if (
        error.message.toLowerCase().includes("duplicate") ||
        error.message.toLowerCase().includes("already registered")
      ) {
        setErrorMessage("This email is already registered. Please log in instead.");
      } else {
        setErrorMessage(error.message);
      }
    } else {
      setSuccessMessage(
        "A confirmation email has been sent to your email address. Please check your inbox to complete your registration. If you already have an account, please use the 'Forgot Password' option."
      );
    }
  };

  // Google Signup using Supabase default flow
  const handleGoogleSignup = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      // Use the default Supabase callback URL by not overriding redirectTo or queryParams.
    });
    if (error) setErrorMessage(error.message);
  };

  return (
    <div className="w-full max-w-lg mx-auto my-10 p-10 bg-white shadow-lg rounded-xl animate-fadeInUp">
      <h2 className="text-4xl font-bold mb-6 text-center text-gray-800">Sign Up</h2>
      {errorMessage && (
        <div className="mb-6 p-3 bg-red-100 text-red-600 border border-red-200 rounded">
          {errorMessage}
        </div>
      )}
      {successMessage && (
        <div className="mb-6 p-3 bg-green-100 text-green-600 border border-green-200 rounded">
          {successMessage}
        </div>
      )}

      {/* Google Signup Button with your custom Google icon */}
      <button
        type="button"
        onClick={handleGoogleSignup}
        className="w-full flex items-center justify-center gap-3 py-3 mb-6 border border-gray-300 rounded-md shadow hover:shadow-lg transition-colors hover:bg-gray-100"
      >
        <img src="/google-icon.svg" alt="Google Logo" className="w-5 h-5" />
        <span>Sign up with Google</span>
      </button>

      {/* Only display the email/password form if there's no success message */}
      {!successMessage && (
        <form onSubmit={handleSignup}>
          <label className="block mb-4">
            <span className="block text-gray-700 font-semibold mb-1">Display Name:</span>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-pink-500"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
            />
          </label>
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
          <label className="block mb-4">
            <span className="block text-gray-700 font-semibold mb-1">Password:</span>
            <input
              type="password"
              className="w-full border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-pink-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          <label className="block mb-6">
            <span className="block text-gray-700 font-semibold mb-1">Confirm Password:</span>
            <input
              type="password"
              className="w-full border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-pink-500"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </label>
          <button
            type="submit"
            className="w-full py-3 bg-pink-600 hover:bg-pink-700 text-white font-semibold rounded-md shadow hover:shadow-lg transition-transform hover:-translate-y-0.5"
          >
            Sign Up
          </button>
        </form>
      )}
      <p className="mt-6 text-center text-gray-600">
        Already have an account?{' '}
        <Link href="/auth/login" className="text-pink-600 hover:text-pink-700 font-bold">
          Login
        </Link>
      </p>
    </div>
  );
}
