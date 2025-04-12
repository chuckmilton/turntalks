"use client";
import React, { useState, useEffect, useRef } from "react";
import SpeechRecognition, { useSpeechRecognition } from "react-speech-recognition";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faVolumeMute, faVolumeUp } from "@fortawesome/free-solid-svg-icons";
import { motion } from "framer-motion";

interface SpeechToTextProps {
  onResult: (text: string) => void;
  autoStart?: boolean;
  initialTranscript?: string;
  isActive?: boolean; // if false, the component will not listen.
}

const SpeechToText: React.FC<SpeechToTextProps> = ({
  onResult,
  autoStart = true,
  initialTranscript = "",
  isActive = true,
}) => {
  // accumulatedTranscript holds all recognized text for this turn.
  const [accumulatedTranscript, setAccumulatedTranscript] = useState<string>(
    initialTranscript.trim()
  );
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const { transcript } = useSpeechRecognition();

  // Use a ref to store the last processed transcript.
  const prevTranscriptRef = useRef<string>(initialTranscript.trim());

  // Effect to start or stop listening based on isActive, autoStart and isMuted.
  useEffect(() => {
    if (isActive && autoStart && !isMuted) {
      SpeechRecognition.startListening({ continuous: true });
    } else {
      SpeechRecognition.stopListening();
    }
    return () => {
      SpeechRecognition.stopListening();
    };
  }, [isActive, autoStart, isMuted]);

  // When transcript updates, if non‑empty, update the accumulated transcript.
  useEffect(() => {
    const newText = transcript.trim();
    if (newText) {
      // If the new transcript is different from what was processed last time, update.
      if (newText !== prevTranscriptRef.current) {
        prevTranscriptRef.current = newText;
        setAccumulatedTranscript(newText);
        onResult(newText);
      }
    }
  }, [transcript, onResult]);

  // When initialTranscript changes (for example, after finishing an edit),
  // update the accumulated transcript accordingly.
  useEffect(() => {
    const trimmed = initialTranscript.trim();
    setAccumulatedTranscript(trimmed);
    prevTranscriptRef.current = trimmed;
  }, [initialTranscript]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="p-6 bg-white bg-gradient-to-br from-white to-gray-50 border border-gray-300 rounded-lg shadow-lg hover:shadow-2xl transition-shadow"
    >
      {/* Mute Toggle Button */}
      <div className="flex items-center justify-end mb-2">
        <motion.button
          onClick={() => setIsMuted((prev) => !prev)}
          className="p-2 focus:outline-none"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          title={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? (
            <FontAwesomeIcon icon={faVolumeMute} className="text-xl text-red-500" />
          ) : (
            <FontAwesomeIcon icon={faVolumeUp} className="text-xl text-green-500" />
          )}
        </motion.button>
      </div>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="text-gray-800 text-lg"
      >
        {accumulatedTranscript || "Your speech will appear here..."}
      </motion.p>
    </motion.div>
  );
};

export default SpeechToText;
