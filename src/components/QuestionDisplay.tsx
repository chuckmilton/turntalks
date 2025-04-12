import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlay,
  faPause,
  faStop,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";
import { motion } from "framer-motion";

interface QuestionDisplayProps {
  question: string;
  onAudioStatusChange?: (isPlaying: boolean) => void;
}

const QuestionDisplay: React.FC<QuestionDisplayProps> = ({
  question,
  onAudioStatusChange,
}) => {
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(
    null
  );
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [animationKey, setAnimationKey] = useState<number>(Date.now());
  // New state to track if audio generation is in progress.
  const [audioLoading, setAudioLoading] = useState<boolean>(false);

  // Update animation key when the question changes.
  useEffect(() => {
    setAnimationKey(Date.now());
  }, [question]);

  // Generate TTS audio whenever the question changes.
  useEffect(() => {
    // Clean up any existing audio.
    if (audioElement) {
      audioElement.pause();
      audioElement.currentTime = 0;
    }

    let cancelled = false;

    // Signal that audio is about to start.
    if (onAudioStatusChange) onAudioStatusChange(true);
    setAudioLoading(true);

    const generateAudio = async () => {
      try {
        const res = await fetch("/api/generate-speech", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: question,
            voice: "nova",
            instructions:
              "Tone: The voice should be refined, formal, and delightfully theatrical, reminiscent of a charming radio announcer from the early 20th century. Pacing: The speech should flow smoothly at a steady cadence, neither rushed nor sluggish, allowing for clarity and a touch of grandeur. Pronunciation: Words should be enunciated crisply and elegantly, with an emphasis on vintage expressions and a slight flourish on key phrases. Emotion: The delivery should feel warm, enthusiastic, and welcoming, as if addressing a distinguished audience with utmost politeness. Inflection: Gentle rises and falls in pitch should be used to maintain engagement, adding a playful yet dignified flair to each sentence. Word Choice: The script should incorporate vintage expressions like splendid, marvelous, posthaste, and ta-ta for now, avoiding modern slang.",
          }),
        });
        if (cancelled) return;
        const audioBuffer = await res.arrayBuffer();
        if (cancelled) return;
        const blob = new Blob([audioBuffer], { type: "audio/mpeg" });
        const audioUrl = URL.createObjectURL(blob);
        const newAudio = new Audio(audioUrl);
        newAudio.addEventListener("ended", () => {
          setIsPlaying(false);
          if (onAudioStatusChange) onAudioStatusChange(false);
        });
        newAudio
          .play()
          .then(() => {
            if (!cancelled) {
              setAudioElement(newAudio);
              setIsPlaying(true);
              if (onAudioStatusChange) onAudioStatusChange(true);
              setAudioLoading(false);
            }
          })
          .catch((err: unknown) => {
            console.error("Autoplay blocked for question audio:", err);
            if (!cancelled) {
              setAudioElement(newAudio);
              setIsPlaying(false);
              if (onAudioStatusChange) onAudioStatusChange(false);
              setAudioLoading(false);
            }
          });
      } catch (err: unknown) {
        if (!cancelled) {
          const errorMsg =
            err instanceof Error
              ? err.message
              : "An error occurred while generating question audio.";
          setError(errorMsg);
          if (onAudioStatusChange) onAudioStatusChange(false);
          setAudioLoading(false);
        }
      }
    };

    generateAudio();

    // Cancel any in-flight generation on unmount or when the question changes.
    return () => {
      cancelled = true;
      if (audioElement) {
        audioElement.pause();
        audioElement.currentTime = 0;
      }
    };
  }, [question]);

  // Audio control handlers.
  const handlePlay = () => {
    if (audioElement) {
      if (audioElement.ended) {
        audioElement.currentTime = 0;
      }
      audioElement.play().then(() => {
        setIsPlaying(true);
        if (onAudioStatusChange) onAudioStatusChange(true);
      });
    }
  };

  const handlePause = () => {
    if (audioElement && !audioElement.paused) {
      audioElement.pause();
      setIsPlaying(false);
      if (onAudioStatusChange) onAudioStatusChange(false);
    }
  };

  const handleStop = () => {
    if (audioElement) {
      audioElement.pause();
      audioElement.currentTime = 0;
      setIsPlaying(false);
      if (onAudioStatusChange) onAudioStatusChange(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="p-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg shadow-2xl mb-6"
    >
      <motion.h3
        className="text-2xl font-bold text-white mb-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.6 }}
      >
        Question:
      </motion.h3>
      <motion.p
        key={animationKey}
        className="text-white text-lg"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.6 }}
      >
        {question}
      </motion.p>

      {/* Audio Controls */}
      <div className="mt-6">
        <motion.p
          className="text-gray-200 italic mb-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          Listen to the question:
        </motion.p>
        <div className="flex gap-6 justify-center items-center">
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
                className="text-4xl text-yellow-400"
              />
            </motion.div>
          ) : isPlaying ? (
            <>
              <motion.button
                onClick={handlePause}
                title="Pause Audio"
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.1 }}
                className="flex items-center justify-center"
              >
                <FontAwesomeIcon
                  icon={faPause}
                  className="text-4xl text-yellow-400 hover:text-yellow-500 transition"
                />
              </motion.button>
              <motion.button
                onClick={handleStop}
                title="Stop Audio"
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.1 }}
                className="flex items-center justify-center"
              >
                <FontAwesomeIcon
                  icon={faStop}
                  className="text-4xl text-red-400 hover:text-red-500 transition"
                />
              </motion.button>
            </>
          ) : (
            <motion.button
              onClick={handlePlay}
              title="Replay Audio"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              whileHover={{ scale: 1.1 }}
              className="flex items-center justify-center"
            >
              <FontAwesomeIcon
                icon={faPlay}
                className="text-4xl text-blue-300 hover:text-blue-400 transition"
              />
            </motion.button>
          )}
        </div>
        {error && (
          <motion.div
            className="mt-4 text-red-200"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            {error}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default QuestionDisplay;
