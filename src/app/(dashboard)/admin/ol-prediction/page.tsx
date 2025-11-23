"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface ClassData {
  classId: number;
  className: string;
  grade: number;
  studentCount: number;
  averagePrediction: number;
  passRate: number;
  riskLevel: string;
}

const AdminPredictionDashboard = () => {
  const [classesData, setClassesData] = useState<ClassData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAllClassPredictions();
  }, []);

  const fetchAllClassPredictions = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/predictions/admin");

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch predictions");
      }

      const data = await response.json();
      setClassesData(data);
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
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mb-4"></div>
          <h2 className="text-2xl font-bold">Loading System Predictions...</h2>
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
            onClick={fetchAllClassPredictions}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const totalStudents = classesData.reduce((sum, c) => sum + c.studentCount, 0);
  const overallAverage =
    classesData.length > 0
      ? classesData.reduce((sum, c) => sum + c.averagePrediction, 0) / classesData.length
      : 0;
  const overallPassRate =
    classesData.length > 0
      ? classesData.reduce((sum, c) => sum + c.passRate, 0) / classesData.length
      : 0;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-6 shadow-lg text-white">
        <h1 className="text-3xl font-bold mb-2">System-Wide O/L Prediction Dashboard</h1>
        <p className="text-purple-100">Administrative Overview of All Classes</p>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white shadow-lg">
          <div className="text-sm opacity-90 mb-2">Total Students</div>
          <div className="text-3xl font-bold">{totalStudents}</div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-5 text-white shadow-lg">
          <div className="text-sm opacity-90 mb-2">Overall Average</div>
          <div className="text-3xl font-bold">{overallAverage.toFixed(1)}%</div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-5 text-white shadow-lg">
          <div className="text-sm opacity-90 mb-2">Overall Pass Rate</div>
          <div className="text-3xl font-bold">{overallPassRate.toFixed(0)}%</div>
        </div>
      </div>

      {/* Classes Table */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Classes Overview</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100 border-b-2">
              <tr>
                <th className="text-left py-3 px-4">Class</th>
                <th className="text-center py-3 px-4">Grade</th>
                <th className="text-center py-3 px-4">Students</th>
                <th className="text-center py-3 px-4">Avg Prediction</th>
                <th className="text-center py-3 px-4">Pass Rate</th>
                <th className="text-center py-3 px-4">Risk Level</th>
                <th className="text-center py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {classesData.map((classData) => (
                <tr key={classData.classId} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium">{classData.className}</td>
                  <td className="text-center py-3 px-4">{classData.grade}</td>
                  <td className="text-center py-3 px-4">{classData.studentCount}</td>
                  <td className="text-center py-3 px-4 font-bold">
                    {classData.averagePrediction.toFixed(1)}%
                  </td>
                  <td className="text-center py-3 px-4">{classData.passRate.toFixed(0)}%</td>
                  <td className="text-center py-3 px-4">
                    <span
                      className={`px-2 py-1 rounded text-xs font-bold ${
                        classData.riskLevel === "LOW"
                          ? "bg-green-100 text-green-800"
                          : classData.riskLevel === "MEDIUM"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {classData.riskLevel}
                    </span>
                  </td>
                  <td className="text-center py-3 px-4">
                    <Link
                      href={`/admin/ol-analytics/${classData.classId}`}
                      className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                    >
                      View Details
                    </Link>
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

export default AdminPredictionDashboard;
