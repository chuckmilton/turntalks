// /src/components/QuestionDisplay.tsx
import React from 'react';

interface QuestionDisplayProps {
  question: string;
}

const QuestionDisplay: React.FC<QuestionDisplayProps> = ({ question }) => {
  return (
    <div className="p-6 bg-gradient-to-br from-gray-700 to-gray-900 rounded-lg shadow-lg mb-6 transform transition duration-500 hover:scale-105">
      <h3 className="text-2xl font-bold text-white mb-2">Question:</h3>
      <p className="text-white text-lg">{question}</p>
    </div>
  );
};

export default QuestionDisplay;
