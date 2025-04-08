// /src/components/SpeechToText.tsx
'use client';
import React, { useState, useEffect } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';

interface SpeechToTextProps {
  onResult: (text: string) => void;
  autoStart?: boolean;
}

// A simple component for animating each new word.
const AnimatedWord: React.FC<{ word: string }> = ({ word }) => (
  <span className="inline-block mr-1 animate-fadeIn">{word}</span>
);

const SpeechToText: React.FC<SpeechToTextProps> = ({ onResult, autoStart = true }) => {
  const { transcript, resetTranscript } = useSpeechRecognition();
  // This state holds the words that have been rendered so far.
  const [renderedWords, setRenderedWords] = useState<string[]>([]);

  useEffect(() => {
    if (autoStart) {
      resetTranscript();
      SpeechRecognition.startListening({ continuous: true });
    }
    return () => {
      SpeechRecognition.stopListening();
    };
  }, [autoStart, resetTranscript]);

  useEffect(() => {
    // Split current transcript into words (ignoring extra spaces)
    const newWords = transcript.trim() === "" ? [] : transcript.trim().split(/\s+/);
    // If transcript was reset, update renderedWords accordingly.
    if (newWords.length < renderedWords.length) {
      setRenderedWords(newWords);
    } else if (newWords.length > renderedWords.length) {
      // Append only the new words.
      setRenderedWords((prev) => [...prev, ...newWords.slice(prev.length)]);
    }
    onResult(transcript);
  }, [transcript, onResult, renderedWords.length]);

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
