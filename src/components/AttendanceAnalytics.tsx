"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
  Area,
  AreaChart,
} from "recharts";

interface AttendanceAnalyticsProps {
  studentId?: string;
  classId?: string;
  userRole: string;
  timeRange?: "week" | "month" | "term";
}

interface AttendanceData {
  date: string;
  present: number;
  absent: number;
  late: number;
  percentage: number;
  dayName: string;
}

interface ClassData {
  className: string;
  presentRate: number;
  absentRate: number;
  lateRate: number;
}

const AttendanceAnalytics = ({
  studentId,
  classId,
  userRole,
  timeRange = "month",
}: AttendanceAnalyticsProps) => {
  const [attendanceData, setAttendanceData] = useState<AttendanceData[]>([]);
  const [classData, setClassData] = useState<ClassData[]>([]);
  const [summaryData, setSummaryData] = useState({
    totalDays: 0,
    presentDays: 0,
    absentDays: 0,
    lateDays: 0,
    attendanceRate: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState(timeRange);

  useEffect(() => {
    fetchAttendanceData();
  }, [studentId, classId, selectedTimeRange]);

  const fetchAttendanceData = async () => {
    setLoading(true);
    try {
      let url = `/api/attendance/charts?timeRange=${selectedTimeRange}`;

      if (studentId) {
        url += `&studentId=${studentId}`;
      }
      if (classId) {
        url += `&classId=${classId}`;
      }

      const response = await fetch(url);
      if (!response.ok) {
        // Fallback to mock data if API fails
        generateMockData();
        return;
      }

      const data = await response.json();

      setAttendanceData(data.dailyData || []);
      setClassData(data.classData || []);
      setSummaryData(
        data.summary || {
          totalDays: 0,
          presentDays: 0,
          absentDays: 0,
          lateDays: 0,
          attendanceRate: 0,
        }
      );
    } catch (error) {
      console.error("Error fetching attendance data:", error);
      generateMockData();
    } finally {
      setLoading(false);
    }
  };

  const generateMockData = () => {
    // Generate mock data based on timeRange
    const days =
      selectedTimeRange === "week"
        ? 7
        : selectedTimeRange === "month"
        ? 30
        : 120;
    const mockData: AttendanceData[] = [];

    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      // Skip weekends for school attendance
      if (date.getDay() === 0 || date.getDay() === 6) continue;

      const isPresent = Math.random() > 0.15; // 85% attendance rate
      const isLate = isPresent && Math.random() > 0.9; // 10% late rate

      mockData.push({
        date: date.toLocaleDateString(),
        dayName: date.toLocaleDateString("en-US", { weekday: "short" }),
        present: isPresent && !isLate ? 1 : 0,
        absent: !isPresent ? 1 : 0,
        late: isLate ? 1 : 0,
        percentage: isPresent ? 100 : 0,
      });
    }

    setAttendanceData(mockData);

    const presentDays = mockData.filter(
      (d) => d.present === 1 || d.late === 1
    ).length;
    const absentDays = mockData.filter((d) => d.absent === 1).length;
    const lateDays = mockData.filter((d) => d.late === 1).length;

    setSummaryData({
      totalDays: mockData.length,
      presentDays,
      absentDays,
      lateDays,
      attendanceRate:
        mockData.length > 0 ? (presentDays / mockData.length) * 100 : 0,
    });

    // Mock class data for admin/teacher view
    if (userRole === "admin" || userRole === "teacher") {
      setClassData([
        { className: "Grade 1-A", presentRate: 92, absentRate: 6, lateRate: 2 },
        { className: "Grade 1-B", presentRate: 88, absentRate: 8, lateRate: 4 },
        { className: "Grade 2-A", presentRate: 94, absentRate: 4, lateRate: 2 },
        { className: "Grade 2-B", presentRate: 90, absentRate: 7, lateRate: 3 },
      ]);
    }
  };

  const pieData = [
    { name: "Present", value: summaryData.presentDays, color: "#22c55e" },
    { name: "Absent", value: summaryData.absentDays, color: "#ef4444" },
    { name: "Late", value: summaryData.lateDays, color: "#f59e0b" },
  ].filter((item) => item.value > 0);

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-md">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Time Range Selector */}
      <div className="bg-white p-6 rounded-md">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Attendance Analytics</h2>
          <div className="flex gap-2">
            {["week", "month", "term"].map((range) => (
              <button
                key={range}
                onClick={() => setSelectedTimeRange(range as any)}
                className={`px-3 py-1 rounded text-sm font-medium ${
                  selectedTimeRange === range
                    ? "bg-lamaSky text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {range.charAt(0).toUpperCase() + range.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg text-center">
            <h3 className="text-2xl font-bold text-blue-600">
              {summaryData.totalDays}
            </h3>
            <p className="text-sm text-gray-600">Total Days</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg text-center">
            <h3 className="text-2xl font-bold text-green-600">
              {summaryData.presentDays}
            </h3>
            <p className="text-sm text-gray-600">Present</p>
          </div>
          <div className="bg-red-50 p-4 rounded-lg text-center">
            <h3 className="text-2xl font-bold text-red-600">
              {summaryData.absentDays}
            </h3>
            <p className="text-sm text-gray-600">Absent</p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg text-center">
            <h3 className="text-2xl font-bold text-yellow-600">
              {summaryData.lateDays}
            </h3>
            <p className="text-sm text-gray-600">Late</p>
          </div>
        </div>

        {/* Overall Attendance Rate */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">Overall Attendance Rate</h3>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                summaryData.attendanceRate >= 95
                  ? "text-green-600 bg-green-100"
                  : summaryData.attendanceRate >= 85
                  ? "text-yellow-600 bg-yellow-100"
                  : "text-red-600 bg-red-100"
              }`}
            >
              {summaryData.attendanceRate.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-green-400 to-green-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(summaryData.attendanceRate, 100)}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Attendance Trend */}
        <div className="bg-white p-6 rounded-md">
          <h3 className="text-lg font-semibold mb-4">Daily Attendance Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={attendanceData}>
              <defs>
                <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="dayName" tick={{ fontSize: 12 }} tickMargin={5} />
              <YAxis domain={[0, 100]} />
              <Tooltip
                labelFormatter={(label) => `Day: ${label}`}
                formatter={(value, name) => [`${value}%`, "Attendance Rate"]}
              />
              <Area
                type="monotone"
                dataKey="percentage"
                stroke="#22c55e"
                fillOpacity={1}
                fill="url(#colorPresent)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Attendance Distribution Pie Chart */}
        <div className="bg-white p-6 rounded-md">
          <h3 className="text-lg font-semibold mb-4">
            Attendance Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value, percent }) =>
                  `${name}: ${value} (${(percent * 100).toFixed(0)}%)`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Weekly Attendance Bar Chart */}
        <div className="bg-white p-6 rounded-md">
          <h3 className="text-lg font-semibold mb-4">
            Recent Attendance Pattern
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={attendanceData.slice(-10)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="dayName" tick={{ fontSize: 12 }} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar
                dataKey="present"
                stackId="a"
                fill="#22c55e"
                name="Present"
              />
              <Bar dataKey="late" stackId="a" fill="#f59e0b" name="Late" />
              <Bar dataKey="absent" stackId="a" fill="#ef4444" name="Absent" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Class Comparison (for admin/teacher) */}
        {(userRole === "admin" || userRole === "teacher") &&
          classData.length > 0 && (
            <div className="bg-white p-6 rounded-md">
              <h3 className="text-lg font-semibold mb-4">
                Class Attendance Comparison
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={classData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="className" tick={{ fontSize: 10 }} />
                  <YAxis />
                  <Tooltip formatter={(value) => `${value}%`} />
                  <Legend />
                  <Bar dataKey="presentRate" fill="#22c55e" name="Present %" />
                  <Bar dataKey="lateRate" fill="#f59e0b" name="Late %" />
                  <Bar dataKey="absentRate" fill="#ef4444" name="Absent %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
      </div>

      {/* Attendance Insights */}
      <div className="bg-white p-6 rounded-md">
        <h3 className="text-lg font-semibold mb-4">Attendance Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div
            className={`p-4 rounded-lg ${
              summaryData.attendanceRate >= 95
                ? "bg-green-50 border border-green-200"
                : summaryData.attendanceRate >= 85
                ? "bg-yellow-50 border border-yellow-200"
                : "bg-red-50 border border-red-200"
            }`}
          >
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <span
                className={`w-3 h-3 rounded-full ${
                  summaryData.attendanceRate >= 95
                    ? "bg-green-500"
                    : summaryData.attendanceRate >= 85
                    ? "bg-yellow-500"
                    : "bg-red-500"
                }`}
              ></span>
              Overall Performance
            </h4>
            <p className="text-sm">
              {summaryData.attendanceRate >= 95
                ? "🎉 Excellent attendance! Keep up the great work."
                : summaryData.attendanceRate >= 85
                ? "👍 Good attendance, but there's room for improvement."
                : "⚠️ Poor attendance. Please focus on improving regularity."}
            </p>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-500"></span>
              Consistency
            </h4>
            <p className="text-sm">
              {summaryData.totalDays > 0 &&
              summaryData.presentDays / summaryData.totalDays > 0.9
                ? "📊 Very consistent attendance pattern."
                : "📈 Consider establishing a regular routine."}
            </p>
          </div>

          <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-purple-500"></span>
              Punctuality
            </h4>
            <p className="text-sm">
              {summaryData.lateDays > summaryData.totalDays * 0.1
                ? "⏰ Work on arriving on time to improve overall performance."
                : "✅ Great punctuality! Continue maintaining timeliness."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceAnalytics;
