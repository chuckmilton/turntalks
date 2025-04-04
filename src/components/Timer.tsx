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

  return <div className="text-lg font-bold">Time Left: {timeLeft}s</div>;
};

export default Timer;
