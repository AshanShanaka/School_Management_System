"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface ClassAnalytics {
  classId: number;
  className: string;
  gradeName: string;
  totalStudents: number;
  averageMarks: number;
  attendanceRate: number;
  examResultsCount: number;
  gradeDistribution: { [key: string]: number };
  highRisk: number;
  mediumRisk: number;
  lowRisk: number;
}

interface AnalyticsData {
  overall: {
    totalStudents: number;
    totalClasses: number;
    totalExamResults: number;
    overallAverage: number;
    overallAttendanceRate: number;
    gradeDistribution: { [key: string]: number };
  };
  classes: ClassAnalytics[];
  trends: {
    monthly: Array<{
      month: string;
      average: number;
      examsCount: number;
    }>;
  };
}

const AdminAnalyticsDashboard = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState<ClassAnalytics | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/admin/analytics-overview");
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch analytics");
      }

      setData(result.data);
    } catch (err) {
      console.error("Error fetching analytics:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mb-4"></div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Loading Analytics Dashboard
          </h2>
          <p className="text-gray-600">Please wait while we compile school-wide data...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-8 text-center">
            <div className="text-red-600 text-5xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-red-800 mb-3">
              Unable to Load Analytics
            </h2>
            <p className="text-red-700 mb-6">{error || "No data available"}</p>
            <button
              onClick={fetchAnalytics}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { overall, classes, trends } = data;

  // Prepare grade distribution data for pie chart
  const gradeChartData = Object.entries(overall.gradeDistribution)
    .filter(([grade, count]) => count > 0 && grade !== "AB")
    .map(([grade, count]) => ({
      name: grade,
      value: count,
    }));

  const GRADE_COLORS: { [key: string]: string } = {
    A: "#10b981",
    B: "#3b82f6",
    C: "#f59e0b",
    S: "#f97316",
    W: "#ef4444",
  };

  // Risk distribution data
  const totalHighRisk = classes.reduce((sum, c) => sum + c.highRisk, 0);
  const totalMediumRisk = classes.reduce((sum, c) => sum + c.mediumRisk, 0);
  const totalLowRisk = classes.reduce((sum, c) => sum + c.lowRisk, 0);

  const riskData = [
    { name: "High Risk", value: totalHighRisk, color: "#ef4444" },
    { name: "Medium Risk", value: totalMediumRisk, color: "#f59e0b" },
    { name: "Low Risk", value: totalLowRisk, color: "#10b981" },
  ];

  // Class comparison data for bar chart
  const classComparisonData = classes.map((c) => ({
    name: c.className,
    average: c.averageMarks,
    attendance: c.attendanceRate,
    students: c.totalStudents,
  }));

  return (
    <div className="p-6 bg-gradient-to-br from-indigo-50/50 via-purple-50/50 to-pink-50/50 min-h-screen">
      {/* Header */}
      <div className="mb-6 bg-white/40 backdrop-blur-xl rounded-3xl p-6 shadow-lg border-2 border-white/50">
        <div className="bg-gradient-to-r from-indigo-100/30 via-purple-100/20 to-pink-100/30 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-600 bg-clip-text text-transparent mb-2">
                School Analytics & Performance Dashboard
              </h1>
              <p className="text-gray-700">
                Comprehensive overview of academic performance across all classes
              </p>
            </div>
            <div className="flex items-center space-x-2 bg-white/60 px-4 py-2 rounded-xl backdrop-blur-sm shadow-md">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-gray-700">Live Data</span>
            </div>
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white/50 backdrop-blur-xl rounded-2xl p-5 shadow-lg border-2 border-indigo-200/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Total Students</span>
            <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center shadow-md">
              <span className="text-xl">👥</span>
            </div>
          </div>
          <div className="text-3xl font-bold text-indigo-700">{overall.totalStudents}</div>
          <div className="text-xs text-gray-600 mt-1">Across {overall.totalClasses} classes</div>
        </div>

        <div className="bg-white/50 backdrop-blur-xl rounded-2xl p-5 shadow-lg border-2 border-purple-200/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Overall Average</span>
            <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center shadow-md">
              <span className="text-xl">📊</span>
            </div>
          </div>
          <div className="text-3xl font-bold text-purple-700">
            {overall.overallAverage.toFixed(1)}%
          </div>
          <div className="text-xs text-gray-600 mt-1">School-wide performance</div>
        </div>

        <div className="bg-white/50 backdrop-blur-xl rounded-2xl p-5 shadow-lg border-2 border-green-200/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Attendance Rate</span>
            <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center shadow-md">
              <span className="text-xl">📅</span>
            </div>
          </div>
          <div className="text-3xl font-bold text-green-700">
            {overall.overallAttendanceRate.toFixed(1)}%
          </div>
          <div className="text-xs text-gray-600 mt-1">Average attendance</div>
        </div>

        <div className="bg-white/50 backdrop-blur-xl rounded-2xl p-5 shadow-lg border-2 border-blue-200/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Total Classes</span>
            <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center shadow-md">
              <span className="text-xl">🏫</span>
            </div>
          </div>
          <div className="text-3xl font-bold text-blue-700">{overall.totalClasses}</div>
          <div className="text-xs text-gray-600 mt-1">Active classes</div>
        </div>

        <div className="bg-white/50 backdrop-blur-xl rounded-2xl p-5 shadow-lg border-2 border-pink-200/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Exam Results</span>
            <div className="w-10 h-10 bg-pink-500 rounded-xl flex items-center justify-center shadow-md">
              <span className="text-xl">📝</span>
            </div>
          </div>
          <div className="text-3xl font-bold text-pink-700">{overall.totalExamResults}</div>
          <div className="text-xs text-gray-600 mt-1">Total submissions</div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Grade Distribution Pie Chart */}
        <div className="bg-white/50 backdrop-blur-xl rounded-2xl p-6 shadow-lg border-2 border-purple-200/50">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
            <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center mr-2 shadow-md">
              <span className="text-lg">📈</span>
            </div>
            Grade Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={gradeChartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {gradeChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={GRADE_COLORS[entry.name]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Risk Distribution Pie Chart */}
        <div className="bg-white/50 backdrop-blur-xl rounded-2xl p-6 shadow-lg border-2 border-orange-200/50">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center mr-2 shadow-md">
              <span className="text-lg">⚠️</span>
            </div>
            Student Risk Levels
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={riskData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {riskData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-3 gap-2 mt-4">
            <div className="bg-red-50 rounded-lg p-2 text-center">
              <div className="text-lg font-bold text-red-600">{totalHighRisk}</div>
              <div className="text-xs text-red-700">High Risk</div>
            </div>
            <div className="bg-yellow-50 rounded-lg p-2 text-center">
              <div className="text-lg font-bold text-yellow-600">{totalMediumRisk}</div>
              <div className="text-xs text-yellow-700">Medium</div>
            </div>
            <div className="bg-green-50 rounded-lg p-2 text-center">
              <div className="text-lg font-bold text-green-600">{totalLowRisk}</div>
              <div className="text-xs text-green-700">Low Risk</div>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Trend Line Chart */}
      {trends.monthly.length > 0 && (
        <div className="bg-white/50 backdrop-blur-xl rounded-2xl p-6 shadow-lg border-2 border-blue-200/50 mb-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center mr-2 shadow-md">
              <span className="text-lg">📉</span>
            </div>
            6-Month Performance Trend
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={trends.monthly}>
              <defs>
                <linearGradient id="colorAverage" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#6b7280" style={{ fontSize: "12px" }} />
              <YAxis stroke="#6b7280" style={{ fontSize: "12px" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(255, 255, 255, 0.95)",
                  border: "2px solid #e5e7eb",
                  borderRadius: "12px",
                }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="average"
                stroke="#8b5cf6"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorAverage)"
                name="Average %"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Class Comparison Bar Chart */}
      <div className="bg-white/50 backdrop-blur-xl rounded-2xl p-6 shadow-lg border-2 border-indigo-200/50 mb-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center mr-2 shadow-md">
            <span className="text-lg">📊</span>
          </div>
          Class-wise Performance Comparison
        </h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={classComparisonData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="name" stroke="#6b7280" style={{ fontSize: "12px" }} />
            <YAxis stroke="#6b7280" style={{ fontSize: "12px" }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                border: "2px solid #e5e7eb",
                borderRadius: "12px",
              }}
            />
            <Legend />
            <Bar dataKey="average" fill="#8b5cf6" name="Average Marks %" radius={[8, 8, 0, 0]} />
            <Bar dataKey="attendance" fill="#10b981" name="Attendance %" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Class Details Table */}
      <div className="bg-white/50 backdrop-blur-xl rounded-2xl p-6 shadow-lg border-2 border-pink-200/50">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
          <div className="w-8 h-8 bg-pink-500 rounded-lg flex items-center justify-center mr-2 shadow-md">
            <span className="text-lg">📋</span>
          </div>
          Class-wise Detailed Analytics
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-indigo-100/50 to-purple-100/50 border-b-2 border-indigo-200">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Class</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Grade</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">
                  Students
                </th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">
                  Avg Marks
                </th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">
                  Attendance
                </th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">
                  High Risk
                </th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">
                  Medium Risk
                </th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">
                  Low Risk
                </th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {classes.map((classData, index) => {
                const performanceColor =
                  classData.averageMarks >= 75
                    ? "text-green-600"
                    : classData.averageMarks >= 50
                    ? "text-blue-600"
                    : classData.averageMarks >= 35
                    ? "text-yellow-600"
                    : "text-red-600";

                const attendanceColor =
                  classData.attendanceRate >= 90
                    ? "text-green-600"
                    : classData.attendanceRate >= 75
                    ? "text-blue-600"
                    : classData.attendanceRate >= 60
                    ? "text-yellow-600"
                    : "text-red-600";

                return (
                  <tr
                    key={classData.classId}
                    className={`border-b hover:bg-indigo-50/50 transition-colors ${
                      index % 2 === 0 ? "bg-white/20" : "bg-white/40"
                    }`}
                  >
                    <td className="py-3 px-4 font-semibold text-gray-800">
                      {classData.className}
                    </td>
                    <td className="py-3 px-4 text-gray-700">{classData.gradeName}</td>
                    <td className="text-center py-3 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700">
                        {classData.totalStudents}
                      </span>
                    </td>
                    <td className="text-center py-3 px-4">
                      <span className={`font-bold ${performanceColor}`}>
                        {classData.averageMarks.toFixed(1)}%
                      </span>
                    </td>
                    <td className="text-center py-3 px-4">
                      <span className={`font-bold ${attendanceColor}`}>
                        {classData.attendanceRate.toFixed(1)}%
                      </span>
                    </td>
                    <td className="text-center py-3 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">
                        {classData.highRisk}
                      </span>
                    </td>
                    <td className="text-center py-3 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700">
                        {classData.mediumRisk}
                      </span>
                    </td>
                    <td className="text-center py-3 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700">
                        {classData.lowRisk}
                      </span>
                    </td>
                    <td className="text-center py-3 px-4">
                      <button
                        onClick={() => setSelectedClass(classData)}
                        className="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs font-medium rounded-lg hover:from-indigo-600 hover:to-purple-600 transition-all shadow-md"
                      >
                        <span className="mr-1">👁️</span>
                        View Details
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Class Detail Modal */}
      {selectedClass && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 p-6 rounded-t-2xl">
              <div className="flex items-center justify-between text-white">
                <div>
                  <h2 className="text-2xl font-bold">{selectedClass.className} Analytics</h2>
                  <p className="text-indigo-100">{selectedClass.gradeName}</p>
                </div>
                <button
                  onClick={() => setSelectedClass(null)}
                  className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-xl transition-colors flex items-center justify-center"
                >
                  <span className="text-2xl">×</span>
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-indigo-50 rounded-xl p-4">
                  <div className="text-sm text-gray-600 mb-1">Total Students</div>
                  <div className="text-2xl font-bold text-indigo-600">
                    {selectedClass.totalStudents}
                  </div>
                </div>
                <div className="bg-purple-50 rounded-xl p-4">
                  <div className="text-sm text-gray-600 mb-1">Avg Marks</div>
                  <div className="text-2xl font-bold text-purple-600">
                    {selectedClass.averageMarks.toFixed(1)}%
                  </div>
                </div>
                <div className="bg-green-50 rounded-xl p-4">
                  <div className="text-sm text-gray-600 mb-1">Attendance</div>
                  <div className="text-2xl font-bold text-green-600">
                    {selectedClass.attendanceRate.toFixed(1)}%
                  </div>
                </div>
                <div className="bg-blue-50 rounded-xl p-4">
                  <div className="text-sm text-gray-600 mb-1">Exam Results</div>
                  <div className="text-2xl font-bold text-blue-600">
                    {selectedClass.examResultsCount}
                  </div>
                </div>
              </div>

              {/* Grade Distribution */}
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <h3 className="font-bold text-gray-800 mb-3">Grade Distribution</h3>
                <div className="grid grid-cols-5 gap-2">
                  {Object.entries(selectedClass.gradeDistribution).map(([grade, count]) => {
                    if (grade === "AB") return null;
                    return (
                      <div
                        key={grade}
                        className="text-center p-3 rounded-lg"
                        style={{
                          backgroundColor: GRADE_COLORS[grade] + "20",
                          borderLeft: `4px solid ${GRADE_COLORS[grade]}`,
                        }}
                      >
                        <div className="text-lg font-bold" style={{ color: GRADE_COLORS[grade] }}>
                          {count}
                        </div>
                        <div className="text-sm text-gray-600">Grade {grade}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Risk Breakdown */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 text-center">
                  <div className="text-3xl mb-2">🔴</div>
                  <div className="text-2xl font-bold text-red-600">{selectedClass.highRisk}</div>
                  <div className="text-sm text-red-700">High Risk</div>
                  <div className="text-xs text-gray-600 mt-1">&lt; 35%</div>
                </div>
                <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4 text-center">
                  <div className="text-3xl mb-2">🟡</div>
                  <div className="text-2xl font-bold text-yellow-600">
                    {selectedClass.mediumRisk}
                  </div>
                  <div className="text-sm text-yellow-700">Medium Risk</div>
                  <div className="text-xs text-gray-600 mt-1">35-50%</div>
                </div>
                <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 text-center">
                  <div className="text-3xl mb-2">🟢</div>
                  <div className="text-2xl font-bold text-green-600">{selectedClass.lowRisk}</div>
                  <div className="text-sm text-green-700">Low Risk</div>
                  <div className="text-xs text-gray-600 mt-1">&gt; 50%</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAnalyticsDashboard;
