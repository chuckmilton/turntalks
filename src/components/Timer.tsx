"use client";
import React, { useEffect, useRef, useState } from "react";
import { motion, useAnimation } from "framer-motion";

interface TimerProps {
  initialTime: number;
  onTimeUp: () => void;
}

const Timer: React.FC<TimerProps> = ({ initialTime, onTimeUp }) => {
  const [timeLeft, setTimeLeft] = useState(initialTime);

  // Store initial time and start time in refs to persist across renders.
  const startTimeRef = useRef<number>(Date.now());
  const initialTimeRef = useRef<number>(initialTime);

  // Ref for onTimeUp callback.
  const onTimeUpRef = useRef(onTimeUp);
  useEffect(() => {
    onTimeUpRef.current = onTimeUp;
  }, [onTimeUp]);

  // Animation controls for background color.
  const controls = useAnimation();

  // Setup the timer interval.
  useEffect(() => {
    startTimeRef.current = Date.now();
    const intervalId = setInterval(() => {
      // Calculate elapsed and remaining time.
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const remaining = initialTimeRef.current - elapsed;
      setTimeLeft(remaining);

      // Animate background based on time left.
      if (remaining <= 10) {
        controls.start({ backgroundColor: "#DC2626" }); // Tailwind red-600
      } else {
        controls.start({ backgroundColor: "#1F2937" }); // Tailwind gray-800
      }

      // Time is up.
      if (remaining <= 0) {
        clearInterval(intervalId);
        onTimeUpRef.current();
      }
    }, 250); // Update every 250 ms for smoothness.

    return () => clearInterval(intervalId);
  }, [controls]);

  return (
    <motion.div
      animate={controls}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="p-6 text-white rounded-lg shadow-md text-center transform transition-transform"
    >
      <motion.div
        className="text-2xl font-semibold mb-2"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        Time Left
      </motion.div>
      <motion.div
        key={timeLeft}
        className="text-4xl font-bold"
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        {Math.max(timeLeft, 0)}s
      </motion.div>
    </motion.div>
  );
};

export default Timer;
