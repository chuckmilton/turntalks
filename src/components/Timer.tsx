// /src/components/Timer.tsx
'use client';
import React, { useEffect, useState } from 'react';

interface TimerProps {
  initialTime: number;
  onTimeUp: () => void;
}

const Timer: React.FC<TimerProps> = ({ initialTime, onTimeUp }) => {
  const [timeLeft, setTimeLeft] = useState(initialTime);

  useEffect(() => {
    if (timeLeft <= 0) {
      onTimeUp();
      return;
    }
    const timerId = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    return () => clearTimeout(timerId);
  }, [timeLeft, onTimeUp]);

  return (
    <div className="p-6 bg-gray-800 text-white rounded-lg shadow-md text-center transition-transform transform">
      <div className="text-2xl font-semibold mb-2">Time Left</div>
      <div className="text-4xl font-bold">{timeLeft}s</div>
    </div>
  );
};

export default Timer;
