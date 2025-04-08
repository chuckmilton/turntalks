// /src/app/session/create/page.tsx
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import useRequireAuth from '@/hooks/useRequireAuth';

export default function CreateSessionPage() {
  useRequireAuth();

  const router = useRouter();
  const [prompt, setPrompt] = useState('');
  const [endGoal, setEndGoal] = useState('');
  // Store the number as a string for smooth editing.
  const [numQuestionsStr, setNumQuestionsStr] = useState("5");
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Retrieve the current session data to get the authenticated user's ID.
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData.session?.user) {
      alert("You must be logged in to create a session.");
      return;
    }
    const userId = sessionData.session.user.id;

    // Convert the string to a number; default to 1 if invalid.
    const numQuestions = parseInt(numQuestionsStr, 10);
    const validNumQuestions = isNaN(numQuestions) || numQuestions < 1 ? 1 : numQuestions;

    let pdfUrl = null;
    if (pdfFile) {
      // Upload PDF to Supabase Storage (bucket "pdfs" must exist)
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('pdfs')
        .upload(`pdfs/${Date.now()}_${pdfFile.name}`, pdfFile);
      if (uploadError) {
        alert(uploadError.message);
        return;
      }
      pdfUrl = supabase.storage.from('pdfs').getPublicUrl(uploadData.path).data.publicUrl;
    }

    // Create session record in Supabase including the user_id.
    const { data, error } = await supabase
      .from('sessions')
      .insert([
        {
          prompt,
          end_goal: endGoal,
          num_questions: validNumQuestions,
          pdf_url: pdfUrl,
          participants: [],
          time_limit: 0,
          answers: [],
          status: 'created',
          user_id: userId, // <- Include the authenticated user's ID
        },
      ])
      .select();
    if (error) {
      alert(error.message);
      return;
    }
    const newSession = data[0];
    // Redirect to participant setup with the new session ID
    router.push(`/session/setup?sessionId=${newSession.id}`);
  };

  return (
    <div className="max-w-xl mx-auto p-8 bg-white shadow-lg rounded-xl animate-fadeInUp">
      <h2 className="text-3xl font-bold mb-6 text-gray-800">Create a New Session</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <label className="block font-semibold mb-2">AI Prompt:</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div className="mb-6">
          <label className="block font-semibold mb-2">End Goal:</label>
          <input
            type="text"
            value={endGoal}
            onChange={(e) => setEndGoal(e.target.value)}
            className="w-full border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div className="mb-6">
          <label className="block font-semibold mb-2">Number of Questions:</label>
          <input
            type="number"
            min="1"
            value={numQuestionsStr}
            onChange={(e) => setNumQuestionsStr(e.target.value)}
            onBlur={() => {
              const value = parseInt(numQuestionsStr, 10);
              if (isNaN(value) || value < 1) {
                setNumQuestionsStr("1");
              }
            }}
            className="w-full border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div className="mb-6">
          <label className="block font-semibold mb-2">Upload Reference PDF (optional):</label>
          <input
            type="file"
            accept=".pdf"
            onChange={(e) => setPdfFile(e.target.files ? e.target.files[0] : null)}
            className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>
        <button
          type="submit"
          className="px-6 py-3 bg-green-600 text-white font-semibold rounded-md shadow hover:shadow-lg transition-transform hover:-translate-y-0.5"
        >
          Next: Participant Setup
        </button>
      </form>
    </div>
  );
}
