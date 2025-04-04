// /src/app/session/setup/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function SessionSetupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('sessionId');
  const [participants, setParticipants] = useState<string[]>(['']);
  const [timeLimit, setTimeLimit] = useState<number>(60);

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
    // Update session record with participants and time limit
    const { error } = await supabase
      .from('sessions')
      .update({ participants, time_limit: timeLimit, status: 'active' })
      .eq('id', sessionId);
    if (error) {
      alert(error.message);
      return;
    }
    // Redirect to active session page
    router.push(`/session/${sessionId}`);
  };

  return (
    <div className="max-w-xl mx-auto p-4 bg-white shadow rounded">
      <h2 className="text-2xl font-bold mb-4">Session Setup</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block font-bold mb-1">Participants:</label>
          {participants.map((participant, index) => (
            <input
              key={index}
              type="text"
              placeholder={`Participant ${index + 1} name`}
              value={participant}
              onChange={(e) => handleParticipantChange(index, e.target.value)}
              className="w-full border p-2 mb-2"
              required
            />
          ))}
          <button type="button" onClick={addParticipant} className="px-4 py-2 bg-blue-500 text-white rounded">
            Add Participant
          </button>
        </div>
        <div className="mb-4">
          <label className="block font-bold mb-1">Time Limit per Question (seconds):</label>
          <input
            type="number"
            value={timeLimit}
            onChange={(e) => setTimeLimit(parseInt(e.target.value))}
            className="w-full border p-2"
            required
          />
        </div>
        <button type="submit" className="px-4 py-2 bg-green-500 text-white rounded">
          Start Session
        </button>
      </form>
    </div>
  );
}
