"use client";

import { useEffect, useState } from "react";

interface SubjectPrediction {
  subjectId: number;
  subjectName: string;
  classId: number;
  className: string;
  grade: number;
  studentCount: number;
  averageMarks: number;
  predictedAverage: number;
  passRate: number;
  atRiskStudents: number;
}

const TeacherPredictionDashboard = () => {
  const [subjectsData, setSubjectsData] = useState<SubjectPrediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTeacherPredictions();
  }, []);

  const fetchTeacherPredictions = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/predictions/teacher");

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch predictions");
      }

      const data = await response.json();
      setSubjectsData(data);
    } catch (err: any) {
      console.error("Error fetching predictions:", err);
      setError(err.message || "Failed to load predictions");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mb-4"></div>
          <h2 className="text-2xl font-bold">Loading Your Subject Predictions...</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-8">
          <h2 className="text-2xl font-bold text-red-800 mb-3">Error</h2>
          <p className="text-red-700">{error}</p>
          <button
            onClick={fetchTeacherPredictions}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (subjectsData.length === 0) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-8">
          <h2 className="text-2xl font-bold text-yellow-800 mb-3">No Data Available</h2>
          <p className="text-yellow-700">
            You don't have any assigned classes or subjects with sufficient data for predictions.
          </p>
        </div>
      </div>
    );
  }

  const totalStudents = subjectsData.reduce((sum, s) => sum + s.studentCount, 0);
  const overallAverage =
    subjectsData.length > 0
      ? subjectsData.reduce((sum, s) => sum + s.predictedAverage, 0) / subjectsData.length
      : 0;
  const totalAtRisk = subjectsData.reduce((sum, s) => sum + s.atRiskStudents, 0);
  const overallPassRate =
    subjectsData.length > 0
      ? subjectsData.reduce((sum, s) => sum + s.passRate, 0) / subjectsData.length
      : 0;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl p-6 shadow-lg text-white">
        <h1 className="text-3xl font-bold mb-2">Subject O/L Prediction Dashboard</h1>
        <p className="text-blue-100">Your Teaching Subjects Performance Analysis</p>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white shadow-lg">
          <div className="text-sm opacity-90 mb-2">Total Students</div>
          <div className="text-3xl font-bold">{totalStudents}</div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-5 text-white shadow-lg">
          <div className="text-sm opacity-90 mb-2">Predicted Average</div>
          <div className="text-3xl font-bold">{overallAverage.toFixed(1)}%</div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-5 text-white shadow-lg">
          <div className="text-sm opacity-90 mb-2">Pass Rate</div>
          <div className="text-3xl font-bold">{overallPassRate.toFixed(0)}%</div>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-5 text-white shadow-lg">
          <div className="text-sm opacity-90 mb-2">At-Risk Students</div>
          <div className="text-3xl font-bold">{totalAtRisk}</div>
        </div>
      </div>

      {/* Subjects Table */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Your Subjects Overview</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100 border-b-2">
              <tr>
                <th className="text-left py-3 px-4">Subject</th>
                <th className="text-left py-3 px-4">Class</th>
                <th className="text-center py-3 px-4">Grade</th>
                <th className="text-center py-3 px-4">Students</th>
                <th className="text-center py-3 px-4">Avg Marks</th>
                <th className="text-center py-3 px-4">Predicted Avg</th>
                <th className="text-center py-3 px-4">Pass Rate</th>
                <th className="text-center py-3 px-4">At Risk</th>
              </tr>
            </thead>
            <tbody>
              {subjectsData.map((subject, index) => (
                <tr key={index} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium">{subject.subjectName}</td>
                  <td className="py-3 px-4">{subject.className}</td>
                  <td className="text-center py-3 px-4">{subject.grade}</td>
                  <td className="text-center py-3 px-4">{subject.studentCount}</td>
                  <td className="text-center py-3 px-4">{subject.averageMarks.toFixed(1)}</td>
                  <td className="text-center py-3 px-4 font-bold">
                    {subject.predictedAverage.toFixed(1)}%
                  </td>
                  <td className="text-center py-3 px-4">
                    <span
                      className={`px-2 py-1 rounded text-xs font-bold ${
                        subject.passRate >= 75
                          ? "bg-green-100 text-green-800"
                          : subject.passRate >= 60
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {subject.passRate.toFixed(0)}%
                    </span>
                  </td>
                  <td className="text-center py-3 px-4">
                    {subject.atRiskStudents > 0 ? (
                      <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-bold">
                        {subject.atRiskStudents}
                      </span>
                    ) : (
                      <span className="text-gray-400">None</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TeacherPredictionDashboard;
