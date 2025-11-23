/**
 * Subject Prediction Table Component
 * Displays all subjects in a tabular format
 */

import React from 'react';
import { OLGrade } from '@/types/performance';

interface SubjectPrediction {
  subject: string;
  current_average: number;
  predicted_mark: number;
  predicted_grade: OLGrade;
  confidence: number;
  trend: 'IMPROVING' | 'DECLINING' | 'STABLE';
}

interface SubjectPredictionTableProps {
  predictions: SubjectPrediction[];
}

export default function SubjectPredictionTable({
  predictions,
}: SubjectPredictionTableProps) {
  const getGradeColor = (grade: OLGrade) => {
    const colors = {
      A: 'bg-green-100 text-green-800',
      B: 'bg-blue-100 text-blue-800',
      C: 'bg-yellow-100 text-yellow-800',
      S: 'bg-orange-100 text-orange-800',
      W: 'bg-red-100 text-red-800',
    };
    return colors[grade];
  };

  const getTrendIcon = (trend: string) => {
    if (trend === 'IMPROVING') {
      return <span className="text-green-600 text-xl font-bold">↗</span>;
    } else if (trend === 'DECLINING') {
      return <span className="text-red-600 text-xl font-bold">↘</span>;
    }
    return <span className="text-gray-600 text-xl font-bold">→</span>;
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Subject
              </th>
              <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Current Avg
              </th>
              <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Predicted Mark
              </th>
              <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Predicted Grade
              </th>
              <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Trend
              </th>
              <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Confidence
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {predictions.map((pred, index) => {
              const markDiff = pred.predicted_mark - pred.current_average;
              return (
                <tr
                  key={index}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="font-semibold text-gray-800">
                      {pred.subject}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-gray-700 font-medium">
                      {pred.current_average.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex flex-col items-center">
                      <span className="text-blue-700 font-bold text-lg">
                        {pred.predicted_mark.toFixed(1)}%
                      </span>
                      <span
                        className={`text-xs font-semibold ${
                          markDiff > 0
                            ? 'text-green-600'
                            : markDiff < 0
                            ? 'text-red-600'
                            : 'text-gray-600'
                        }`}
                      >
                        {markDiff > 0 ? '+' : ''}
                        {markDiff.toFixed(1)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${getGradeColor(
                        pred.predicted_grade
                      )}`}
                    >
                      {pred.predicted_grade}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {getTrendIcon(pred.trend)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden mb-1">
                        <div
                          className="h-full bg-blue-600 rounded-full"
                          style={{ width: `${pred.confidence * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-xs font-semibold text-gray-600">
                        {(pred.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Summary Footer */}
      <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-gray-600 mb-1">Total Subjects</p>
            <p className="text-lg font-bold text-gray-800">
              {predictions.length}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600 mb-1">Average Predicted</p>
            <p className="text-lg font-bold text-blue-700">
              {(
                predictions.reduce((sum, p) => sum + p.predicted_mark, 0) /
                predictions.length
              ).toFixed(1)}
              %
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600 mb-1">Pass Rate</p>
            <p className="text-lg font-bold text-green-700">
              {(
                (predictions.filter((p) => p.predicted_mark >= 35).length /
                  predictions.length) *
                100
              ).toFixed(0)}
              %
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
