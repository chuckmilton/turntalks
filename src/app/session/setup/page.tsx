'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import useRequireAuth from '@/hooks/useRequireAuth';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';

function SessionSetupContent() {
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

  const removeParticipant = (index: number) => {
    // Ensure that there is at least one participant remaining.
    if (participants.length > 1) {
      setParticipants((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    // Play the select sound on button click.
    const selectSound = new Audio('/select-sound.mp3');
    try {
      await selectSound.play();
    } catch (err) {
      console.error("Error playing select sound:", err);
    }

    // Retrieve the current user id.
    const { data, error: authError } = await supabase.auth.getSession();
    if (authError || !data.session?.user) {
      setErrorMessage("Authentication error. Please log in again.");
      return;
    }
    const userId = data.session.user.id;

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
    <div className="w-full max-w-xl mx-auto p-8 bg-white shadow-lg rounded-xl animate-fadeInUp">
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
            <div key={index} className="flex items-center gap-2 mb-2">
              <input
                type="text"
                placeholder={`Participant ${index + 1} name`}
                value={participant}
                onChange={(e) => handleParticipantChange(index, e.target.value)}
                className="w-full border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-pink-500"
                required
              />
              {participants.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeParticipant(index)}
                  className="text-red-600 hover:text-red-800 transition"
                  title="Remove participant"
                >
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addParticipant}
            className="px-4 py-2 bg-pink-600 text-white font-semibold rounded-md shadow hover:shadow-lg transition-transform hover:-translate-y-0.5"
          >
            Add Participant
          </button>
        </div>
        <div className="mb-6">
          <label className="block font-semibold mb-2">
            Time Limit per Question (seconds):
          </label>
          <input
            type="number"
            value={timeLimit.toString()}
            onChange={(e) => setTimeLimit(parseInt(e.target.value))}
            className="w-full border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-pink-500"
            required
          />
        </div>
        <button
          type="submit"
          className="px-6 py-3 bg-pink-600 hover:bg-pink-700 text-white font-semibold rounded-md shadow hover:shadow-lg transition-transform hover:-translate-y-0.5"
        >
          Start Session
        </button>
      </form>
    </div>
  );
}

export default function SessionSetupPage() {
  return (
    <Suspense fallback={<div>Loading setup...</div>}>
      <SessionSetupContent />
    </Suspense>
  );
}
