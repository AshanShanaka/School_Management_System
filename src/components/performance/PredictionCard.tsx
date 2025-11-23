/**
 * Prediction Card Component
 * Displays individual subject prediction details
 */

import React from 'react';
import { OLGrade } from '@/types/performance';

interface PredictionCardProps {
  subject: string;
  currentAverage: number;
  predictedMark: number;
  predictedGrade: OLGrade;
  confidence: number;
  trend: 'IMPROVING' | 'DECLINING' | 'STABLE';
}

export default function PredictionCard({
  subject,
  currentAverage,
  predictedMark,
  predictedGrade,
  confidence,
  trend,
}: PredictionCardProps) {
  const getGradeColor = (grade: OLGrade) => {
    const colors = {
      A: 'bg-green-100 text-green-800 border-green-300',
      B: 'bg-blue-100 text-blue-800 border-blue-300',
      C: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      S: 'bg-orange-100 text-orange-800 border-orange-300',
      W: 'bg-red-100 text-red-800 border-red-300',
    };
    return colors[grade];
  };

  const getTrendIcon = () => {
    if (trend === 'IMPROVING') {
      return <span className="text-green-600 text-2xl">↗</span>;
    } else if (trend === 'DECLINING') {
      return <span className="text-red-600 text-2xl">↘</span>;
    }
    return <span className="text-gray-600 text-2xl">→</span>;
  };

  const getTrendText = () => {
    if (trend === 'IMPROVING') {
      return <span className="text-green-600 font-semibold">Improving</span>;
    } else if (trend === 'DECLINING') {
      return <span className="text-red-600 font-semibold">Declining</span>;
    }
    return <span className="text-gray-600 font-semibold">Stable</span>;
  };

  const markDiff = predictedMark - currentAverage;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
      {/* Subject Header */}
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-bold text-gray-800">{subject}</h3>
        <div className="flex items-center gap-2">
          {getTrendIcon()}
        </div>
      </div>

      {/* Predicted Grade Badge */}
      <div className="mb-4">
        <div
          className={`inline-flex items-center px-4 py-2 rounded-full border-2 font-bold text-2xl ${getGradeColor(
            predictedGrade
          )}`}
        >
          Grade: {predictedGrade}
        </div>
      </div>

      {/* Marks Comparison */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-gray-50 p-3 rounded-lg">
          <p className="text-xs text-gray-600 mb-1">Current Average</p>
          <p className="text-2xl font-bold text-gray-800">{currentAverage.toFixed(1)}%</p>
        </div>
        <div className="bg-blue-50 p-3 rounded-lg">
          <p className="text-xs text-blue-600 mb-1">Predicted Mark</p>
          <p className="text-2xl font-bold text-blue-800">{predictedMark.toFixed(1)}%</p>
        </div>
      </div>

      {/* Mark Difference */}
      <div className="mb-4">
        <div
          className={`flex items-center gap-2 p-2 rounded ${
            markDiff > 0
              ? 'bg-green-50 text-green-700'
              : markDiff < 0
              ? 'bg-red-50 text-red-700'
              : 'bg-gray-50 text-gray-700'
          }`}
        >
          <span className="text-sm font-semibold">
            {markDiff > 0 ? '+' : ''}
            {markDiff.toFixed(1)} marks
          </span>
          <span className="text-xs">from current average</span>
        </div>
      </div>

      {/* Confidence and Trend */}
      <div className="flex justify-between items-center pt-3 border-t border-gray-200">
        <div>
          <p className="text-xs text-gray-600">Confidence</p>
          <div className="flex items-center gap-2">
            <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full"
                style={{ width: `${confidence * 100}%` }}
              ></div>
            </div>
            <span className="text-sm font-semibold text-gray-700">
              {(confidence * 100).toFixed(0)}%
            </span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-600">Trend</p>
          {getTrendText()}
        </div>
      </div>
    </div>
  );
}
