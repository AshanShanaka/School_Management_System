"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";

interface ClassAttendanceData {
  classId: number;
  className: string;
  grade: number;
  totalStudents: number;
  presentToday: number;
  absentToday: number;
  lateToday: number;
  attendanceRate: number;
  weeklyTrend: Array<{
    date: string;
    present: number;
    absent: number;
    late: number;
  }>;
}

interface AttendanceOverview {
  totalStudents: number;
  totalPresent: number;
  totalAbsent: number;
  totalLate: number;
  overallRate: number;
  classes: ClassAttendanceData[];
  monthlyTrend: Array<{
    month: string;
    rate: number;
  }>;
  gradeWiseData: Array<{
    grade: string;
    attendance: number;
  }>;
}

const COLORS = {
  present: "#10B981",
  absent: "#EF4444",
  late: "#F59E0B",
  primary: "#6366F1",
  secondary: "#8B5CF6",
};

const AdminAttendancePage = () => {
  const router = useRouter();
  const [data, setData] = useState<AttendanceOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [viewMode, setViewMode] = useState<"overview" | "details">("overview");

  useEffect(() => {
    loadAttendanceOverview();
  }, [selectedDate]);

  const loadAttendanceOverview = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/admin/attendance-overview?date=${selectedDate}`
      );
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to load attendance data");
      }

      setData(result);
    } catch (error: any) {
      console.error("Error loading attendance overview:", error);
      // Set sample data for demonstration
      setData(generateSampleData());
    } finally {
      setLoading(false);
    }
  };

  const generateSampleData = (): AttendanceOverview => {
    const classes: ClassAttendanceData[] = [
      {
        classId: 1,
        className: "11A",
        grade: 11,
        totalStudents: 35,
        presentToday: 32,
        absentToday: 2,
        lateToday: 1,
        attendanceRate: 91.4,
        weeklyTrend: generateWeeklyTrend(),
      },
      {
        classId: 2,
        className: "11B",
        grade: 11,
        totalStudents: 38,
        presentToday: 35,
        absentToday: 3,
        lateToday: 0,
        attendanceRate: 92.1,
        weeklyTrend: generateWeeklyTrend(),
      },
      {
        classId: 3,
        className: "10A",
        grade: 10,
        totalStudents: 40,
        presentToday: 38,
        absentToday: 1,
        lateToday: 1,
        attendanceRate: 95.0,
        weeklyTrend: generateWeeklyTrend(),
      },
      {
        classId: 4,
        className: "10B",
        grade: 10,
        totalStudents: 36,
        presentToday: 34,
        absentToday: 2,
        lateToday: 0,
        attendanceRate: 94.4,
        weeklyTrend: generateWeeklyTrend(),
      },
      {
        classId: 5,
        className: "9A",
        grade: 9,
        totalStudents: 42,
        presentToday: 40,
        absentToday: 1,
        lateToday: 1,
        attendanceRate: 95.2,
        weeklyTrend: generateWeeklyTrend(),
      },
    ];

    const totalStudents = classes.reduce((sum, c) => sum + c.totalStudents, 0);
    const totalPresent = classes.reduce((sum, c) => sum + c.presentToday, 0);
    const totalAbsent = classes.reduce((sum, c) => sum + c.absentToday, 0);
    const totalLate = classes.reduce((sum, c) => sum + c.lateToday, 0);

    return {
      totalStudents,
      totalPresent,
      totalAbsent,
      totalLate,
      overallRate: (totalPresent / totalStudents) * 100,
      classes,
      monthlyTrend: [
        { month: "Jan", rate: 92.5 },
        { month: "Feb", rate: 93.2 },
        { month: "Mar", rate: 91.8 },
        { month: "Apr", rate: 94.1 },
        { month: "May", rate: 93.7 },
      ],
      gradeWiseData: [
        { grade: "Grade 9", attendance: 95.2 },
        { grade: "Grade 10", attendance: 94.7 },
        { grade: "Grade 11", attendance: 91.8 },
      ],
    };
  };

  const generateWeeklyTrend = () => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
    return days.map((day) => ({
      date: day,
      present: Math.floor(Math.random() * 10) + 30,
      absent: Math.floor(Math.random() * 3) + 1,
      late: Math.floor(Math.random() * 2),
    }));
  };

  const navigateToClassAttendance = (classId: number) => {
    router.push(`/admin/attendance/class/${classId}?date=${selectedDate}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/50 flex items-center justify-center">
        <div className="text-center bg-white/50 backdrop-blur-xl rounded-3xl p-12 border-2 border-indigo-200/50 shadow-xl">
          <div className="w-16 h-16 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg text-gray-700 font-semibold">
            Loading attendance data...
          </p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/50 flex items-center justify-center">
        <div className="text-center bg-white/50 backdrop-blur-xl rounded-3xl p-12 border-2 border-indigo-200/50 shadow-xl">
          <div className="text-6xl mb-4">📊</div>
          <p className="text-xl text-gray-700 font-semibold">No attendance data available</p>
        </div>
      </div>
    );
  }

  const pieChartData = [
    { name: "Present", value: data.totalPresent, color: COLORS.present },
    { name: "Absent", value: data.totalAbsent, color: COLORS.absent },
    { name: "Late", value: data.totalLate, color: COLORS.late },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/50 p-6">
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* Header Section - Eye-friendly Glass Morphism */}
        <div className="relative bg-white/40 backdrop-blur-xl rounded-3xl shadow-xl border border-white/60 p-8 overflow-hidden">
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-100/30 via-purple-100/20 to-pink-100/30 pointer-events-none"></div>
          
          {/* Content */}
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-4xl font-bold mb-2 flex items-center gap-3 bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-600 bg-clip-text text-transparent">
                  <span className="text-5xl">📊</span>
                  Attendance Analytics Dashboard
                </h1>
                <p className="text-gray-700 text-lg font-medium">
                  Real-time attendance monitoring and insights
                </p>
              </div>
              <div className="bg-white/60 backdrop-blur-md rounded-xl p-4 border-2 border-indigo-200 shadow-lg">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-4 py-2 rounded-lg bg-white/90 text-gray-800 font-semibold cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-400 border-2 border-transparent focus:border-indigo-500 transition-all"
                />
              </div>
            </div>

            {/* Key Metrics Row - Soft Glass Cards */}
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-white/50 backdrop-blur-md rounded-2xl p-5 border-2 border-indigo-200/50 shadow-md hover:shadow-lg transition-all">
                <div className="text-sm font-semibold text-indigo-700 mb-1">Total Students</div>
                <div className="text-3xl font-bold text-indigo-900">{data.totalStudents}</div>
                <div className="mt-2 h-1 w-12 bg-gradient-to-r from-indigo-400 to-indigo-600 rounded-full"></div>
              </div>
              <div className="bg-white/50 backdrop-blur-md rounded-2xl p-5 border-2 border-green-200/50 shadow-md hover:shadow-lg transition-all">
                <div className="text-sm font-semibold text-green-700 mb-1">Present Today</div>
                <div className="text-3xl font-bold text-green-900">{data.totalPresent}</div>
                <div className="mt-2 h-1 w-12 bg-gradient-to-r from-green-400 to-green-600 rounded-full"></div>
              </div>
              <div className="bg-white/50 backdrop-blur-md rounded-2xl p-5 border-2 border-red-200/50 shadow-md hover:shadow-lg transition-all">
                <div className="text-sm font-semibold text-red-700 mb-1">Absent Today</div>
                <div className="text-3xl font-bold text-red-900">{data.totalAbsent}</div>
                <div className="mt-2 h-1 w-12 bg-gradient-to-r from-red-400 to-red-600 rounded-full"></div>
              </div>
              <div className="bg-white/50 backdrop-blur-md rounded-2xl p-5 border-2 border-yellow-200/50 shadow-md hover:shadow-lg transition-all">
                <div className="text-sm font-semibold text-yellow-700 mb-1">Late Today</div>
                <div className="text-3xl font-bold text-yellow-900">{data.totalLate}</div>
                <div className="mt-2 h-1 w-12 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Overall Attendance Pie Chart */}
          <div className="bg-white/50 backdrop-blur-xl rounded-3xl shadow-lg p-6 border-2 border-indigo-200/50">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="text-2xl">🎯</span>
              Today's Attendance Distribution
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(1)}%`
                  }
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 flex justify-center gap-6">
              {pieChartData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <span className="text-sm font-medium text-gray-700">
                    {item.name}: {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Monthly Trend Line Chart */}
          <div className="bg-white/50 backdrop-blur-xl rounded-3xl shadow-lg p-6 border-2 border-purple-200/50">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="text-2xl">📈</span>
              Monthly Attendance Trend
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={data.monthlyTrend}>
                <defs>
                  <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.8} />
                    <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="month" stroke="#6B7280" />
                <YAxis stroke="#6B7280" domain={[80, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                    border: "2px solid #6366F1",
                    borderRadius: "12px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="rate"
                  stroke={COLORS.primary}
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorRate)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Grade-wise Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Grade-wise Bar Chart */}
          <div className="bg-white/50 backdrop-blur-xl rounded-3xl shadow-lg p-6 border-2 border-green-200/50">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="text-2xl">📚</span>
              Grade-wise Attendance Rate
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.gradeWiseData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="grade" stroke="#6B7280" />
                <YAxis stroke="#6B7280" domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                    border: "2px solid #10B981",
                    borderRadius: "12px",
                  }}
                />
                <Bar dataKey="attendance" fill={COLORS.present} radius={[10, 10, 0, 0]}>
                  {data.gradeWiseData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={`hsl(${140 + index * 20}, 70%, 50%)`}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Attendance Rate Gauge */}
          <div className="bg-white/50 backdrop-blur-xl rounded-3xl shadow-lg p-6 border-2 border-blue-200/50">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="text-2xl">🎓</span>
              Overall Attendance Rate
            </h2>
            <div className="flex items-center justify-center h-[300px]">
              <div className="relative">
                <div className="w-64 h-64 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                  <div className="w-52 h-52 rounded-full bg-white flex items-center justify-center shadow-inner">
                    <div className="text-center">
                      <div className="text-6xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                        {data.overallRate.toFixed(1)}%
                      </div>
                      <div className="text-gray-600 font-semibold mt-2">
                        Overall Rate
                      </div>
                      <div className="mt-4 flex items-center justify-center gap-2">
                        {data.overallRate >= 95 ? (
                          <span className="text-3xl">🌟</span>
                        ) : data.overallRate >= 90 ? (
                          <span className="text-3xl">✅</span>
                        ) : (
                          <span className="text-3xl">⚠️</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Class-wise Detailed Table */}
        <div className="bg-white/50 backdrop-blur-xl rounded-3xl shadow-lg p-6 border-2 border-indigo-200/50">
          <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <span className="text-2xl">🏫</span>
            Class-wise Attendance Details
          </h2>

          <div className="grid gap-4">
            {data.classes.map((classData) => (
              <div
                key={classData.classId}
                className="bg-gradient-to-r from-white/60 to-indigo-50/60 backdrop-blur-lg rounded-2xl p-6 border-2 border-indigo-200/50 hover:border-indigo-300 hover:shadow-xl transition-all cursor-pointer"
                onClick={() => navigateToClassAttendance(classData.classId)}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                      {classData.className}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">
                        Class {classData.className}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Grade {classData.grade} • {classData.totalStudents} Students
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    {/* Stats */}
                    <div className="flex gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {classData.presentToday}
                        </div>
                        <div className="text-xs text-gray-600">Present</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">
                          {classData.absentToday}
                        </div>
                        <div className="text-xs text-gray-600">Absent</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-600">
                          {classData.lateToday}
                        </div>
                        <div className="text-xs text-gray-600">Late</div>
                      </div>
                    </div>

                    {/* Attendance Rate Badge */}
                    <div
                      className={`px-6 py-3 rounded-xl font-bold text-white shadow-lg ${
                        classData.attendanceRate >= 95
                          ? "bg-gradient-to-r from-green-500 to-green-600"
                          : classData.attendanceRate >= 90
                          ? "bg-gradient-to-r from-blue-500 to-blue-600"
                          : "bg-gradient-to-r from-yellow-500 to-orange-600"
                      }`}
                    >
                      <div className="text-2xl">{classData.attendanceRate.toFixed(1)}%</div>
                      <div className="text-xs opacity-90">Rate</div>
                    </div>

                    <div className="text-gray-400">
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Weekly Trend Mini Chart */}
                <div className="mt-4 bg-white/50 rounded-lg p-3">
                  <h4 className="text-xs font-semibold text-gray-600 mb-2">
                    Weekly Trend
                  </h4>
                  <ResponsiveContainer width="100%" height={80}>
                    <LineChart data={classData.weeklyTrend}>
                      <Line
                        type="monotone"
                        dataKey="present"
                        stroke={COLORS.present}
                        strokeWidth={2}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="absent"
                        stroke={COLORS.absent}
                        strokeWidth={2}
                        dot={false}
                      />
                      <XAxis dataKey="date" hide />
                      <YAxis hide />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "rgba(255, 255, 255, 0.95)",
                          border: "1px solid #E5E7EB",
                          borderRadius: "8px",
                          fontSize: "12px",
                        }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAttendancePage;
