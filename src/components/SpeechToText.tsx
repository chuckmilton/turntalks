// /src/components/SpeechToText.tsx
'use client';
import React, { useState, useEffect } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';

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
  // Initialize renderedWords with the provided initial transcript.
  const [renderedWords, setRenderedWords] = useState<string[]>(
    initialTranscript.trim() ? initialTranscript.trim().split(/\s+/) : []
  );
  const { transcript, resetTranscript, listening } = useSpeechRecognition();

  useEffect(() => {
    if (autoStart) {
      // Only reset if there's no initial transcript.
      if (!initialTranscript) {
        resetTranscript();
      }
      SpeechRecognition.startListening({ continuous: true });
    }
    return () => {
      SpeechRecognition.stopListening();
    };
  }, [autoStart, resetTranscript]);

  // Effect to keep appending new words without resetting the full transcript.
  useEffect(() => {
    // Split the current transcript into words.
    const newWords = transcript.trim() === '' ? [] : transcript.trim().split(/\s+/);
    // Only append new words.
    if (newWords.length > renderedWords.length) {
      setRenderedWords((prev) => [...prev, ...newWords.slice(prev.length)]);
    }
    // Always call onResult with the complete, stored transcript.
    onResult(renderedWords.join(' '));
  }, [transcript, onResult, renderedWords.length]);

  // Effect to update renderedWords when initialTranscript prop changes (e.g., after editing).
  useEffect(() => {
    if (initialTranscript) {
      setRenderedWords(initialTranscript.trim().split(/\s+/));
    }
  }, [initialTranscript]);

  // Effect to force restart listening if it stops unexpectedly.
  useEffect(() => {
    if (autoStart && !listening) {
      SpeechRecognition.startListening({ continuous: true });
    }
  }, [listening, autoStart]);

  return (
    <div className="p-6 bg-white border border-gray-300 rounded-lg shadow-md transition hover:shadow-lg">
      <p className="text-gray-800 text-lg">
        {renderedWords.map((word, index) => (
          <AnimatedWord key={index} word={word} />
        ))}
      </p>
    </div>
  );
};

export default SpeechToText;
