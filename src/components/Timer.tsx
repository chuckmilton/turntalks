'use client';
import React, { useEffect, useRef, useState } from 'react';

interface TimerProps {
  initialTime: number;
  onTimeUp: () => void;
}

const Timer: React.FC<TimerProps> = ({ initialTime, onTimeUp }) => {
  const [timeLeft, setTimeLeft] = useState(initialTime);
  
  // Store the initialTime and startTime so they don't reset on re-renders.
  const startTimeRef = useRef<number>(Date.now());
  const initialTimeRef = useRef<number>(initialTime);
  
  // If onTimeUp changes, update the ref.
  const onTimeUpRef = useRef(onTimeUp);
  useEffect(() => {
    onTimeUpRef.current = onTimeUp;
  }, [onTimeUp]);

  // Setup an interval only once on mount.
  useEffect(() => {
    // Record the time when the timer mounts.
    startTimeRef.current = Date.now();

    const intervalId = setInterval(() => {
      // Calculate the elapsed time.
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const remaining = initialTimeRef.current - elapsed;
      setTimeLeft(remaining);

      if (remaining <= 0) {
        clearInterval(intervalId);
        onTimeUpRef.current();
      }
    }, 250); // update every 250 ms for smoothness

    return () => clearInterval(intervalId);
  }, []); // empty dependency array ensures this runs only on mount

  const bgColorClass = timeLeft <= 10 ? "bg-red-600" : "bg-gray-800";

  return (
    <div className={`p-6 ${bgColorClass} text-white rounded-lg shadow-md text-center transition-transform transform`}>
      <div className="text-2xl font-semibold mb-2">Time Left</div>
      <div className="text-4xl font-bold">{Math.max(timeLeft, 0)}s</div>
    </div>
  );
};

export default Timer;
