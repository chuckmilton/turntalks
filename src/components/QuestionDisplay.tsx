// /src/components/QuestionDisplay.tsx
import React from 'react';

interface QuestionDisplayProps {
  question: string;
}

const QuestionDisplay: React.FC<QuestionDisplayProps> = ({ question }) => {
  return (
    <div className="p-4 bg-gray-700 rounded mb-4">
      <h3 className="text-xl font-bold">Question:</h3>
      <p>{question}</p>
    </div>
  );
};

export default QuestionDisplay;
