// /src/components/Rating.tsx
'use client';
import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface RatingProps {
  sessionId: string;
}

const Rating: React.FC<RatingProps> = ({ sessionId }) => {
  const [rating, setRating] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

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
          className={`px-4 py-2 rounded ${rating === num ? 'bg-yellow-500 text-white' : 'bg-gray-200'}`}
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
