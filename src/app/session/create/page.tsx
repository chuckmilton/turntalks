"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import useRequireAuth from "@/hooks/useRequireAuth";

export default function CreateSessionPage() {
  useRequireAuth();
  const router = useRouter();
  const [prompt, setPrompt] = useState('');
  const [endGoal, setEndGoal] = useState('');
  const [numQuestionsStr, setNumQuestionsStr] = useState("5");
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Ensure the user is logged in.
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData.session?.user) {
      alert("You must be logged in to create a session.");
      return;
    }
    const userId = sessionData.session.user.id;
    const numQuestions = parseInt(numQuestionsStr, 10);
    const validNumQuestions = isNaN(numQuestions) || numQuestions < 1 ? 1 : numQuestions;

    let openaiFileId: string | null = null;
    const maxFileSize = 50 * 1024 * 1024; // 50 MB limit

    if (pdfFile) {
      if (pdfFile.size > maxFileSize) {
        alert("Please upload a PDF smaller than 50 MB.");
        return;
      }

      // Build a FormData payload for the file upload API.
      const formData = new FormData();
      formData.append("file", pdfFile);
      formData.append("purpose", "assistants");
      formData.append("file_size", pdfFile.size.toString());

      try {
        const response = await fetch('/api/upload-to-openai', {
          method: 'POST',
          body: formData,
        });
        const json = await response.json();
        if (json.error) throw new Error(json.error);
        openaiFileId = json.file_id;
        console.log("OpenAI File ID:", openaiFileId);
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        alert(`Error uploading file to OpenAI: ${errorMessage}`);
        return;
      }
    }

    // Create a session record in Supabase and save the OpenAI file ID if available.
    const { data, error } = await supabase
      .from('sessions')
      .insert([
        {
          prompt,
          end_goal: endGoal,
          num_questions: validNumQuestions,
          openai_file_id: openaiFileId,
          participants: [],
          time_limit: 0,
          answers: [],
          status: 'created',
          user_id: userId,
        },
      ])
      .select();
    if (error) {
      alert(error.message);
      return;
    }
    const newSession = data[0];
    router.push(`/session/setup?sessionId=${newSession.id}`);
  };

  return (
    <div className="w-full max-w-xl mx-auto p-8 bg-white shadow-lg rounded-xl animate-fadeInUp">
      <h2 className="text-3xl font-bold mb-6 text-gray-800">Create a New Session</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <label className="block font-semibold mb-2">AI Prompt:</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-pink-500"
            required
          />
        </div>
        <div className="mb-6">
          <label className="block font-semibold mb-2">End Goal:</label>
          <input
            type="text"
            value={endGoal}
            onChange={(e) => setEndGoal(e.target.value)}
            className="w-full border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-pink-500"
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
            className="w-full border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-pink-500"
            required
          />
        </div>
        <div className="mb-6">
          <label className="block font-semibold mb-2">Upload Reference PDF (optional):</label>
          {pdfFile ? (
            <div className="flex items-center justify-between p-3 border border-gray-300 rounded-md bg-gray-50">
              <span className="text-gray-700 truncate">{pdfFile.name}</span>
              <button
                type="button"
                title="Remove file"
                onClick={() => setPdfFile(null)}
                className="flex-shrink-0 p-1 ml-4 rounded-full hover:bg-red-100 transition-colors"
              >
                <svg
                  className="w-5 h-5 text-gray-600 hover:text-red-600 transition-colors"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ) : (
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => setPdfFile(e.target.files ? e.target.files[0] : null)}
              className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:border-0 file:bg-pink-50 file:text-pink-700 hover:file:bg-pink-100 focus:outline-none focus:ring-2 focus:ring-pink-500 file:rounded-md file:transition-colors"
            />
          )}
        </div>
        <button
          type="submit"
          className="px-6 py-3 bg-pink-600 hover:bg-pink-700 text-white font-semibold rounded-md shadow hover:shadow-lg transition-transform hover:-translate-y-0.5"
        >
          Next: Participant Setup
        </button>
      </form>
    </div>
  );
}
