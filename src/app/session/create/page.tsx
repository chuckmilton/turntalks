// /src/app/session/create/page.tsx
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function CreateSessionPage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState('');
  const [endGoal, setEndGoal] = useState('');
  const [numQuestions, setNumQuestions] = useState(5);
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
      pdfUrl = supabase.storage.from('pdfs').getPublicUrl(uploadData.path).publicURL;
    }

    // Create session record in Supabase
    const { data, error } = await supabase
      .from('sessions')
      .insert([
        {
          prompt,
          end_goal: endGoal,
          num_questions: numQuestions,
          pdf_url: pdfUrl,
          participants: [],
          time_limit: 0,
          answers: [],
          status: 'created',
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
    <div className="max-w-xl mx-auto p-4 bg-white shadow rounded">
      <h2 className="text-2xl font-bold mb-4">Create a New Session</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block font-bold mb-1">AI Prompt:</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full border p-2"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block font-bold mb-1">End Goal:</label>
          <input
            type="text"
            value={endGoal}
            onChange={(e) => setEndGoal(e.target.value)}
            className="w-full border p-2"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block font-bold mb-1">Number of Questions:</label>
          <input
            type="number"
            value={numQuestions}
            onChange={(e) => setNumQuestions(parseInt(e.target.value))}
            className="w-full border p-2"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block font-bold mb-1">Upload Reference PDF (optional):</label>
          <input
            type="file"
            accept=".pdf"
            onChange={(e) => setPdfFile(e.target.files ? e.target.files[0] : null)}
          />
        </div>
        <button type="submit" className="px-4 py-2 bg-green-500 text-white rounded">
          Next: Participant Setup
        </button>
      </form>
    </div>
  );
}
