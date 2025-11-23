/**
 * Subject Performance Table Component
 * Shows performance for each subject
 */

import React from 'react';

interface SubjectPrediction {
  subject: string;
  currentAverage: number;
}

interface SubjectTableProps {
  predictions: SubjectPrediction[];
}

export default function SubjectTable({ predictions }: SubjectTableProps) {
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'IMPROVING':
        return <span className="text-green-600 text-xl">↗</span>;
      case 'DECLINING':
        return <span className="text-red-600 text-xl">↘</span>;
      default:
        return <span className="text-gray-600 text-xl">→</span>;
    }
  };

  const getRiskBadge = (risk: string) => {
    const config = {
      HIGH: 'bg-red-100 text-red-700 border-red-300',
      MEDIUM: 'bg-yellow-100 text-yellow-700 border-yellow-300',
      LOW: 'bg-green-100 text-green-700 border-green-300',
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${config[risk as keyof typeof config]}`}>
        {risk}
      </span>
    );
  };

  if (predictions.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
        <p className="text-gray-500">
          No predictions available. Insufficient exam data (need at least 9 historical exams per subject).
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full bg-white rounded-lg overflow-hidden shadow-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="text-left p-4 font-semibold text-gray-700">Subject</th>
            <th className="text-center p-4 font-semibold text-gray-700">Current Avg</th>
            <th className="text-center p-4 font-semibold text-gray-700">Predicted Mark</th>
            <th className="text-center p-4 font-semibold text-gray-700">Grade</th>
            <th className="text-center p-4 font-semibold text-gray-700">Trend</th>
            <th className="text-center p-4 font-semibold text-gray-700">Risk</th>
          </tr>
        </thead>
        <tbody>
          {predictions.map((pred, index) => (
            <tr
              key={pred.subjectId}
              className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${
                index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
              }`}
            >
              <td className="p-4 font-medium text-gray-800">{pred.subjectName}</td>
              <td className="p-4 text-center text-gray-700">{pred.currentAverage}%</td>
              <td className="p-4 text-center">
                <span className="font-bold text-gray-900">{pred.predictedMark}%</span>
              </td>
              <td className="p-4 text-center">
                <span className="font-bold text-blue-600 text-lg">{pred.predictedGrade}</span>
              </td>
              <td className="p-4 text-center">{getTrendIcon(pred.trend)}</td>
              <td className="p-4 text-center">{getRiskBadge(pred.riskLevel)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
