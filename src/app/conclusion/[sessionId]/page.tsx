"use client";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Rating from "@/components/Rating";
import { useRouter, useParams } from "next/navigation";
import useRequireAuth from "@/hooks/useRequireAuth";
import SpeechRecognition from "react-speech-recognition"; // to ensure mic stops
import { jsPDF } from "jspdf"; // for PDF generation
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faDownload,
  faPlay,
  faPause,
  faStop,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";
import { motion } from "framer-motion";

// Utility function to convert a Blob to a base64 data URL.
function getBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}

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
  const [summary, setSummary] = useState<string>("");
  const [loadingSummary, setLoadingSummary] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const router = useRouter();

  // Audio control state.
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [audioLoading, setAudioLoading] = useState<boolean>(false);

  // Refs to help manage audio and summary generation.
  const latestGenRef = useRef<number>(0);
  const isMounted = useRef<boolean>(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cleanup on unmount: stop audio, abort pending fetch.
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
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
      const res = await fetch("/api/generate-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionData, fileInput }),
      });
      const result = await res.json();
      if (result.error) throw new Error(result.error);
      const summaryText: string = result.summary;
      if (isMounted.current) {
        setSummary(summaryText);
      }

      const { data: authData, error: authError } =
        await supabase.auth.getSession();
      if (authError || !authData.session?.user) {
        if (isMounted.current)
          setErrorMessage("Authentication error. Please log in again.");
        return;
      }
      const userId = authData.session.user.id;
      const { error } = await supabase
        .from("sessions")
        .update({ summary: summaryText, status: "finished", user_id: userId })
        .eq("id", sessionId);
      if (error && isMounted.current) {
        setErrorMessage(error.message);
      }
    } catch (err: unknown) {
      if (isMounted.current) {
        if (err instanceof Error) {
          setErrorMessage(err.message);
        } else {
          setErrorMessage("An unexpected error occurred.");
        }
      }
    }
    if (isMounted.current) setLoadingSummary(false);
  }

  // Function to generate and play summary audio.
  const generateAndPlayAudio = async (genId: number) => {
    if (!summary) return;
    if (audioElement && isPlaying) return;
    if (audioElement) {
      audioElement.pause();
      audioElement.currentTime = 0;
      setAudioElement(null);
      setIsPlaying(false);
    }

    setAudioLoading(true);
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const res = await fetch("/api/generate-speech", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: summary,
          voice: "nova",
          instructions:
            "Tone: The voice should be refined, formal, and delightfully theatrical, reminiscent of a charming radio announcer from the early 20th century. Pacing: The speech should flow smoothly at a steady cadence, neither rushed nor sluggish, allowing for clarity and a touch of grandeur. Pronunciation: Words should be enunciated crisply and elegantly, with an emphasis on vintage expressions and a slight flourish on key phrases. Emotion: The delivery should feel warm, enthusiastic, and welcoming, as if addressing a distinguished audience with utmost politeness. Inflection: Gentle rises and falls in pitch should be used to maintain engagement, adding a playful yet dignified flair to each sentence. Word Choice: The script should incorporate vintage expressions like splendid, marvelous, posthaste, and ta-ta for now, avoiding modern slang.",
        }),
        signal: controller.signal,
      });
      if (!res.ok) {
        if (isMounted.current) setErrorMessage("Failed to generate audio.");
        setAudioLoading(false);
        return;
      }
      const audioBuffer = await res.arrayBuffer();
      const blob = new Blob([audioBuffer], { type: "audio/mpeg" });
      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);
      if (genId !== latestGenRef.current) {
        setAudioLoading(false);
        return;
      }
      audio.addEventListener("ended", () => {
        if (isMounted.current) setIsPlaying(false);
      });
      audio
        .play()
        .then(() => {
          if (genId === latestGenRef.current && isMounted.current) {
            setAudioElement(audio);
            setIsPlaying(true);
            setAudioLoading(false);
          }
        })
        .catch((err) => {
          console.error("Autoplay blocked:", err);
          if (genId === latestGenRef.current && isMounted.current) {
            setAudioElement(audio);
            setIsPlaying(false);
            setAudioLoading(false);
          }
        });
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") {
        setAudioLoading(false);
        return;
      }
      if (isMounted.current) {
        if (err instanceof Error) {
          setErrorMessage(err.message);
        } else {
          setErrorMessage("An unexpected error occurred while generating speech.");
        }
      }
      setAudioLoading(false);
    }
  };

  // Download summary as a nicely formatted PDF with your logo.
  const handleDownloadPDF = async () => {
    if (!summary || !session) return;

    const doc = new jsPDF({
      unit: "pt",
      format: "letter",
      compress: true,
    });

    try {
      const response = await fetch("/logo.png");
      if (!response.ok) {
        throw new Error("Failed to fetch logo image.");
      }
      const logoBlob = await response.blob();
      const logoDataUrl = await getBase64(logoBlob);
      doc.addImage(logoDataUrl, "PNG", 40, 20, 80, 80);
    } catch (err: unknown) {
      console.error("Error fetching logo:", err);
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("Session Conclusion", 140, 60);

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Prompt:", 40, 110);
    doc.setFont("helvetica", "normal");
    doc.text(doc.splitTextToSize(session.prompt, 520), 40, 130);

    if (session.end_goal) {
      doc.setFont("helvetica", "bold");
      doc.text("End Goal:", 40, 190);
      doc.setFont("helvetica", "normal");
      doc.text(doc.splitTextToSize(session.end_goal, 520), 40, 210);
    }

    doc.setFont("helvetica", "bold");
    const participantsY = session.end_goal ? 260 : 190;
    doc.text("Participants:", 40, participantsY);
    doc.setFont("helvetica", "normal");
    const participantsText = session.participants.join(", ");
    doc.text(doc.splitTextToSize(participantsText, 520), 40, participantsY + 20);

    const summaryY = session.end_goal ? 330 : 270;
    doc.setFont("helvetica", "bold");
    doc.text("Description:", 40, summaryY);
    doc.setFont("helvetica", "normal");
    const summaryLines = doc.splitTextToSize(summary, 520);
    doc.text(summaryLines, 40, summaryY + 20);

    doc.save("Session-Conclusion.pdf");
  };

  // Fetch session details and generate summary if needed.
  useEffect(() => {
    async function fetchSession() {
      const { data, error } = await supabase
        .from("sessions")
        .select("*")
        .eq("id", sessionId)
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

  // When summary updates, generate and play audio.
  useEffect(() => {
    if (summary) {
      latestGenRef.current = Date.now();
      generateAndPlayAudio(latestGenRef.current);
    }
  }, [summary]);

  // Audio control handlers.
  const handlePlay = () => {
    if (audioElement) {
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
    return (
      <p className="text-center mt-10 text-gray-600">
        Loading session data...
      </p>
    );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="relative max-w-5xl mx-auto p-10 bg-white shadow-2xl rounded-xl animate-fadeInUp"
    >
      {errorMessage && (
        <div className="mb-6 p-3 bg-red-100 text-red-600 border border-red-200 rounded">
          {errorMessage}
        </div>
      )}
      <motion.h2
        className="text-4xl font-bold mb-8 text-gray-800 text-center bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.6 }}
      >
        Session Conclusion
      </motion.h2>

      {/* Prompt */}
      <motion.div
        className="mb-8 p-6 border border-gray-200 rounded-lg shadow-md bg-gray-50"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3, duration: 0.6 }}
      >
        <h3 className="font-bold text-xl text-gray-700 mb-2">Prompt:</h3>
        <p className="text-gray-700">{session.prompt}</p>
      </motion.div>

      {/* End Goal */}
      {session.end_goal && (
        <motion.div
          className="mb-8 p-6 border border-gray-200 rounded-lg shadow-md bg-gray-50"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          <h3 className="font-bold text-xl text-gray-700 mb-2">End Goal:</h3>
          <p className="text-gray-700">{session.end_goal}</p>
        </motion.div>
      )}

      {/* Participants */}
      <motion.div
        className="mb-8 p-6 border border-gray-200 rounded-lg shadow-md bg-gray-50"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5, duration: 0.6 }}
      >
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
      </motion.div>

      {/* Summary & Audio Controls */}
      {loadingSummary ? (
        <motion.p
          className="mb-8 text-center text-gray-500 italic"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          Generating Summary...
        </motion.p>
      ) : (
        summary && (
          <motion.div
            className="mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.6 }}
          >
            <div className="p-6 border border-gray-300 rounded-lg bg-gray-50 shadow-md animate-fadeIn">
              <h3 className="font-bold text-xl text-gray-700 mb-2">Description:</h3>
              <p className="text-gray-700 leading-relaxed">{summary}</p>
            </div>
            <div className="flex gap-6 justify-center items-center mt-4">
              <motion.button
                onClick={handleDownloadPDF}
                title="Download Conclusion as PDF"
                whileHover={{ scale: 1.1 }}
                className="flex items-center justify-center"
              >
                <FontAwesomeIcon
                  icon={faDownload}
                  className="text-3xl text-green-600 hover:text-green-700 transition"
                />
              </motion.button>
              {audioLoading ? (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.6 }}
                  className="flex items-center justify-center"
                >
                  <FontAwesomeIcon
                    icon={faSpinner}
                    spin
                    className="text-3xl text-blue-600"
                  />
                </motion.div>
              ) : isPlaying ? (
                <>
                  <motion.button
                    onClick={handlePause}
                    title="Pause Audio"
                    whileHover={{ scale: 1.1 }}
                    className="flex items-center justify-center"
                  >
                    <FontAwesomeIcon
                      icon={faPause}
                      className="text-3xl text-yellow-600 hover:text-yellow-700 transition"
                    />
                  </motion.button>
                  <motion.button
                    onClick={handleStop}
                    title="Stop Audio"
                    whileHover={{ scale: 1.1 }}
                    className="flex items-center justify-center"
                  >
                    <FontAwesomeIcon
                      icon={faStop}
                      className="text-3xl text-red-600 hover:text-red-700 transition"
                    />
                  </motion.button>
                </>
              ) : (
                <motion.button
                  onClick={handlePlay}
                  title="Play Audio"
                  whileHover={{ scale: 1.1 }}
                  className="flex items-center justify-center"
                >
                  <FontAwesomeIcon
                    icon={faPlay}
                    className="text-3xl text-blue-600 hover:text-blue-700 transition"
                  />
                </motion.button>
              )}
            </div>
          </motion.div>
        )
      )}

      {/* Rating Section */}
      <motion.div
        className="mb-8 p-6 border border-gray-200 rounded-lg shadow-md bg-gray-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.6 }}
      >
        <h3 className="font-bold text-xl mb-2 text-gray-800">Rate the Session:</h3>
        <Rating sessionId={sessionId} initialRating={session.rating} />
      </motion.div>

      {/* Back to Dashboard */}
      <motion.button
        onClick={() => router.push("/dashboard")}
        whileHover={{ scale: 1.05 }}
        className="w-full py-3 bg-pink-600 text-white font-semibold rounded-md shadow hover:shadow-lg transition-transform hover:-translate-y-1"
      >
        Back to Dashboard
      </motion.button>
    </motion.div>
  );
}
