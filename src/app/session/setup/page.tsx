'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import useRequireAuth from '@/hooks/useRequireAuth';

export default function SessionSetupPage() {
  useRequireAuth();
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('sessionId');
  const [participants, setParticipants] = useState<string[]>(['']);
  const [timeLimit, setTimeLimit] = useState<number>(60);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!sessionId) {
      alert('Session ID not found.');
      router.push('/dashboard');
    }
  }, [sessionId, router]);

  const handleParticipantChange = (index: number, value: string) => {
    const newParticipants = [...participants];
    newParticipants[index] = value;
    setParticipants(newParticipants);
  };

  const addParticipant = () => {
    setParticipants([...participants, '']);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    // Retrieve the current user id.
    const { data: authData, error: authError } = await supabase.auth.getSession();
    if (authError || !authData.session?.user) {
      setErrorMessage("Authentication error. Please log in again.");
      return;
    }
    const userId = authData.session.user.id;

    // Update session record with participants and time limit.
    const { error } = await supabase
      .from('sessions')
      .update({ participants, time_limit: timeLimit, status: 'active', user_id: userId })
      .eq('id', sessionId);
    if (error) {
      setErrorMessage(error.message);
      return;
    }
    // Redirect to active session page.
    router.push(`/session/${sessionId}`);
  };

  return (
    <Suspense fallback={<div>Loading setup...</div>}>
      <div className="max-w-xl mx-auto p-8 bg-white shadow-lg rounded-xl animate-fadeInUp">
        <h2 className="text-3xl font-bold mb-6 text-gray-800">Session Setup</h2>
        {errorMessage && (
          <div className="mb-6 p-3 bg-red-100 text-red-600 border border-red-200 rounded">
            {errorMessage}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block font-semibold mb-2">Participants:</label>
            {participants.map((participant, index) => (
              <input
                key={index}
                type="text"
                placeholder={`Participant ${index + 1} name`}
                value={participant}
                onChange={(e) => handleParticipantChange(index, e.target.value)}
                className="w-full border border-gray-300 rounded-md p-3 mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            ))}
            <button
              type="button"
              onClick={addParticipant}
              className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md shadow hover:shadow-lg transition-transform hover:-translate-y-0.5"
            >
              Add Participant
            </button>
          </div>
          <div className="mb-6">
            <label className="block font-semibold mb-2">Time Limit per Question (seconds):</label>
            <input
              type="number"
              value={timeLimit}
              onChange={(e) => setTimeLimit(parseInt(e.target.value))}
              className="w-full border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <button
            type="submit"
            className="px-6 py-3 bg-green-600 text-white font-semibold rounded-md shadow hover:shadow-lg transition-transform hover:-translate-y-0.5"
          >
            Start Session
          </button>
        </form>
      </div>
    </Suspense>
  );
}
