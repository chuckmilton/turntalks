// /src/components/SpeechToText.tsx
'use client';
import React, { useEffect } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';

interface SpeechToTextProps {
  onResult: (text: string) => void;
  autoStart?: boolean;
}

const SpeechToText: React.FC<SpeechToTextProps> = ({ onResult, autoStart = true }) => {
  const { transcript, resetTranscript } = useSpeechRecognition();

  useEffect(() => {
    if (autoStart) {
      resetTranscript();
      SpeechRecognition.startListening({ continuous: true });
    }
    return () => {
      void SpeechRecognition.stopListening();
    };
  }, [autoStart, resetTranscript]);
  
  useEffect(() => {
    console.log("Transcript updated:", transcript);
    onResult(transcript);
  }, [transcript, onResult]);

  return (
    <div className="p-6 bg-white border border-gray-300 rounded-lg shadow-md transition hover:shadow-lg">
      <p className="text-gray-800 text-lg">{transcript}</p>
    </div>
  );
};

export default SpeechToText;
