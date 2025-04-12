import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlay,
  faPause,
  faStop,
  faSpinner,
} from '@fortawesome/free-solid-svg-icons';

interface QuestionDisplayProps {
  question: string;
  onAudioStatusChange?: (isPlaying: boolean) => void;
}

const QuestionDisplay: React.FC<QuestionDisplayProps> = ({ question, onAudioStatusChange }) => {
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [animationKey, setAnimationKey] = useState<number>(Date.now());
  // New state to track if audio generation is in progress.
  const [audioLoading, setAudioLoading] = useState<boolean>(false);

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

    // Cancellation flag to avoid race conditions.
    let cancelled = false;

    // Signal that audio is (about to) start.
    if (onAudioStatusChange) onAudioStatusChange(true);

    // Set loading state true.
    setAudioLoading(true);

    const generateAudio = async () => {
      try {
        const res = await fetch('/api/generate-speech', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: question,
            voice: 'nova',
            instructions: 'Tone: The voice should be refined, formal, and delightfully theatrical, reminiscent of a charming radio announcer from the early 20th century. Pacing: The speech should flow smoothly at a steady cadence, neither rushed nor sluggish, allowing for clarity and a touch of grandeur. Pronunciation: Words should be enunciated crisply and elegantly, with an emphasis on vintage expressions and a slight flourish on key phrases. Emotion: The delivery should feel warm, enthusiastic, and welcoming, as if addressing a distinguished audience with utmost politeness. Inflection: Gentle rises and falls in pitch should be used to maintain engagement, adding a playful yet dignified flair to each sentence. Word Choice: The script should incorporate vintage expressions like splendid, marvelous, posthaste, and ta-ta for now, avoiding modern slang.'
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
              setAudioLoading(false);
            }
          })
          .catch((err: unknown) => {
            console.error("Autoplay blocked for question audio:", err);
            if (!cancelled) {
              setAudioElement(newAudio);
              setIsPlaying(false);
              if (onAudioStatusChange) onAudioStatusChange(false);
              setAudioLoading(false);
            }
          });
      } catch (err: unknown) {
        if (!cancelled) {
          const errorMsg = err instanceof Error ? err.message : "An error occurred while generating question audio.";
          setError(errorMsg);
          if (onAudioStatusChange) onAudioStatusChange(false);
          setAudioLoading(false);
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
      // If audio ended, reset time to replay.
      if (audioElement.ended) {
        audioElement.currentTime = 0;
      }
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
    <div className="p-6 bg-gradient-to-br from-gray-700 to-gray-900 rounded-lg shadow-lg mb-6">
      <h3 className="text-2xl font-bold text-white mb-2">Question:</h3>
      <p key={animationKey} className="text-white text-lg" style={{ animation: 'fadeIn 1s ease forwards' }}>
        {question}
      </p>
      {/* Audio Playback Controls */}
      <div className="mt-4">
        <p className="text-gray-600 italic">Listen to the question:</p>
        <div className="flex gap-4 justify-center mt-2">
          {audioLoading ? (
            // Show animated spinner while audio is loading.
            <div className="flex items-center justify-center">
              <FontAwesomeIcon icon={faSpinner} spin className="text-3xl text-blue-600" />
            </div>
          ) : (
            // Otherwise, show controls.
            isPlaying ? (
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
            )
          )}
        </div>
        {error && <div className="mt-2 text-red-600">{error}</div>}
      </div>
    </div>
  );
};

export default QuestionDisplay;
