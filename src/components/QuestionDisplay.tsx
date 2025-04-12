import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay, faPause, faStop } from '@fortawesome/free-solid-svg-icons';

interface QuestionDisplayProps {
  question: string;
  onAudioStatusChange?: (isPlaying: boolean) => void;
}

const QuestionDisplay: React.FC<QuestionDisplayProps> = ({ question, onAudioStatusChange }) => {
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [animationKey, setAnimationKey] = useState<number>(Date.now());

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

    // Introduce a cancellation flag to avoid race conditions.
    let cancelled = false;

    // Signal that audio is (about to) start.
    if (onAudioStatusChange) onAudioStatusChange(true);

    const generateAudio = async () => {
      try {
        const res = await fetch('/api/generate-speech', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: question,
            voice: 'coral', // Adjust voice as desired.
            instructions: 'Speak clearly in a neutral tone.'
          })
        });
        if (cancelled) return;
        const audioBuffer = await res.arrayBuffer();
        if (cancelled) return;
        const blob = new Blob([audioBuffer], { type: 'audio/mpeg' });
        const audioUrl = URL.createObjectURL(blob);
        const newAudio = new Audio(audioUrl);
        newAudio.addEventListener('ended', () => {
          setIsPlaying(false);
          if (onAudioStatusChange) onAudioStatusChange(false);
        });
        // Try autoplaying the audio.
        newAudio.play()
          .then(() => {
            if (!cancelled) {
              setAudioElement(newAudio);
              setIsPlaying(true);
              if (onAudioStatusChange) onAudioStatusChange(true);
            }
          })
          .catch((err: unknown) => {
            console.error("Autoplay blocked for question audio:", err);
            if (!cancelled) {
              setAudioElement(newAudio);
              setIsPlaying(false);
              if (onAudioStatusChange) onAudioStatusChange(false);
            }
          });
      } catch (err: unknown) {
        if (!cancelled) {
          const errorMsg = err instanceof Error ? err.message : "An error occurred while generating question audio.";
          setError(errorMsg);
          if (onAudioStatusChange) onAudioStatusChange(false);
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
      // If audio is ended, reset time to replay.
      if (audioElement.ended) {
        audioElement.currentTime = 0;
      }
      // Resume playback if paused.
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
    <div className="p-6 bg-gradient-to-br from-gray-700 to-gray-900 rounded-lg shadow-lg mb-6 transform transition duration-500 hover:scale-105">
      <h3 className="text-2xl font-bold text-white mb-2">Question:</h3>
      <p key={animationKey} className="text-white text-lg" style={{ animation: 'fadeIn 1s ease forwards' }}>
        {question}
      </p>
      {/* Audio Playback Controls */}
      <div className="mt-4">
        <p className="text-gray-600 italic">Listen to the question:</p>
        <div className="flex gap-4 justify-center mt-2">
          {isPlaying ? (
            <>
              <button onClick={handlePause} title="Pause Audio" className="flex items-center justify-center">
                <FontAwesomeIcon icon={faPause} className="text-3xl text-yellow-600 hover:text-yellow-700 transition" />
              </button>
              <button onClick={handleStop} title="Stop Audio" className="flex items-center justify-center">
                <FontAwesomeIcon icon={faStop} className="text-3xl text-red-600 hover:text-red-700 transition" />
              </button>
            </>
          ) : (
            <button onClick={handlePlay} title="Replay Audio" className="flex items-center justify-center">
              <FontAwesomeIcon icon={faPlay} className="text-3xl text-blue-600 hover:text-blue-700 transition" />
            </button>
          )}
        </div>
        {error && <div className="mt-2 text-red-600">{error}</div>}
      </div>
    </div>
  );
};

export default QuestionDisplay;
