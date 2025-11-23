/**
 * Class Analytics Dashboard Client Component
 * Interactive dashboard with charts and tables
 */

'use client';

import React, { useState, useEffect } from 'react';
import { ClassAnalyticsSummary, StudentAnalytics } from '@/lib/performanceAnalyticsService';
import RiskCard from '@/components/analytics/RiskCard';
import SubjectTable from '@/components/analytics/SubjectTable';
import Recommendations from '@/components/analytics/Recommendations';

interface ClassAnalyticsDashboardProps {
  classId: number;
}

export default function ClassAnalyticsDashboard({ classId }: ClassAnalyticsDashboardProps) {
  const [data, setData] = useState<ClassAnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mlApiStatus, setMlApiStatus] = useState<'online' | 'offline'>('offline');
  const [selectedStudent, setSelectedStudent] = useState<StudentAnalytics | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, [classId]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/analytics/class/${classId}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch analytics');
      }

      setData(result.data);
      setMlApiStatus(result.mlApiStatus);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Analyzing student performance...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl">⚠️</span>
          <h3 className="font-bold text-red-800">Error Loading Analytics</h3>
        </div>
        <p className="text-red-700 mb-4">{error}</p>
        {mlApiStatus === 'offline' && (
          <div className="bg-yellow-50 border border-yellow-300 rounded p-4 mt-4">
            <p className="text-sm text-yellow-800">
              <strong>ML Prediction Service Offline:</strong> Make sure the Flask API is running:
            </p>
            <code className="block mt-2 bg-gray-800 text-white p-2 rounded text-sm">
              cd Predict && python api.py
            </code>
          </div>
        )}
        <button
          onClick={fetchAnalytics}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-gray-100 border border-gray-200 rounded-lg p-6 text-center">
        <p className="text-gray-600">No data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ML API Status Banner */}
      <div className={`${mlApiStatus === 'online' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} border rounded-lg p-4`}>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${mlApiStatus === 'online' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
          <p className={`font-semibold ${mlApiStatus === 'online' ? 'text-green-800' : 'text-red-800'}`}>
            ML Prediction Service: {mlApiStatus === 'online' ? 'Online' : 'Offline'}
          </p>
        </div>
      </div>

      {/* Class Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <p className="text-gray-500 text-sm mb-2">Total Students</p>
          <p className="text-3xl font-bold text-gray-800">{data.totalStudents}</p>
        </div>
        <div className="bg-red-50 p-6 rounded-lg shadow-sm border border-red-200">
          <p className="text-red-700 text-sm mb-2">High Risk</p>
          <p className="text-3xl font-bold text-red-600">{data.highRiskCount}</p>
        </div>
        <div className="bg-yellow-50 p-6 rounded-lg shadow-sm border border-yellow-200">
          <p className="text-yellow-700 text-sm mb-2">Medium Risk</p>
          <p className="text-3xl font-bold text-yellow-600">{data.mediumRiskCount}</p>
        </div>
        <div className="bg-green-50 p-6 rounded-lg shadow-sm border border-green-200">
          <p className="text-green-700 text-sm mb-2">Low Risk</p>
          <p className="text-3xl font-bold text-green-600">{data.lowRiskCount}</p>
        </div>
        <div className="bg-blue-50 p-6 rounded-lg shadow-sm border border-blue-200">
          <p className="text-blue-700 text-sm mb-2">Class Average</p>
          <p className="text-3xl font-bold text-blue-600">{data.classAverage}%</p>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">Student Performance Analysis</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="text-left p-4 font-semibold text-gray-700">Student Name</th>
                <th className="text-center p-4 font-semibold text-gray-700">Current Avg</th>
                <th className="text-center p-4 font-semibold text-gray-700">Predicted Avg</th>
                <th className="text-center p-4 font-semibold text-gray-700">Attendance</th>
                <th className="text-center p-4 font-semibold text-gray-700">Risk Level</th>
                <th className="text-center p-4 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.students
                .sort((a, b) => {
                  const riskOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
                  return riskOrder[a.overallRiskLevel] - riskOrder[b.overallRiskLevel];
                })
                .map((student, index) => (
                  <tr key={student.studentId} className={`border-b border-gray-200 hover:bg-gray-50 transition-colors`}>
                    <td className="p-4 font-medium text-gray-800">{student.studentName}</td>
                    <td className="p-4 text-center text-gray-700">{student.currentAverage}%</td>
                    <td className="p-4 text-center">
                      <span className="font-bold text-gray-900">{student.predictedAverage}%</span>
                      <span className="ml-2 text-lg">
                        {student.predictedAverage > student.currentAverage ? '↗' : student.predictedAverage < student.currentAverage ? '↘' : '→'}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span className={student.attendanceRate >= 75 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                        {student.attendanceRate}%
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          student.overallRiskLevel === 'HIGH'
                            ? 'bg-red-100 text-red-700 border border-red-300'
                            : student.overallRiskLevel === 'MEDIUM'
                            ? 'bg-yellow-100 text-yellow-700 border border-yellow-300'
                            : 'bg-green-100 text-green-700 border border-green-300'
                        }`}
                      >
                        {student.overallRiskLevel}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => setSelectedStudent(student)}
                        className="text-blue-600 hover:text-blue-800 font-semibold text-sm hover:underline"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student Detail Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">{selectedStudent.studentName}</h2>
              <button
                onClick={() => setSelectedStudent(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="p-6 space-y-6">
              <RiskCard
                riskLevel={selectedStudent.overallRiskLevel}
                predictedAverage={selectedStudent.predictedAverage}
                currentAverage={selectedStudent.currentAverage}
                attendanceRate={selectedStudent.attendanceRate}
              />
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-4">Subject-wise Analysis</h3>
                <SubjectTable predictions={selectedStudent.subjectPredictions} />
              </div>
              <Recommendations recommendations={selectedStudent.recommendations} title="Action Plan" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
