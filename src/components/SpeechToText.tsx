'use client';
import React from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';

interface SpeechToTextProps {
  onResult: (text: string) => void;
}

const SpeechToText: React.FC<SpeechToTextProps> = ({ onResult }) => {
  const { transcript, resetTranscript, listening } = useSpeechRecognition();

  if (!SpeechRecognition.browserSupportsSpeechRecognition()) {
    return <p>Your browser does not support speech recognition.</p>;
  }

  // Start listening and reset the transcript
  const startListening = () => {
    resetTranscript();
    SpeechRecognition.startListening({ continuous: true });
  };

  // Stop listening and call the callback with the final transcript
  const stopListening = () => {
    SpeechRecognition.stopListening();
    onResult(transcript);
  };

  return (
    <div className="p-4 border rounded">
      <button onClick={startListening} disabled={listening} className="px-4 py-2 bg-blue-500 text-white rounded">
        {listening ? 'Listening...' : 'Start Speaking'}
      </button>
      <button onClick={stopListening} disabled={!listening} className="px-4 py-2 bg-red-500 text-white rounded ml-2">
        Stop Speaking
      </button>
    </div>
  );
};

export default SpeechToText;
