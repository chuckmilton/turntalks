'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface RatingProps {
  sessionId: string;
  initialRating?: number | null;
}

const Rating: React.FC<RatingProps> = ({ sessionId, initialRating = null }) => {
  const [rating, setRating] = useState<number | null>(initialRating);
  const [submitted, setSubmitted] = useState<boolean>(initialRating !== null);

  // Update local state if initialRating changes.
  useEffect(() => {
    setRating(initialRating);
    setSubmitted(initialRating !== null);
  }, [initialRating]);

  const handleRate = async (num: number) => {
    setRating(num);
    const { error } = await supabase
      .from('sessions')
      .update({ rating: num })
      .eq('id', sessionId);
    if (error) {
      alert(error.message);
    } else {
      setSubmitted(true);
    }
  };

  return (
    <div className="flex items-center space-x-2">
      {[1, 2, 3, 4, 5].map((num) => (
        <button
          key={num}
          onClick={() => handleRate(num)}
          className={`px-4 py-2 rounded ${
            rating === num ? 'bg-yellow-500 text-white' : 'bg-gray-200'
          }`}
          disabled={submitted}
        >
          {num}
        </button>
      ))}
      {submitted && rating && <span className="ml-2">You rated: {rating}</span>}
    </div>
  );
};

export default Rating;
