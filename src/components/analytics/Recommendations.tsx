/**
 * Recommendations List Component
 * Displays actionable recommendations
 */

import React from 'react';

interface RecommendationsProps {
  recommendations: string[];
  title?: string;
}

export default function Recommendations({ recommendations, title = 'Recommendations' }: RecommendationsProps) {
  if (recommendations.length === 0) {
    return null;
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
      <h3 className="font-bold text-lg text-blue-900 mb-4 flex items-center gap-2">
        <span>💡</span> {title}
      </h3>
      <ul className="space-y-2">
        {recommendations.map((rec, index) => (
          <li key={index} className="flex items-start gap-3">
            <span className="text-blue-600 mt-1">•</span>
            <span className="text-gray-700">{rec}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
