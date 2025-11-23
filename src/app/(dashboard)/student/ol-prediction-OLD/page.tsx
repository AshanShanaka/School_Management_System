/**
 * Parent O/L Prediction Page
 * Shows AI-powered O/L performance predictions for parent's children
 */

'use client';

import { useEffect, useState } from 'react';

interface Child {
  id: string;
  name: string;
  surname: string;
  grade: { name: string } | null;
  class: { name: string } | null;
}

interface SubjectPrediction {
  subject: string;
  current_average: number;
  predicted_mark: number;
  predicted_grade: string;
  confidence: number;
  trend: string;
}

interface PredictionData {
  subject_predictions: SubjectPrediction[];
  overall_average: number;
  pass_probability: number;
  risk_level: string;
  risk_status: string;
  attendance_percentage: number;
  recommendations: string[];
}

export default function ParentOLPredictionPage() {
  const [loading, setLoading] = useState(true);
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [predictionData, setPredictionData] = useState<PredictionData | null>(null);
  const [predictionLoading, setPredictionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [predictionError, setPredictionError] = useState<string | null>(null);

  useEffect(() => {
    fetchChildren();
  }, []);

  useEffect(() => {
    if (selectedChildId) {
      fetchPrediction(selectedChildId);
    }
  }, [selectedChildId]);

  const fetchChildren = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/parent/children');
      const data = await response.json();

      console.log('[Parent Page] Children response:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch children');
      }

      if (data.children && data.children.length > 0) {
        setChildren(data.children);
        setSelectedChildId(data.children[0].id); // Auto-select first child
      } else {
        setError('No children found linked to your parent account. Please contact school administration.');
      }
    } catch (err) {
      console.error('[Parent Page] Error fetching children:', err);
      setError(err instanceof Error ? err.message : 'Failed to load children');
    } finally {
      setLoading(false);
    }
  };

  const fetchPrediction = async (childId: string) => {
    try {
      setPredictionLoading(true);
      setPredictionError(null);
      setPredictionData(null);

      console.log('[Parent Page] Fetching prediction for child:', childId);
      const response = await fetch(`/api/predictions/parent/${childId}`);
      const data = await response.json();

      console.log('[Parent Page] Prediction response:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch prediction');
      }

      if (!data.data || !data.data.subject_predictions) {
        throw new Error('No prediction data available for this child');
      }

      setPredictionData(data.data);
    } catch (err) {
      console.error('[Parent Page] Error fetching prediction:', err);
      setPredictionError(err instanceof Error ? err.message : 'Failed to load prediction');
    } finally {
      setPredictionLoading(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your children's data...</p>
        </div>
      </div>
    );
  }

  // No children error
  if (error || children.length === 0) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-2xl mx-auto">
          <div className="text-center">
            <span className="text-5xl">👨‍👩‍👧‍👦</span>
            <h2 className="text-xl font-bold text-yellow-800 mt-4 mb-2">No Children Found</h2>
            <p className="text-yellow-700">
              {error || 'No children are linked to your parent account. Please contact the school administrator.'}
            </p>
            <button
              onClick={fetchChildren}
              className="mt-4 px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const selectedChild = children.find(c => c.id === selectedChildId);

  const getGradeColor = (grade: string) => {
    switch (grade?.toUpperCase()) {
      case 'A': return 'bg-green-100 text-green-800 border-green-300';
      case 'B': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'C': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'S': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'W': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getBarColor = (grade: string) => {
    switch (grade?.toUpperCase()) {
      case 'A': return 'from-green-400 to-green-600';
      case 'B': return 'from-blue-400 to-blue-600';
      case 'C': return 'from-yellow-400 to-yellow-600';
      case 'S': return 'from-orange-400 to-orange-600';
      case 'W': return 'from-red-400 to-red-600';
      default: return 'from-gray-400 to-gray-600';
    }
  };

  const passCount = predictionData?.subject_predictions?.filter(s => s.predicted_mark >= 35).length || 0;
  const aOrBGrades = predictionData?.subject_predictions?.filter(s => ['A', 'B'].includes(s.predicted_grade)).length || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Child Selector Bar */}
      <div className="bg-white border-b border-gray-200 p-4 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
            Select Child:
          </label>
          <select
            value={selectedChildId || ''}
            onChange={(e) => setSelectedChildId(e.target.value)}
            className="flex-1 max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
          >
            {children.map((child) => (
              <option key={child.id} value={child.id}>
                {child.name} {child.surname} - {child.grade?.name || 'Grade Unknown'} {child.class?.name || ''}
              </option>
            ))}
          </select>
          <span className="text-sm text-gray-500">
            {children.length} {children.length === 1 ? 'child' : 'children'}
          </span>
        </div>
      </div>

      {/* Prediction Loading */}
      {predictionLoading && (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading {selectedChild?.name}'s predictions...</p>
          </div>
        </div>
      )}

      {/* Prediction Error */}
      {!predictionLoading && predictionError && (
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-2xl mx-auto">
            <div className="text-center">
              <span className="text-5xl">⚠️</span>
              <h2 className="text-xl font-bold text-red-800 mt-4 mb-2">Unable to Load Predictions</h2>
              <p className="text-red-700">{predictionError}</p>
              <button
                onClick={() => selectedChildId && fetchPrediction(selectedChildId)}
                className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Prediction Dashboard */}
      {!predictionLoading && !predictionError && predictionData && selectedChild && (
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 shadow-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">
                  {selectedChild.name} {selectedChild.surname}'s O/L Predictions
                </h1>
                <p className="text-blue-100">
                  {selectedChild.grade?.name || 'Grade Unknown'} - {selectedChild.class?.name || 'Class Unknown'}
                </p>
              </div>
              <div className="flex items-center space-x-2 bg-white/20 px-4 py-2 rounded-lg backdrop-blur-sm">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">AI Prediction Active</span>
              </div>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white shadow-lg">
              <div className="text-sm opacity-90 mb-2">Predicted Average</div>
              <div className="text-3xl font-bold">{predictionData.overall_average?.toFixed(1)}%</div>
              <div className="text-xs mt-2 opacity-80">Overall Performance</div>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-5 text-white shadow-lg">
              <div className="text-sm opacity-90 mb-2">Pass Rate</div>
              <div className="text-3xl font-bold">{((predictionData.pass_probability || 0) * 100).toFixed(0)}%</div>
              <div className="text-xs mt-2 opacity-80">Success Probability</div>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-5 text-white shadow-lg">
              <div className="text-sm opacity-90 mb-2">Attendance</div>
              <div className="text-3xl font-bold">{predictionData.attendance_percentage?.toFixed(0)}%</div>
              <div className="text-xs mt-2 opacity-80">Overall Attendance</div>
            </div>

            <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl p-5 text-white shadow-lg">
              <div className="text-sm opacity-90 mb-2">Passing Subjects</div>
              <div className="text-3xl font-bold">{passCount}/{predictionData.subject_predictions?.length || 0}</div>
              <div className="text-xs mt-2 opacity-80">Above 35%</div>
            </div>

            <div className={`bg-gradient-to-br rounded-xl p-5 text-white shadow-lg ${
              predictionData.risk_level?.toLowerCase() === 'low' ? 'from-green-500 to-green-600' :
              predictionData.risk_level?.toLowerCase() === 'medium' ? 'from-yellow-500 to-yellow-600' :
              'from-red-500 to-red-600'
            }`}>
              <div className="text-sm opacity-90 mb-2">Risk Status</div>
              <div className="text-2xl font-bold uppercase">{predictionData.risk_level || 'UNKNOWN'}</div>
              <div className="text-xs mt-2 opacity-80">Overall Risk Level</div>
            </div>
          </div>

          {/* Performance Chart */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">📈 Subject Performance Matrix</h2>
            
            <div className="relative" style={{ height: '400px' }}>
              {/* Y-axis */}
              <div className="absolute left-0 top-0 bottom-8 w-12 flex flex-col justify-between text-xs text-gray-500 pr-2">
                <span>100%</span>
                <span>75%</span>
                <span>50%</span>
                <span>35%</span>
                <span>0%</span>
              </div>

              {/* Pass Line */}
              <div className="absolute left-12 right-0 bottom-8" style={{ bottom: 'calc(2rem + 35%)' }}>
                <div className="border-t-2 border-dashed border-red-300">
                  <span className="text-xs text-red-600 bg-white px-2">Pass Line (35%)</span>
                </div>
              </div>

              {/* Bars */}
              <div className="absolute left-12 right-0 top-0 bottom-8 flex items-end justify-around px-2">
                {predictionData.subject_predictions?.map((subject, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center px-1 group relative">
                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-2 hidden group-hover:block z-10 bg-gray-900 text-white text-xs rounded px-3 py-2 whitespace-nowrap shadow-lg">
                      <div className="font-semibold">{subject.subject}</div>
                      <div>Current: {subject.current_average?.toFixed(1)}%</div>
                      <div>Predicted: {subject.predicted_mark?.toFixed(1)}%</div>
                      <div>Grade: {subject.predicted_grade}</div>
                      <div>Confidence: {(subject.confidence * 100)?.toFixed(0)}%</div>
                    </div>

                    {/* Grade Badge */}
                    <div className={`mb-1 px-2 py-0.5 rounded text-xs font-bold ${getGradeColor(subject.predicted_grade)}`}>
                      {subject.predicted_grade}
                    </div>

                    {/* Bar */}
                    <div
                      className={`w-full bg-gradient-to-t ${getBarColor(subject.predicted_grade)} rounded-t-lg shadow-md`}
                      style={{ height: `${Math.min(subject.predicted_mark, 100)}%`, minHeight: '20px' }}
                    >
                      <div className="text-xs font-bold text-white text-center mt-1">
                        {subject.predicted_mark?.toFixed(0)}%
                      </div>
                    </div>

                    {/* Subject Name */}
                    <div className="text-xs text-gray-600 text-center mt-2 max-w-full truncate">
                      {subject.subject}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Subject Table */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">📋 Detailed Subject Analysis</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Subject</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Current</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Predicted</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Change</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Grade</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {predictionData.subject_predictions?.map((subject, index) => {
                    const change = subject.predicted_mark - subject.current_average;
                    return (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">{subject.subject}</td>
                        <td className="text-center py-3 px-4 text-gray-600">{subject.current_average?.toFixed(1)}%</td>
                        <td className="text-center py-3 px-4 font-bold text-blue-600">{subject.predicted_mark?.toFixed(1)}%</td>
                        <td className={`text-center py-3 px-4 font-semibold ${change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {change > 0 ? '+' : ''}{change.toFixed(1)}%
                        </td>
                        <td className="text-center py-3 px-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${getGradeColor(subject.predicted_grade)}`}>
                            {subject.predicted_grade}
                          </span>
                        </td>
                        <td className="text-center py-3 px-4">
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-12 h-2 bg-gray-200 rounded-full">
                              <div
                                className={`h-full rounded-full ${subject.confidence >= 0.7 ? 'bg-green-500' : subject.confidence >= 0.5 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                style={{ width: `${subject.confidence * 100}%` }}
                              />
                            </div>
                            <span className="text-xs">{(subject.confidence * 100).toFixed(0)}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* AI Recommendations */}
          {predictionData.recommendations && predictionData.recommendations.length > 0 && (
            <div className="bg-purple-50 border-l-4 border-purple-500 rounded-lg p-6">
              <h3 className="text-lg font-bold text-purple-900 mb-3">🤖 AI Recommendations</h3>
              <ul className="space-y-2">
                {predictionData.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start text-sm text-purple-800">
                    <span className="mr-2">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
