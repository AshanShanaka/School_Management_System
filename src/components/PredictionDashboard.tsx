/**
 * Prediction Dashboard Component
 * Main dashboard displaying O/L predictions overview
 */

'use client';

import React from 'react';
import { OLGrade } from '@/types/performance';
import PredictionCard from './performance/PredictionCard';

interface SubjectPrediction {
  subject: string;
  current_average: number;
  predicted_mark: number;
  predicted_grade: OLGrade;
  confidence: number;
  trend: 'IMPROVING' | 'DECLINING' | 'STABLE';
}

interface PredictionData {
  subject_predictions: SubjectPrediction[];
  overall_average: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
  risk_status: string;
  pass_probability: number;
  attendance_percentage: number;
  total_subjects: number;
  recommendations: string[];
}

interface PredictionDashboardProps {
  data: PredictionData;
  studentName?: string;
}

export default function PredictionDashboard({
  data,
  studentName,
}: PredictionDashboardProps) {
  // Validate data structure
  if (!data || typeof data !== 'object') {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <p className="text-yellow-800">⚠️ Invalid prediction data format</p>
      </div>
    );
  }

  // Provide safe defaults for all required fields
  const safeData: PredictionData = {
    subject_predictions: data.subject_predictions || [],
    overall_average: data.overall_average ?? 0,
    risk_level: data.risk_level || 'MEDIUM',
    risk_status: data.risk_status || 'Unknown',
    pass_probability: data.pass_probability ?? 0,
    attendance_percentage: data.attendance_percentage ?? 0,
    total_subjects: data.total_subjects ?? data.subject_predictions?.length ?? 0,
    recommendations: data.recommendations || [],
  };

  const getRiskColor = (risk: string) => {
    const colors = {
      LOW: 'bg-green-100 text-green-800 border-green-300',
      MEDIUM: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      HIGH: 'bg-red-100 text-red-800 border-red-300',
    };
    return colors[risk as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getRiskIcon = (risk: string) => {
    if (risk === 'LOW') return '✅';
    if (risk === 'MEDIUM') return '⚠️';
    return '🚨';
  };

  return (
    <div className="space-y-6">
      {/* Student Name Header */}
      {studentName && (
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h2 className="text-2xl font-bold text-gray-800">{studentName}</h2>
          <p className="text-sm text-gray-600">O/L Examination Predictions</p>
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Overall Average */}
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-600 mb-1">Predicted Average</p>
              <p className="text-3xl font-bold text-blue-700">
                {safeData.overall_average.toFixed(1)}%
              </p>
            </div>
            <div className="text-3xl">📊</div>
          </div>
        </div>

        {/* Risk Level */}
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-600 mb-1">Risk Level</p>
              <div
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold border-2 ${getRiskColor(
                  safeData.risk_level
                )}`}
              >
                {getRiskIcon(safeData.risk_level)} {safeData.risk_status}
              </div>
            </div>
          </div>
        </div>

        {/* Pass Probability */}
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-600 mb-1">Pass Probability</p>
              <p className="text-3xl font-bold text-green-700">
                {(safeData.pass_probability * 100).toFixed(0)}%
              </p>
            </div>
            <div className="text-3xl">🎯</div>
          </div>
        </div>

        {/* Attendance */}
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-orange-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-600 mb-1">Attendance</p>
              <p className="text-3xl font-bold text-orange-700">
                {safeData.attendance_percentage.toFixed(1)}%
              </p>
            </div>
            <div className="text-3xl">📅</div>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {safeData.recommendations && safeData.recommendations.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="text-2xl">💡</span>
            Personalized Recommendations
          </h3>
          <ul className="space-y-2">
            {safeData.recommendations.map((recommendation, index) => (
              <li
                key={index}
                className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg"
              >
                <span className="text-blue-600 font-bold">{index + 1}.</span>
                <span className="text-gray-700">{recommendation}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Subject Predictions Grid */}
      <div>
        <h3 className="text-xl font-bold text-gray-800 mb-4">
          Subject-wise Predictions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {safeData.subject_predictions.map((prediction, index) => (
            <PredictionCard
              key={index}
              subject={prediction.subject}
              currentAverage={prediction.current_average}
              predictedMark={prediction.predicted_mark}
              predictedGrade={prediction.predicted_grade}
              confidence={prediction.confidence}
              trend={prediction.trend}
            />
          ))}
        </div>
      </div>

      {/* Grade Distribution */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-bold text-gray-800 mb-4">
          Expected Grade Distribution
        </h3>
        <div className="grid grid-cols-5 gap-4">
          {['A', 'B', 'C', 'S', 'W'].map((grade) => {
            const count = safeData.subject_predictions.filter(
              (p) => p.predicted_grade === grade
            ).length;
            const percentage =
              safeData.subject_predictions.length > 0
                ? (count / safeData.subject_predictions.length) * 100
                : 0;

            return (
              <div
                key={grade}
                className="text-center p-4 bg-gray-50 rounded-lg"
              >
                <div className="text-3xl font-bold text-gray-800 mb-1">
                  {count}
                </div>
                <div className="text-sm text-gray-600 mb-2">Grade {grade}</div>
                <div className="text-xs text-gray-500">
                  {percentage.toFixed(0)}%
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
