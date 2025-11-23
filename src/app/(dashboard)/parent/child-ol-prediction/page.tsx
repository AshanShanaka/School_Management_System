"use client";

import { useEffect, useState } from "react";

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
  attendance_percentage: number;
  total_subjects: number;
  recommendations: string[];
}

interface Child {
  id: string;
  name: string;
  surname: string;
}

export default function ParentOLPredictionPage() {
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<string | null>(null);
  const [predictionData, setPredictionData] = useState<PredictionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchChildren();
  }, []);

  useEffect(() => {
    if (selectedChild) {
      fetchPrediction(selectedChild);
    }
  }, [selectedChild]);

  const fetchChildren = async () => {
    try {
      const response = await fetch("/api/parent/children");
      const result = await response.json();
      if (response.ok && result.children) {
        setChildren(result.children);
        if (result.children.length > 0) {
          setSelectedChild(result.children[0].id);
        }
      }
    } catch (err) {
      console.error("Error fetching children:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPrediction = async (studentId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('[Parent] Fetching prediction for student:', studentId);
      const response = await fetch(`/api/predictions/parent/${studentId}`);
      
      if (!response.ok) throw new Error(`Failed: ${response.status}`);
      
      const result = await response.json();
      console.log('[Parent] API Response:', result);
      
      // Extract data from API response
      const apiData = result.data || result;
      
      // Transform to match the UI structure
      const transformedData: PredictionData = {
        subject_predictions: apiData.subject_predictions || [],
        overall_average: apiData.overall_average || 0,
        pass_probability: apiData.pass_probability || 0,
        risk_level: apiData.risk_level || 'UNKNOWN',
        attendance_percentage: apiData.attendance_percentage || 0,
        total_subjects: apiData.subject_predictions?.length || 0,
        recommendations: apiData.recommendations || []
      };
      
      console.log('[Parent] Transformed data:', transformedData);
      setPredictionData(transformedData);
    } catch (err) {
      console.error('[Parent] Error:', err);
      setError(err instanceof Error ? err.message : "Error occurred");
    } finally {
      setLoading(false);
    }
  };

  const getGradeColor = (grade: string) => {
    switch (grade?.toUpperCase()) {
      case "A":
        return "bg-green-100 text-green-800 border-green-300";
      case "B":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "C":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "S":
        return "bg-orange-100 text-orange-800 border-orange-300";
      case "W":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getBarColor = (grade: string) => {
    switch (grade?.toUpperCase()) {
      case "A":
        return "from-green-400 to-green-600";
      case "B":
        return "from-blue-400 to-blue-600";
      case "C":
        return "from-yellow-400 to-yellow-600";
      case "S":
        return "from-orange-400 to-orange-600";
      case "W":
        return "from-red-400 to-red-600";
      default:
        return "from-gray-400 to-gray-600";
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk?.toLowerCase()) {
      case "low":
        return "text-green-600";
      case "medium":
        return "text-yellow-600";
      case "high":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mb-4"></div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Loading Child's Performance
          </h2>
          <p className="text-gray-600">Please wait while we fetch the predictions...</p>
        </div>
      </div>
    );
  }

  if (children.length === 0) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="max-w-4xl mx-auto">
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-8 text-center">
            <div className="text-yellow-600 text-5xl mb-4">👨‍👩‍👧‍👦</div>
            <h2 className="text-2xl font-bold text-yellow-800 mb-3">
              No Children Found
            </h2>
            <p className="text-yellow-700">
              No children are linked to your parent account.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const selectedChildData = children.find(c => c.id === selectedChild);
  const childName = selectedChildData ? `${selectedChildData.name} ${selectedChildData.surname}` : "Child";

  const passCount = predictionData?.subject_predictions?.filter(
    (s) => s.predicted_mark >= 35
  ).length || 0;

  const aOrBGrades = predictionData?.subject_predictions?.filter(
    (s) => s.predicted_grade === "A" || s.predicted_grade === "B"
  ).length || 0;

  const above50 = predictionData?.subject_predictions?.filter(
    (s) => s.predicted_mark >= 50
  ).length || 0;

  const needsFocus = predictionData?.subject_predictions?.filter(
    (s) => s.predicted_mark < 35
  ).length || 0;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header with Child Selector */}
      <div className="mb-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 shadow-lg text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Child O/L Prediction Dashboard
            </h1>
            <p className="text-blue-100">Monitor your child's performance and predictions</p>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={selectedChild || ""}
              onChange={(e) => setSelectedChild(e.target.value)}
              className="bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-lg border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50"
            >
              {children.map((child) => (
                <option key={child.id} value={child.id} className="text-gray-900">
                  {child.name} {child.surname}
                </option>
              ))}
            </select>
            <div className="flex items-center space-x-2 bg-white/20 px-4 py-2 rounded-lg backdrop-blur-sm">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">AI Prediction Active</span>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border-2 border-red-200 rounded-xl p-6">
          <div className="flex items-center">
            <span className="text-red-600 text-3xl mr-4">⚠️</span>
            <div>
              <h3 className="text-lg font-bold text-red-800">Error Loading Predictions</h3>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {!predictionData && !loading && (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <div className="text-gray-400 text-6xl mb-4">📊</div>
          <p className="text-gray-600 text-lg">Select a child to view their O/L predictions</p>
        </div>
      )}

      {predictionData && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm opacity-90">Predicted Average</span>
                <span className="text-2xl">📊</span>
              </div>
              <div className="text-3xl font-bold">
                {predictionData.overall_average?.toFixed(1) || "0.0"}%
              </div>
              <div className="text-xs mt-2 opacity-80">Overall Performance</div>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-5 text-white shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm opacity-90">Pass Rate</span>
                <span className="text-2xl">✅</span>
              </div>
              <div className="text-3xl font-bold">
                {((predictionData.pass_probability || 0) * 100).toFixed(0)}%
              </div>
              <div className="text-xs mt-2 opacity-80">Success Probability</div>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-5 text-white shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm opacity-90">Attendance</span>
                <span className="text-2xl">📅</span>
              </div>
              <div className="text-3xl font-bold">
                {predictionData.attendance_percentage?.toFixed(0) || "0"}%
              </div>
              <div className="text-xs mt-2 opacity-80">Overall Attendance</div>
            </div>

            <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl p-5 text-white shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm opacity-90">Passing Subjects</span>
                <span className="text-2xl">🎯</span>
              </div>
              <div className="text-3xl font-bold">
                {passCount}/{predictionData.subject_predictions?.length || 0}
              </div>
              <div className="text-xs mt-2 opacity-80">Above 35%</div>
            </div>

            <div className={`bg-gradient-to-br ${
              predictionData.risk_level?.toLowerCase() === "low"
                ? "from-green-500 to-green-600"
                : predictionData.risk_level?.toLowerCase() === "medium"
                ? "from-yellow-500 to-yellow-600"
                : "from-red-500 to-red-600"
            } rounded-xl p-5 text-white shadow-lg`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm opacity-90">Risk Status</span>
                <span className="text-2xl">
                  {predictionData.risk_level?.toLowerCase() === "low"
                    ? "🟢"
                    : predictionData.risk_level?.toLowerCase() === "medium"
                    ? "🟡"
                    : "🔴"}
                </span>
              </div>
              <div className="text-2xl font-bold uppercase">
                {predictionData.risk_level || "Unknown"}
              </div>
              <div className="text-xs mt-2 opacity-80">Overall Risk Level</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Chart */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                  <span className="text-2xl mr-2">📈</span>
                  {childName}'s Subject Performance Matrix
                </h2>

                <div className="relative" style={{ height: "450px" }}>
                  <div className="absolute left-0 top-0 bottom-12 w-12 flex flex-col justify-between text-xs text-gray-500 pr-2">
                    <span>100%</span>
                    <span>75% (A)</span>
                    <span>65% (B)</span>
                    <span>50% (C)</span>
                    <span>35% (S)</span>
                    <span>0% (W)</span>
                  </div>

                  <div className="absolute left-12 right-0 top-0 bottom-12 border-l-2 border-b-2 border-gray-300">
                    <div className="absolute left-0 right-0 border-t-2 border-dashed border-red-400" style={{ bottom: "35%" }}>
                      <span className="absolute -top-2 right-2 text-xs text-red-600 bg-white px-1">Pass Line (35%)</span>
                    </div>

                    <div className="h-full flex items-end justify-around px-4 pb-2">
                      {predictionData.subject_predictions?.map((subject, index) => {
                        const height = Math.min(subject.predicted_mark, 100);

                        return (
                          <div key={index} className="flex flex-col items-center group relative" style={{ width: "12%" }}>
                            <div className={`mb-1 px-2 py-0.5 rounded text-xs font-bold ${getGradeColor(subject.predicted_grade)}`}>
                              {subject.predicted_grade}
                            </div>

                            <div
                              className={`w-full bg-gradient-to-t ${getBarColor(subject.predicted_grade)} rounded-t-lg transition-all duration-300 group-hover:opacity-80 cursor-pointer relative`}
                              style={{ height: `${height}%` }}
                            >
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-900 text-white text-xs rounded py-2 px-3 whitespace-nowrap z-10 shadow-xl">
                                <div className="font-bold mb-1">{subject.subject}</div>
                                <div>Current: {subject.current_average?.toFixed(1)}%</div>
                                <div>Predicted: {subject.predicted_mark?.toFixed(1)}%</div>
                                <div>Grade: {subject.predicted_grade}</div>
                                <div>Confidence: {(subject.confidence * 100)?.toFixed(0)}%</div>
                                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
                                  <div className="border-4 border-transparent border-t-gray-900"></div>
                                </div>
                              </div>

                              <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-bold text-gray-700 whitespace-nowrap">
                                {subject.predicted_mark?.toFixed(0)}%
                              </div>
                            </div>

                            <div className="mt-1">
                              {subject.trend === "improving" && (
                                <span className="text-green-600 text-xl" title="Improving">↗</span>
                              )}
                              {subject.trend === "declining" && (
                                <span className="text-red-600 text-xl" title="Declining">↘</span>
                              )}
                              {subject.trend === "stable" && (
                                <span className="text-gray-600 text-xl" title="Stable">→</span>
                              )}
                            </div>

                            <div className="text-xs text-gray-600 font-medium text-center mt-1 break-words leading-tight max-w-full">
                              {subject.subject.length > 10
                                ? subject.subject.substring(0, 10) + "..."
                                : subject.subject}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{aOrBGrades}</div>
                    <div className="text-xs text-gray-600">A/B Grades</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{above50}</div>
                    <div className="text-xs text-gray-600">Above 50%</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{needsFocus}</div>
                    <div className="text-xs text-gray-600">Need Focus</div>
                  </div>
                </div>
              </div>

              {/* Detailed Table */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                  <span className="text-2xl mr-2">📋</span>
                  Detailed Subject Analysis
                </h2>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-100 border-b-2 border-gray-200">
                      <tr>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Subject</th>
                        <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Current</th>
                        <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Predicted</th>
                        <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Change</th>
                        <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Grade</th>
                        <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Trend</th>
                        <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Confidence</th>
                        <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Action Needed</th>
                      </tr>
                    </thead>
                    <tbody>
                      {predictionData.subject_predictions?.map((subject, index) => {
                        const change = subject.predicted_mark - subject.current_average;
                        const isImproving = change > 0;
                        const isPassing = subject.predicted_mark >= 35;

                        return (
                          <tr key={index} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-4 font-medium text-gray-800">{subject.subject}</td>
                            <td className="text-center py-3 px-4 text-gray-600">{subject.current_average?.toFixed(1)}%</td>
                            <td className="text-center py-3 px-4 font-bold text-gray-800">{subject.predicted_mark?.toFixed(1)}%</td>
                            <td className={`text-center py-3 px-4 font-semibold ${isImproving ? "text-green-600" : "text-red-600"}`}>
                              {isImproving ? "+" : ""}{change.toFixed(1)}%
                            </td>
                            <td className="text-center py-3 px-4">
                              <span className={`inline-block px-2 py-1 rounded text-xs font-bold border ${getGradeColor(subject.predicted_grade)}`}>
                                {subject.predicted_grade}
                              </span>
                            </td>
                            <td className="text-center py-3 px-4">
                              {subject.trend === "improving" && <span className="text-green-600 font-semibold">↗ Up</span>}
                              {subject.trend === "declining" && <span className="text-red-600 font-semibold">↘ Down</span>}
                              {subject.trend === "stable" && <span className="text-gray-600 font-semibold">→ Stable</span>}
                            </td>
                            <td className="text-center py-3 px-4">
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full ${
                                    subject.confidence > 0.8 ? "bg-green-500" : subject.confidence > 0.6 ? "bg-yellow-500" : "bg-red-500"
                                  }`}
                                  style={{ width: `${(subject.confidence * 100).toFixed(0)}%` }}
                                ></div>
                              </div>
                              <span className="text-xs text-gray-600">{(subject.confidence * 100).toFixed(0)}%</span>
                            </td>
                            <td className="text-center py-3 px-4">
                              {!isPassing ? (
                                <span className="text-red-600 font-bold">⚠️ Critical</span>
                              ) : subject.predicted_mark < 50 ? (
                                <span className="text-yellow-600 font-semibold">⚡ Focus</span>
                              ) : (
                                <span className="text-green-600 font-semibold">✅ Good</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="space-y-6">
              {/* Risk Assessment */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                  <span className="text-xl mr-2">⚡</span>
                  Risk Assessment
                </h3>
                <div className="flex flex-col items-center">
                  <div className="relative w-48 h-24 mb-4">
                    <div className="absolute inset-0 flex items-end justify-center">
                      <div className="w-full h-12 bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 rounded-t-full"></div>
                    </div>
                    <div className="absolute inset-0 flex items-end justify-center">
                      <div
                        className="absolute bottom-0 w-2 h-20 bg-gray-800 origin-bottom transform -translate-x-1/2"
                        style={{
                          left: "50%",
                          transform: `rotate(${(predictionData.pass_probability || 0) * 1.8 - 90}deg)`,
                          transformOrigin: "bottom center",
                        }}
                      ></div>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className={`text-3xl font-bold ${getRiskColor(predictionData.risk_level || "")}`}>
                      {predictionData.risk_level?.toUpperCase() || "UNKNOWN"}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {((predictionData.pass_probability || 0) * 100).toFixed(0)}% Pass Probability
                    </div>
                  </div>
                </div>
              </div>

              {/* Performance Summary */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                  <span className="text-xl mr-2">📊</span>
                  Performance Summary
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">A/B Grades</span>
                    <span className="text-lg font-bold text-green-600">{aOrBGrades}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">Need Focus (&lt;50%)</span>
                    <span className="text-lg font-bold text-yellow-600">{needsFocus}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">Total Subjects</span>
                    <span className="text-lg font-bold text-blue-600">
                      {predictionData.total_subjects || predictionData.subject_predictions?.length || 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* AI Recommendations */}
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl shadow-lg p-6 border-2 border-purple-200">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                  <span className="text-xl mr-2">🤖</span>
                  AI Recommendations
                </h3>
                {predictionData.recommendations && predictionData.recommendations.length > 0 ? (
                  <ul className="space-y-2">
                    {predictionData.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-purple-600 mr-2 mt-1">✓</span>
                        <span className="text-sm text-gray-700">{rec}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-600">
                    Keep up the good work! Continue the current study routine.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Information Footer */}
          <div className="mt-6 bg-blue-50 border-l-4 border-blue-500 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center">
              <span className="text-xl mr-2">ℹ️</span>
              How to Interpret These Predictions
            </h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>
                  <strong>Predicted Marks:</strong> AI-generated predictions based on current performance, attendance, and historical trends
                </span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>
                  <strong>Confidence Level:</strong> Indicates prediction reliability. Higher confidence means more accurate prediction
                </span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>
                  <strong>Pass Line:</strong> 35% is the minimum passing mark for O/L subjects
                </span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>
                  <strong>Grade System:</strong> A (75-100%), B (65-74%), C (50-64%), S (35-49%), W (0-34%)
                </span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>
                  <strong>Trend Indicators:</strong> Shows whether performance is improving (↗), declining (↘), or stable (→)
                </span>
              </li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
