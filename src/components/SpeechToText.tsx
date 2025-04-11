'use client';
import React, { useState, useEffect } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faVolumeMute, faVolumeUp } from '@fortawesome/free-solid-svg-icons';

interface SpeechToTextProps {
  onResult: (text: string) => void;
  autoStart?: boolean;
  initialTranscript?: string;
  isActive?: boolean; // If false, the component will not listen.
}

// A simple component for animating each new word.
const AnimatedWord: React.FC<{ word: string }> = ({ word }) => (
  <span className="inline-block mr-1 animate-fadeIn">{word}</span>
);

const SpeechToText: React.FC<SpeechToTextProps> = ({
  onResult,
  autoStart = true,
  initialTranscript = '',
  isActive = true,
}) => {
  // Holds the confirmed/accumulated words.
  const [renderedWords, setRenderedWords] = useState<string[]>(
    initialTranscript.trim() ? initialTranscript.trim().split(/\s+/) : []
  );
  // State for controlling mute/unmute.
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const { transcript, resetTranscript } = useSpeechRecognition();

  // Combined effect: start or stop listening based on autoStart, isActive, and isMuted.
  useEffect(() => {
    if (isActive && autoStart) {
      if (!isMuted) {
        // When unmuting, add a short delay before starting.
        const timeoutId = setTimeout(() => {
          resetTranscript();
          SpeechRecognition.startListening({ continuous: true });
        }, 50);
        return () => clearTimeout(timeoutId);
      } else {
        SpeechRecognition.stopListening();
      }
    } else {
      SpeechRecognition.stopListening();
    }
    return () => {
      SpeechRecognition.stopListening();
    };
  }, [isActive, autoStart, isMuted, resetTranscript]);

  // Effect: Append new words from the current transcript.
  useEffect(() => {
    const newWords = transcript.trim() === '' ? [] : transcript.trim().split(/\s+/);
    if (newWords.length > renderedWords.length) {
      setRenderedWords((prev) => [...prev, ...newWords.slice(prev.length)]);
    }
    onResult(renderedWords.join(' '));
  }, [transcript, onResult, renderedWords.length]);

  // Update renderedWords if initialTranscript changes.
  useEffect(() => {
    if (initialTranscript) {
      setRenderedWords(initialTranscript.trim().split(/\s+/));
    }
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
      <p className="text-gray-800 text-lg">
        {renderedWords.map((word, index) => (
          <AnimatedWord key={index} word={word} />
        ))}
      </p>
    </div>
  );
};

export default SpeechToText;
