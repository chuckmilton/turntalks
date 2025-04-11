'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    // Supabase automatically detects the recovery token from the URL.
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setErrorMessage(error.message);
    } else {
      setSuccessMessage('Password updated successfully. Redirecting to dashboard...');
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    }
  };

  return (
    <div className="max-w-xl mx-auto my-10 p-10 bg-white shadow-lg rounded-xl">
      <h2 className="text-3xl font-bold mb-6 text-center">Reset Password</h2>
      {errorMessage && (
        <div className="mb-4 p-3 bg-red-100 text-red-600 border border-red-200 rounded">
          {errorMessage}
        </div>
      )}
      {successMessage && (
        <div className="mb-4 p-3 bg-green-100 text-green-600 border border-green-200 rounded">
          {successMessage}
        </div>
      )}
      <form onSubmit={handleReset}>
        <label className="block mb-4">
          <span className="block text-gray-700 font-semibold mb-1">New Password:</span>
          <input
            type="password"
            className="w-full border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-pink-500"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
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
        {/* Only show the Reset Password button if successMessage is not set */}
        {!successMessage && (
          <button
            type="submit"
            className="w-full py-3 bg-pink-600 hover:bg-pink-700 text-white font-semibold rounded-md shadow transition-transform hover:-translate-y-0.5"
          >
            Reset Password
          </button>
        )}
      </form>
    </div>
  );
}
