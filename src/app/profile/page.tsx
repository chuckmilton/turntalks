'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import useRequireAuth from '@/hooks/useRequireAuth';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  useRequireAuth();
  const router = useRouter();

  // Profile update state.
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  
  // Change password state.
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  
  // Loading and messages.
  const [loading, setLoading] = useState(true);
  const [profileMessage, setProfileMessage] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [deleteMessage, setDeleteMessage] = useState('');

  // Fetch current user and fill in the fields.
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        setProfileMessage(`Error fetching user: ${error.message}`);
      } else if (user) {
        setDisplayName(user.user_metadata?.display_name || '');
        setEmail(user.email || '');
      }
      setLoading(false);
    };
    fetchUser();
  }, []);

  // Handle updating profile info.
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMessage('');
    // Update user profile (display name and email).
    const { error } = await supabase.auth.updateUser({
      email,
      data: { display_name: displayName },
    });
    if (error) {
      setProfileMessage(`Error: ${error.message}`);
    } else {
      setProfileMessage("Profile updated successfully.");
    }
  };

  // Handle changing password.
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage('');
    if (newPassword !== confirmNewPassword) {
      setPasswordMessage("New passwords do not match.");
      return;
    }
    // Update password.
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setPasswordMessage(`Error: ${error.message}`);
    } else {
      setPasswordMessage("Password updated successfully.");
      setNewPassword('');
      setConfirmNewPassword('');
    }
  };

  // Handle deleting the account.
  const handleDeleteAccount = async () => {
    setDeleteMessage('');
    if (!confirm("Are you sure you want to delete your account? This cannot be undone.")) {
      return;
    }
    // Call a server-side API to delete the account securely.
    try {
      const res = await fetch('/api/delete-account', { method: 'POST' });
      const result = await res.json();
      if (!res.ok) {
        setDeleteMessage(result.error || "Error deleting account.");
        return;
      }
      // Successfully deleted user, so sign out and redirect.
      await supabase.auth.signOut();
      router.push('/auth/signup');
    } catch (err: any) {
      setDeleteMessage(`Error: ${err.message}`);
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="w-full max-w-2xl mx-auto my-10 p-10 bg-white shadow-lg rounded-xl animate-fadeInUp">
      <h2 className="text-3xl font-bold mb-6 text-center">Profile Settings</h2>
      
      {/* Profile Update Section */}
      {profileMessage && (
        <div className="mb-6 p-3 bg-green-100 text-green-600 border border-green-200 rounded">
          {profileMessage}
        </div>
      )}
      <form onSubmit={handleProfileUpdate} className="mb-10">
        <label className="block mb-4">
          <span className="block text-gray-700 font-semibold mb-1">Display Name:</span>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-pink-500"
            required
          />
        </label>
        <label className="block mb-6">
          <span className="block text-gray-700 font-semibold mb-1">Email:</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-pink-500"
            required
          />
        </label>
        <button
          type="submit"
          className="w-full py-3 bg-pink-600 hover:bg-pink-700 text-white font-semibold rounded-md shadow hover:shadow-lg transition-transform hover:-translate-y-0.5"
        >
          Update Profile
        </button>
      </form>

      {/* Change Password Section */}
      {passwordMessage && (
        <div className="mb-6 p-3 bg-green-100 text-green-600 border border-green-200 rounded">
          {passwordMessage}
        </div>
      )}
      <form onSubmit={handleChangePassword} className="mb-10">
        <h3 className="text-2xl font-bold mb-4 text-center">Change Password</h3>
        <label className="block mb-4">
          <span className="block text-gray-700 font-semibold mb-1">New Password:</span>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-pink-500"
            required
          />
        </label>
        <label className="block mb-6">
          <span className="block text-gray-700 font-semibold mb-1">Confirm New Password:</span>
          <input
            type="password"
            value={confirmNewPassword}
            onChange={(e) => setConfirmNewPassword(e.target.value)}
            className="w-full border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-pink-500"
            required
          />
        </label>
        <button
          type="submit"
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md shadow hover:shadow-lg transition-transform hover:-translate-y-0.5"
        >
          Change Password
        </button>
      </form>

      {/* Delete Account Section */}
      {deleteMessage && (
        <div className="mb-6 p-3 bg-red-100 text-red-600 border border-red-200 rounded">
          {deleteMessage}
        </div>
      )}
      <div>
        <button
          onClick={handleDeleteAccount}
          className="w-full py-3 bg-red-700 hover:bg-red-800 text-white font-semibold rounded-md shadow hover:shadow-lg transition-transform hover:-translate-y-0.5"
        >
          Delete Account
        </button>
      </div>
    </div>
  );
}
