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
    return () => SpeechRecognition.stopListening();
  }, [autoStart, resetTranscript]);

  useEffect(() => {
    console.log("Transcript updated:", transcript);
    onResult(transcript);
  }, [transcript, onResult]);

  return (
    <div className="p-4 border rounded">
      <p className="text-gray-700">{transcript}</p>
    </div>
  );
};

export default SpeechToText;
