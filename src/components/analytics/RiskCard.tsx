/**
 * Risk Status Card Component
 * Displays overall risk level with color coding
 */

import React from 'react';

interface RiskCardProps {
  riskLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  predictedAverage: number;
  currentAverage: number;
  attendanceRate: number;
}

export default function RiskCard({
  riskLevel,
  predictedAverage,
  currentAverage,
  attendanceRate,
}: RiskCardProps) {
  const riskConfig = {
    HIGH: {
      bg: 'bg-red-50',
      border: 'border-red-500',
      text: 'text-red-700',
      badge: 'bg-red-500',
      icon: '⚠️',
      title: 'High Risk',
      message: 'Immediate intervention recommended',
    },
    MEDIUM: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-500',
      text: 'text-yellow-700',
      badge: 'bg-yellow-500',
      icon: '⚡',
      title: 'Medium Risk',
      message: 'Additional support recommended',
    },
    LOW: {
      bg: 'bg-green-50',
      border: 'border-green-500',
      text: 'text-green-700',
      badge: 'bg-green-500',
      icon: '✓',
      title: 'Low Risk',
      message: 'On track, continue current efforts',
    },
  };

  const config = riskConfig[riskLevel];
  const trend = predictedAverage > currentAverage ? '↗' : predictedAverage < currentAverage ? '↘' : '→';

  return (
    <div className={`${config.bg} ${config.border} border-l-4 p-6 rounded-lg shadow-sm`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{config.icon}</span>
          <div>
            <h3 className={`font-bold text-lg ${config.text}`}>{config.title}</h3>
            <p className="text-sm text-gray-600">{config.message}</p>
          </div>
        </div>
        <div className={`${config.badge} text-white px-3 py-1 rounded-full text-sm font-semibold`}>
          {riskLevel}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mt-4">
        <div className="text-center">
          <p className="text-gray-500 text-xs uppercase mb-1">Current Avg</p>
          <p className="text-2xl font-bold text-gray-800">{currentAverage}%</p>
        </div>
        <div className="text-center">
          <p className="text-gray-500 text-xs uppercase mb-1">Predicted Avg</p>
          <p className={`text-2xl font-bold ${config.text} flex items-center justify-center gap-1`}>
            {predictedAverage}% <span className="text-lg">{trend}</span>
          </p>
        </div>
        <div className="text-center">
          <p className="text-gray-500 text-xs uppercase mb-1">Attendance</p>
          <p className={`text-2xl font-bold ${attendanceRate >= 75 ? 'text-green-600' : 'text-red-600'}`}>
            {attendanceRate}%
          </p>
        </div>
      </div>
    </div>
  );
}
