'use client';
import React, { useState, useEffect, useRef } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faVolumeMute, faVolumeUp } from '@fortawesome/free-solid-svg-icons';

interface SpeechToTextProps {
  onResult: (text: string) => void;
  autoStart?: boolean;
  initialTranscript?: string;
  isActive?: boolean; // if false, the component will not listen.
}

const SpeechToText: React.FC<SpeechToTextProps> = ({
  onResult,
  autoStart = true,
  initialTranscript = '',
  isActive = true,
}) => {
  // accumulatedTranscript holds all recognized text for this turn.
  const [accumulatedTranscript, setAccumulatedTranscript] = useState<string>(initialTranscript.trim());
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

  // When transcript updates, if non-empty, update the accumulated transcript.
  useEffect(() => {
    const newText = transcript.trim();
    if (newText) {
      // If the new transcript is different than what we processed last time,
      // then update the accumulated transcript.
      if (newText !== prevTranscriptRef.current) {
        // Here we simply replace the text with the new value.
        // (Alternatively, you could append if you prefer: prevTranscriptRef.current + ' ' + newText)
        prevTranscriptRef.current = newText;
        setAccumulatedTranscript(newText);
        onResult(newText);
      }
    }
    // If transcript is empty (e.g. while muted or restarted), do nothing.
  }, [transcript, onResult]);

  // When initialTranscript changes (for example, after finishing an edit),
  // update the accumulated transcript accordingly.
  useEffect(() => {
    const trimmed = initialTranscript.trim();
    setAccumulatedTranscript(trimmed);
    prevTranscriptRef.current = trimmed;
  }, [initialTranscript]);

  return (
    <div className="p-6 bg-white border border-gray-300 rounded-lg shadow-md transition hover:shadow-lg">
      {/* Mute toggle button */}
      <div className="flex items-center justify-end mb-2">
        <button
          onClick={() => setIsMuted((prev) => !prev)}
          className="p-2 focus:outline-none"
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? (
            <FontAwesomeIcon icon={faVolumeMute} className="text-xl" />
          ) : (
            <FontAwesomeIcon icon={faVolumeUp} className="text-xl" />
          )}
        </button>
      </div>
      <p className="text-gray-800 text-lg">{accumulatedTranscript}</p>
    </div>
  );
};

export default SpeechToText;
