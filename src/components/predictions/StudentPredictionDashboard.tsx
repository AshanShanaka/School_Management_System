/**
 * Student Prediction Dashboard Component
 * Reusable component for displaying individual student O/L predictions
 * Used by: Student page, Parent page, Class Teacher page
 */

'use client';

import { useEffect, useState } from 'react';

interface PredictionData {
  subject_predictions: any[];
  overall_average: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
  risk_status: string;
  pass_probability: number;
  attendance_percentage: number;
}

interface StudentPredictionDashboardProps {
  apiEndpoint: string; // API to fetch predictions from
  studentName?: string; // Optional student name (for parent view)
  showHeader?: boolean; // Show page header
}

export default function StudentPredictionDashboard({
  apiEndpoint,
  studentName,
  showHeader = true
}: StudentPredictionDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [predictionData, setPredictionData] = useState<PredictionData | null>(null);

  useEffect(() => {
    fetchPredictions();
  }, [apiEndpoint]);

  const fetchPredictions = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('[Dashboard] Fetching from:', apiEndpoint);
      const response = await fetch(apiEndpoint);
      const data = await response.json();

      console.log('[Dashboard] Response:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch predictions');
      }

      if (!data.data || !data.data.subject_predictions) {
        throw new Error('Invalid prediction data format');
      }

      setPredictionData(data.data);
    } catch (err) {
      console.error('[Dashboard] Error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading predictions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-2xl mx-auto">
          <div className="flex items-start gap-3">
            <span className="text-3xl">❌</span>
            <div>
              <h2 className="text-xl font-bold text-red-800 mb-2">Error</h2>
              <p className="text-red-700">{error}</p>
              <button
                onClick={fetchPredictions}
                className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!predictionData) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-2xl mx-auto">
          <div className="text-center">
            <span className="text-5xl">📊</span>
            <h2 className="text-xl font-bold text-yellow-800 mt-4 mb-2">No Prediction Data</h2>
            <p className="text-yellow-700">
              Insufficient exam data available. Please ensure you have at least 3-5 exam results per subject.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const passCount = predictionData.subject_predictions?.filter(p => p.predicted_mark >= 35).length || 0;
  const aOrBGrades = predictionData.subject_predictions?.filter(p => ['A', 'B'].includes(p.predicted_grade)).length || 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      {showHeader && (
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            {studentName ? `${studentName}'s O/L Predictions` : 'My O/L Predictions'}
          </h1>
          <p className="text-gray-600">
            AI-Powered Performance Analytics
          </p>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-lg shadow border border-gray-200">
          <div className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-2">Overall Average</div>
          <div className="text-4xl font-bold text-gray-900 mb-1">
            {predictionData.overall_average.toFixed(1)}%
          </div>
          <div className="text-xs text-gray-500">Predicted Performance</div>
        </div>

        <div className="bg-white p-5 rounded-lg shadow border border-gray-200">
          <div className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-2">Pass Probability</div>
          <div className="text-4xl font-bold text-gray-900 mb-1">
            {(predictionData.pass_probability * 100).toFixed(0)}%
          </div>
          <div className="text-xs text-gray-500">ML Confidence</div>
        </div>

        <div className="bg-white p-5 rounded-lg shadow border border-gray-200">
          <div className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-2">Attendance</div>
          <div className="text-4xl font-bold text-gray-900 mb-1">
            {predictionData.attendance_percentage.toFixed(1)}%
          </div>
          <div className="text-xs text-gray-500">Last 30 Days</div>
        </div>

        <div className="bg-white p-5 rounded-lg shadow border border-gray-200">
          <div className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-2">Expected Pass</div>
          <div className="text-4xl font-bold text-gray-900 mb-1">
            {passCount}
            <span className="text-lg text-gray-500">/{predictionData.subject_predictions?.length || 0}</span>
          </div>
          <div className="text-xs text-gray-500">Subjects</div>
        </div>

        <div className={`p-5 rounded-lg shadow border-2 ${
          predictionData.risk_level === 'HIGH' 
            ? 'bg-red-50 border-red-400'
            : predictionData.risk_level === 'MEDIUM'
            ? 'bg-yellow-50 border-yellow-400'
            : 'bg-green-50 border-green-400'
        }`}>
          <div className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-2">Risk Level</div>
          <div className={`text-2xl font-bold mb-1 ${
            predictionData.risk_level === 'HIGH' ? 'text-red-700' :
            predictionData.risk_level === 'MEDIUM' ? 'text-yellow-700' : 'text-green-700'
          }`}>
            {predictionData.risk_status}
          </div>
          <div className="text-xs text-gray-600">AI Assessment</div>
        </div>
      </div>

      {/* Performance Chart */}
      <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
        <div className="flex items-center justify-between mb-5 pb-3 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Subject Performance Matrix</h3>
            <p className="text-xs text-gray-500 mt-1">Predicted grades and performance</p>
          </div>
        </div>
        
        {predictionData.subject_predictions && predictionData.subject_predictions.length > 0 ? (
          <div className="space-y-4">
            <div className="relative" style={{ height: '400px' }}>
              {/* Y-Axis */}
              <div className="absolute left-0 top-0 bottom-8 w-16 flex flex-col justify-between text-xs text-gray-500 pr-2 border-r border-gray-200">
                <span className="text-right font-medium">100%</span>
                <span className="text-right">75%</span>
                <span className="text-right">50%</span>
                <span className="text-right">25%</span>
                <span className="text-right">0%</span>
              </div>

              {/* Pass Line */}
              <div className="absolute left-16 right-12 bottom-8" style={{ bottom: 'calc(2rem + 35%)' }}>
                <div className="border-t-2 border-dashed border-red-300 relative">
                  <span className="absolute -top-5 left-2 text-xs text-red-600 font-semibold bg-red-50 px-2 py-0.5 rounded">
                    Pass Line (35%)
                  </span>
                </div>
              </div>

              {/* Bars */}
              <div className="absolute left-16 right-12 top-0 bottom-8 flex items-end justify-around px-2">
                {predictionData.subject_predictions.map((pred: any, index: number) => {
                  const barHeight = pred.predicted_mark;
                  const diff = pred.predicted_mark - pred.current_average;

                  return (
                    <div key={index} className="flex-1 flex flex-col items-center justify-end px-1 relative group" style={{ height: '100%' }}>
                      {/* Tooltip */}
                      <div className="absolute bottom-full mb-2 hidden group-hover:block z-10 bg-gray-900 text-white text-xs rounded px-3 py-2 whitespace-nowrap shadow-lg">
                        <div className="font-semibold mb-1">{pred.subject}</div>
                        <div>Current: {pred.current_average.toFixed(1)}%</div>
                        <div>Predicted: {pred.predicted_mark.toFixed(1)}%</div>
                        <div>Grade: {pred.predicted_grade}</div>
                        <div>Confidence: {(pred.confidence * 100).toFixed(0)}%</div>
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full w-0 h-0 border-4 border-transparent border-t-gray-900"></div>
                      </div>

                      {/* Bar */}
                      <div 
                        className={`w-full rounded-t transition-all duration-500 relative shadow-md ${
                          pred.predicted_grade === 'A' ? 'bg-gradient-to-t from-green-600 to-green-400' :
                          pred.predicted_grade === 'B' ? 'bg-gradient-to-t from-blue-600 to-blue-400' :
                          pred.predicted_grade === 'C' ? 'bg-gradient-to-t from-yellow-600 to-yellow-400' :
                          pred.predicted_grade === 'S' ? 'bg-gradient-to-t from-orange-600 to-orange-400' : 
                          'bg-gradient-to-t from-red-600 to-red-400'
                        }`}
                        style={{ height: `${barHeight}%`, minHeight: '20px' }}
                      >
                        {/* Grade Badge */}
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white border-2 border-gray-300 rounded-full w-8 h-8 flex items-center justify-center text-xs font-bold text-gray-800 shadow">
                          {pred.predicted_grade}
                        </div>

                        {/* Percentage */}
                        {barHeight > 15 && (
                          <div className="absolute top-2 left-1/2 -translate-x-1/2 text-xs font-bold text-white">
                            {pred.predicted_mark.toFixed(0)}%
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* X-Axis */}
              <div className="absolute left-16 right-12 bottom-0 h-8 flex justify-around items-start pt-2 border-t border-gray-200">
                {predictionData.subject_predictions.map((pred: any, index: number) => (
                  <div key={index} className="flex-1 text-center">
                    <span className="text-xs text-gray-700 font-medium block truncate px-1">
                      {pred.subject}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">No subject data available</div>
        )}
      </div>

      {/* Subject Table */}
      <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-3 border-b border-gray-200">Subject-wise Analysis</h3>
        {predictionData.subject_predictions && predictionData.subject_predictions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-200 bg-gray-50">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Subject</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Current</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Predicted</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Change</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Grade</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Confidence</th>
                </tr>
              </thead>
              <tbody>
                {predictionData.subject_predictions.map((pred: any, index: number) => {
                  const diff = pred.predicted_mark - pred.current_average;
                  return (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium text-gray-800">{pred.subject}</td>
                      <td className="py-3 px-4 text-center text-gray-600">{pred.current_average.toFixed(1)}%</td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-bold text-blue-600">{pred.predicted_mark.toFixed(1)}%</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`font-semibold ${diff > 0 ? 'text-green-600' : diff < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                          {diff > 0 ? '+' : ''}{diff.toFixed(1)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                          pred.predicted_grade === 'A' ? 'bg-green-100 text-green-700' :
                          pred.predicted_grade === 'B' ? 'bg-blue-100 text-blue-700' :
                          pred.predicted_grade === 'C' ? 'bg-yellow-100 text-yellow-700' :
                          pred.predicted_grade === 'S' ? 'bg-orange-100 text-orange-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {pred.predicted_grade}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-12 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${pred.confidence >= 0.7 ? 'bg-green-500' : pred.confidence >= 0.5 ? 'bg-yellow-500' : 'bg-red-500'}`}
                              style={{ width: `${pred.confidence * 100}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold">{(pred.confidence * 100).toFixed(0)}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">No subject data available</div>
        )}
      </div>
    </div>
  );
}
