'use client';
import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Rating from '@/components/Rating';
import { useRouter, useParams } from 'next/navigation';
import useRequireAuth from '@/hooks/useRequireAuth';
import SpeechRecognition from 'react-speech-recognition'; // to ensure mic stops
import { jsPDF } from 'jspdf'; // for PDF generation
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faDownload,
  faPlay,
  faPause,
  faStop,
} from '@fortawesome/free-solid-svg-icons';

interface Session {
  id: string;
  summary?: string;
  rating?: number;
  openai_file_id?: string;
  prompt: string;
  end_goal?: string; // Optional end goal.
  participants: string[];
  num_questions: number;
  time_limit: number;
  answers?: unknown[];
  current_question?: string;
  [key: string]: unknown;
}

export default function ConclusionPage() {
  useRequireAuth();

  const params = useParams();
  const { sessionId } = params as { sessionId: string };
  const [session, setSession] = useState<Session | null>(null);
  const [summary, setSummary] = useState<string>('');
  const [loadingSummary, setLoadingSummary] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const router = useRouter();

  // Audio element state for controlling speech playback.
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  // State to track whether audio is playing.
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // A ref to track the latest summary generation request.
  const latestGenRef = useRef<number>(0);
  // A ref to track if the component is still mounted.
  const isMounted = useRef<boolean>(true);
  // A ref to store the AbortController for the audio generation fetch.
  const abortControllerRef = useRef<AbortController | null>(null);

  // Stop the audio, abort pending audio generation, and update the mounted flag when the component unmounts.
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      // Cancel any pending audio generation fetch.
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (audioElement) {
        audioElement.pause();
        audioElement.currentTime = 0;
      }
    };
  }, [audioElement]);

  // Ensure the mic is off when this page loads.
  useEffect(() => {
    SpeechRecognition.stopListening();
  }, []);

  // Function to auto-generate summary if it doesn't exist.
  async function handleGenerateSummary(sessionData: Session | null) {
    if (!sessionData) return;
    setLoadingSummary(true);
    try {
      const fileInput = sessionData.openai_file_id
        ? { file_id: sessionData.openai_file_id }
        : undefined;
      const res = await fetch('/api/generate-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionData, fileInput }),
      });
      const result = await res.json();
      if (result.error) throw new Error(result.error);
      const summaryText: string = result.summary;
      if (isMounted.current) {
        setSummary(summaryText);
      }

      const { data: authData, error: authError } = await supabase.auth.getSession();
      if (authError || !authData.session?.user) {
        if (isMounted.current) setErrorMessage("Authentication error. Please log in again.");
        return;
      }
      const userId = authData.session.user.id;
      const { error } = await supabase
        .from('sessions')
        .update({ summary: summaryText, status: 'finished', user_id: userId })
        .eq('id', sessionId);
      if (error && isMounted.current) {
        setErrorMessage(error.message);
      }
    } catch (err: unknown) {
      if (isMounted.current) {
        if (err instanceof Error) {
          setErrorMessage(err.message);
        } else {
          setErrorMessage('An unexpected error occurred.');
        }
      }
    }
    if (isMounted.current) setLoadingSummary(false);
  }

  // Function to generate and play summary audio.
  // It uses the current generation id to skip outdated audio.
  const generateAndPlayAudio = async (genId: number) => {
    if (!summary) return;
    // Prevent duplicate playback if audio is already playing.
    if (audioElement && isPlaying) return;
    // If an audio element exists, stop and clear it.
    if (audioElement) {
      audioElement.pause();
      audioElement.currentTime = 0;
      setAudioElement(null);
      setIsPlaying(false);
    }

    // Create a new AbortController and store it.
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const res = await fetch('/api/generate-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: summary,
          voice: 'coral', // change as desired
          instructions: 'Speak in a cheerful and positive tone.'
        }),
        signal: controller.signal,
      });
      if (!res.ok) {
        if (isMounted.current) setErrorMessage("Failed to generate audio.");
        return;
      }
      const audioBuffer = await res.arrayBuffer();
      const blob = new Blob([audioBuffer], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);

      // Before playing, ensure that this generation is the latest.
      if (genId !== latestGenRef.current) {
        // Outdated generation – do not play.
        return;
      }

      // Listen for 'ended' event to reset playback controls.
      audio.addEventListener('ended', () => {
        if (isMounted.current) {
          setIsPlaying(false);
        }
      });

      // Auto-play the audio.
      audio.play()
        .then(() => {
          // Double-check that we are still playing the correct version.
          if (genId === latestGenRef.current && isMounted.current) {
            setAudioElement(audio);
            setIsPlaying(true);
          }
        })
        .catch((err) => {
          console.error("Autoplay blocked:", err);
          if (genId === latestGenRef.current && isMounted.current) {
            setAudioElement(audio);
            setIsPlaying(false);
          }
        });
    } catch (err: unknown) {
      // If the error is due to aborting, simply return.
      if ((err as any)?.name === 'AbortError') {
        return;
      }
      if (isMounted.current) {
        if (err instanceof Error) {
          setErrorMessage(err.message);
        } else {
          setErrorMessage("An unexpected error occurred while generating speech.");
        }
      }
    }
  };

  // Download summary as a nicely formatted PDF.
  const handleDownloadPDF = () => {
    if (!summary || !session) return;

    const doc = new jsPDF({
      unit: 'pt',
      format: 'letter',
      compress: true,
    });

    // Document header.
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("Session Summary", 40, 40);

    // Prompt.
    doc.setFontSize(14);
    doc.text("Prompt:", 40, 70);
    doc.setFont("helvetica", "normal");
    doc.text(doc.splitTextToSize(session.prompt, 520), 40, 90);

    // End goal if available.
    if (session.end_goal) {
      doc.setFont("helvetica", "bold");
      doc.text("End Goal:", 40, 140);
      doc.setFont("helvetica", "normal");
      doc.text(doc.splitTextToSize(session.end_goal, 520), 40, 160);
    }

    // Participants.
    doc.setFont("helvetica", "bold");
    const participantsY = session.end_goal ? 210 : 140;
    doc.text("Participants:", 40, participantsY);
    doc.setFont("helvetica", "normal");
    const participantsText = session.participants.join(", ");
    doc.text(doc.splitTextToSize(participantsText, 520), 40, participantsY + 20);

    // Summary.
    const summaryY = session.end_goal ? 280 : 220;
    doc.setFont("helvetica", "bold");
    doc.text("Summary:", 40, summaryY);
    doc.setFont("helvetica", "normal");
    const summaryLines = doc.splitTextToSize(summary, 520);
    doc.text(summaryLines, 40, summaryY + 20);

    doc.save('Session-Summary.pdf');
  };

  // Fetch session details on load.
  useEffect(() => {
    async function fetchSession() {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('id', sessionId)
        .single();
      if (error) {
        setErrorMessage(error.message);
      } else {
        const sessionData = data as Session;
        setSession(sessionData);
        if (sessionData.summary) {
          setSummary(sessionData.summary);
        } else {
          await handleGenerateSummary(sessionData);
        }
      }
    }
    fetchSession();
  }, [sessionId]);

  // Automatically play summary audio once summary is ready.
  useEffect(() => {
    if (summary) {
      // Update our generation ref.
      latestGenRef.current = Date.now();
      generateAndPlayAudio(latestGenRef.current);
    }
  }, [summary]);

  // Audio control handlers.
  const handlePlay = () => {
    if (audioElement) {
      // Only allow playback if the audio is paused or ended.
      audioElement.play();
      setIsPlaying(true);
    }
  };

  const handlePause = () => {
    if (audioElement) {
      audioElement.pause();
      setIsPlaying(false);
    }
  };

  const handleStop = () => {
    if (audioElement) {
      audioElement.pause();
      audioElement.currentTime = 0;
      setIsPlaying(false);
    }
  };

  if (!session)
    return <p className="text-center mt-10 text-gray-600">Loading session data...</p>;

  return (
    <div className="max-w-2xl mx-auto p-8 bg-white shadow-lg rounded-xl animate-fadeInUp">
      {errorMessage && (
        <div className="mb-6 p-3 bg-red-100 text-red-600 border border-red-200 rounded">
          {errorMessage}
        </div>
      )}
      <h2 className="text-3xl font-bold mb-6 text-gray-800">Session Summary</h2>

      {/* Display Prompt */}
      <div className="mb-6">
        <h3 className="font-bold text-xl text-gray-700 mb-2">Prompt:</h3>
        <p className="text-gray-700">{session.prompt}</p>
      </div>

      {/* Display End Goal if available */}
      {session.end_goal && (
        <div className="mb-6">
          <h3 className="font-bold text-xl text-gray-700 mb-2">End Goal:</h3>
          <p className="text-gray-700">{session.end_goal}</p>
        </div>
      )}

      {/* Display Participants */}
      <div className="mb-6">
        <h3 className="font-bold text-xl text-gray-700 mb-2">Participants:</h3>
        {session.participants.length > 0 ? (
          <ul className="list-disc list-inside text-gray-700">
            {session.participants.map((participant, index) => (
              <li key={index}>{participant}</li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-700">No participants listed.</p>
        )}
      </div>

      {/* Display Summary, Download PDF and Audio controls */}
      {loadingSummary ? (
        <p className="mb-6 text-center text-gray-500 italic">Generating Summary...</p>
      ) : (
        summary && (
          <div className="mb-6">
            <div
              className="p-6 border border-gray-300 rounded bg-gray-50 mb-4 animate-fadeIn"
              style={{ animation: 'fadeIn 1s ease forwards' }}
            >
              <h3 className="font-bold text-xl text-gray-700 mb-2">Summary:</h3>
              <p className="text-gray-700 leading-relaxed">{summary}</p>
            </div>
            <div className="flex gap-4 justify-center mb-4">
              <button
                onClick={handleDownloadPDF}
                title="Download Summary as PDF"
                className="flex items-center justify-center"
              >
                <FontAwesomeIcon icon={faDownload} className="text-3xl text-green-600 hover:text-green-700 transition" />
              </button>
              {/* Display only Pause and Stop if audio is playing; if not, show Play */}
              {isPlaying ? (
                <>
                  <button
                    onClick={handlePause}
                    title="Pause Audio"
                    className="flex items-center justify-center"
                  >
                    <FontAwesomeIcon icon={faPause} className="text-3xl text-yellow-600 hover:text-yellow-700 transition" />
                  </button>
                  <button
                    onClick={handleStop}
                    title="Stop Audio"
                    className="flex items-center justify-center"
                  >
                    <FontAwesomeIcon icon={faStop} className="text-3xl text-red-600 hover:text-red-700 transition" />
                  </button>
                </>
              ) : (
                <button
                  onClick={handlePlay}
                  title="Play Audio"
                  className="flex items-center justify-center"
                >
                  <FontAwesomeIcon icon={faPlay} className="text-3xl text-blue-600 hover:text-blue-700 transition" />
                </button>
              )}
            </div>
          </div>
        )
      )}

      {/* Rating Section */}
      <div className="mb-6">
        <h3 className="font-bold text-xl mb-2 text-gray-800">Rate the Session:</h3>
        <Rating sessionId={sessionId} initialRating={session.rating} />
      </div>

      <button
        onClick={() => router.push('/dashboard')}
        className="w-full py-3 bg-pink-600 text-white font-semibold rounded-md shadow hover:shadow-lg transition-transform hover:-translate-y-0.5"
      >
        Back to Dashboard
      </button>
    </div>
  );
}
