// /src/components/SpeechToText.tsx
'use client';
import React, { useState, useEffect } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faVolumeMute, faVolumeUp } from '@fortawesome/free-solid-svg-icons';

interface SpeechToTextProps {
  onResult: (text: string) => void;
  autoStart?: boolean;
  initialTranscript?: string;
}

// A simple component for animating each new word.
const AnimatedWord: React.FC<{ word: string }> = ({ word }) => (
  <span className="inline-block mr-1 animate-fadeIn">{word}</span>
);

const SpeechToText: React.FC<SpeechToTextProps> = ({
  onResult,
  autoStart = true,
  initialTranscript = '',
}) => {
  // Holds the confirmed/previous words.
  const [renderedWords, setRenderedWords] = useState<string[]>(
    initialTranscript.trim() ? initialTranscript.trim().split(/\s+/) : []
  );
  // New state for controlling mute/unmute.
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const { transcript, resetTranscript, listening } = useSpeechRecognition();

  // Start listening on mount (or when autoStart changes) unless we have an initial transcript.
  useEffect(() => {
    if (autoStart && !isMuted) {
      if (!initialTranscript) {
        resetTranscript();
      }
      SpeechRecognition.startListening({ continuous: true });
    }
    return () => {
      SpeechRecognition.stopListening();
    };
  }, [autoStart, resetTranscript, initialTranscript, isMuted]);

  // Effect: Append new words from the current transcript.
  useEffect(() => {
    // Split transcript into words.
    const newWords =
      transcript.trim() === '' ? [] : transcript.trim().split(/\s+/);
    if (newWords.length > renderedWords.length) {
      setRenderedWords((prev) => [...prev, ...newWords.slice(prev.length)]);
    }
    onResult(renderedWords.join(' '));
  }, [transcript, onResult, renderedWords.length]);

  // Update the displayed words if initialTranscript changes (e.g., after editing).
  useEffect(() => {
    if (initialTranscript) {
      setRenderedWords(initialTranscript.trim().split(/\s+/));
    }
  }, [initialTranscript]);

  // Monitor the isMuted state. When muted, stop listening; when unmuted, resume.
  useEffect(() => {
    if (isMuted) {
      SpeechRecognition.stopListening();
    } else if (autoStart) {
      SpeechRecognition.startListening({ continuous: true });
    }
  }, [isMuted, autoStart]);

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
      <p className="text-gray-800 text-lg">
        {renderedWords.map((word, index) => (
          <AnimatedWord key={index} word={word} />
        ))}
      </p>
    </div>
  );
};

export default SpeechToText;
