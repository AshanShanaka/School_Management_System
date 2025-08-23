"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

interface ClassAttendanceData {
  classId: number;
  className: string;
  gradeLevel: number;
  totalStudents: number;
  presentToday?: number;
  absentToday?: number;
  lateToday?: number;
  averagePresent?: number;
  averageAbsent?: number;
  averageLate?: number;
  totalDays?: number;
  attendanceRate: number;
}

interface OverallSummary {
  totalClasses: number;
  totalStudents: number;
  averageAttendanceRate: number;
  totalPresent?: number;
  totalAbsent?: number;
  totalLate?: number;
}

interface AttendanceResponse {
  period: string;
  dateRange: {
    start: string;
    end: string;
  };
  overallSummary: OverallSummary;
  classWiseData: ClassAttendanceData[];
}

const ClassWiseAttendance = () => {
  const [attendanceData, setAttendanceData] =
    useState<AttendanceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState("daily");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [selectedClass, setSelectedClass] = useState<string>("");

  useEffect(() => {
    fetchAttendanceData();
  }, [selectedPeriod, selectedDate, selectedClass]);

  const fetchAttendanceData = async () => {
    setLoading(true);
    try {
      let url = `/api/admin/attendance/class-wise?period=${selectedPeriod}&date=${selectedDate}`;
      if (selectedClass) {
        url += `&classId=${selectedClass}`;
      }

      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch data");

      const data = await response.json();
      setAttendanceData(data);
    } catch (error) {
      console.error("Error fetching attendance data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getAttendanceColor = (rate: number) => {
    if (rate >= 95) return "text-green-600 bg-green-100";
    if (rate >= 85) return "text-yellow-600 bg-yellow-100";
    return "text-red-600 bg-red-100";
  };

  const getPeriodLabel = (period: string) => {
    switch (period) {
      case "daily":
        return "Daily";
      case "weekly":
        return "Weekly";
      case "monthly":
        return "Monthly";
      case "yearly":
        return "Yearly";
      default:
        return "Daily";
    }
  };

  const formatDateRange = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);

    if (start === end) {
      return startDate.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }

    return `${startDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })} - ${endDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })}`;
  };

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

  if (!attendanceData) {
    return (
      <div className="bg-white p-6 rounded-md">
        <div className="text-center text-gray-500">
          Failed to load attendance data
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="bg-white p-6 rounded-md">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">
              Class-wise Attendance Management
            </h2>
            <p className="text-gray-500 mt-1">
              Monitor and analyze attendance across all classes
            </p>
          </div>
          <Link
            href="/admin/attendance/take"
            className="bg-lamaSky text-white px-4 py-2 rounded-md hover:bg-lamaSkyLight transition-colors"
          >
            Take Attendance
          </Link>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-4 mb-6">
          {/* Period Selection */}
          <div className="flex gap-2">
            {["daily", "weekly", "monthly", "yearly"].map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-4 py-2 rounded text-sm font-medium ${
                  selectedPeriod === period
                    ? "bg-lamaPurple text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {getPeriodLabel(period)}
              </button>
            ))}
          </div>

          {/* Date Selection */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Date:</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border border-gray-300 rounded px-3 py-1 text-sm"
            />
          </div>
        </div>

        {/* Date Range Display */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h3 className="font-semibold text-gray-800">
            {getPeriodLabel(selectedPeriod)} Report
          </h3>
          <p className="text-sm text-gray-600">
            {formatDateRange(
              attendanceData.dateRange.start,
              attendanceData.dateRange.end
            )}
          </p>
        </div>

        {/* Overall Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg text-center">
            <h3 className="text-2xl font-bold text-blue-600">
              {attendanceData.overallSummary.totalClasses}
            </h3>
            <p className="text-sm text-gray-600">Total Classes</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg text-center">
            <h3 className="text-2xl font-bold text-green-600">
              {attendanceData.overallSummary.totalStudents}
            </h3>
            <p className="text-sm text-gray-600">Total Students</p>
          </div>
          {selectedPeriod === "daily" && (
            <>
              <div className="bg-emerald-50 p-4 rounded-lg text-center">
                <h3 className="text-2xl font-bold text-emerald-600">
                  {attendanceData.overallSummary.totalPresent || 0}
                </h3>
                <p className="text-sm text-gray-600">Present Today</p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg text-center">
                <h3 className="text-2xl font-bold text-red-600">
                  {attendanceData.overallSummary.totalAbsent || 0}
                </h3>
                <p className="text-sm text-gray-600">Absent Today</p>
              </div>
            </>
          )}
          {selectedPeriod !== "daily" && (
            <div className="bg-purple-50 p-4 rounded-lg text-center col-span-2">
              <h3 className="text-2xl font-bold text-purple-600">
                {attendanceData.overallSummary.averageAttendanceRate}%
              </h3>
              <p className="text-sm text-gray-600">Average Attendance Rate</p>
            </div>
          )}
        </div>
      </div>

      {/* Class-wise Attendance Table */}
      <div className="bg-white p-6 rounded-md">
        <h3 className="text-lg font-semibold mb-4">Class-wise Breakdown</h3>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left p-4 font-semibold">Class</th>
                <th className="text-center p-4 font-semibold">
                  Total Students
                </th>
                {selectedPeriod === "daily" ? (
                  <>
                    <th className="text-center p-4 font-semibold">Present</th>
                    <th className="text-center p-4 font-semibold">Absent</th>
                    <th className="text-center p-4 font-semibold">Late</th>
                  </>
                ) : (
                  <>
                    <th className="text-center p-4 font-semibold">
                      Avg Present
                    </th>
                    <th className="text-center p-4 font-semibold">
                      Avg Absent
                    </th>
                    <th className="text-center p-4 font-semibold">
                      Total Days
                    </th>
                  </>
                )}
                <th className="text-center p-4 font-semibold">
                  Attendance Rate
                </th>
                <th className="text-center p-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {attendanceData.classWiseData.map((classData) => (
                <tr
                  key={classData.classId}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-lamaSky rounded-full flex items-center justify-center">
                        <Image
                          src="/class.png"
                          alt=""
                          width={20}
                          height={20}
                          className="filter brightness-0 invert"
                        />
                      </div>
                      <div>
                        <div className="font-medium">
                          Grade {classData.className}
                        </div>
                        <div className="text-sm text-gray-500">
                          {classData.totalStudents} students
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="text-center p-4 font-medium">
                    {classData.totalStudents}
                  </td>
                  {selectedPeriod === "daily" ? (
                    <>
                      <td className="text-center p-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
                          {classData.presentToday || 0}
                        </span>
                      </td>
                      <td className="text-center p-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-red-100 text-red-800">
                          {classData.absentToday || 0}
                        </span>
                      </td>
                      <td className="text-center p-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-yellow-100 text-yellow-800">
                          {classData.lateToday || 0}
                        </span>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="text-center p-4 text-sm">
                        {classData.averagePresent?.toFixed(1) || 0}
                      </td>
                      <td className="text-center p-4 text-sm">
                        {classData.averageAbsent?.toFixed(1) || 0}
                      </td>
                      <td className="text-center p-4 text-sm">
                        {classData.totalDays || 0}
                      </td>
                    </>
                  )}
                  <td className="text-center p-4">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getAttendanceColor(
                        classData.attendanceRate
                      )}`}
                    >
                      {classData.attendanceRate}%
                    </span>
                  </td>
                  <td className="text-center p-4">
                    <div className="flex gap-2 justify-center">
                      <Link
                        href={`/list/students?classId=${classData.classId}`}
                        className="p-2 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors"
                        title="View Students"
                      >
                        <Image src="/view.png" alt="" width={16} height={16} />
                      </Link>
                      <Link
                        href={`/admin/attendance/take?classId=${classData.classId}&date=${selectedDate}`}
                        className="p-2 bg-green-100 text-green-600 rounded hover:bg-green-200 transition-colors"
                        title="Take Attendance"
                      >
                        <Image
                          src="/create.png"
                          alt=""
                          width={16}
                          height={16}
                        />
                      </Link>
                      <Link
                        href={`/admin/attendance/reports?classId=${classData.classId}`}
                        className="p-2 bg-purple-100 text-purple-600 rounded hover:bg-purple-200 transition-colors"
                        title="View Reports"
                      >
                        <Image
                          src="/result.png"
                          alt=""
                          width={16}
                          height={16}
                        />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {attendanceData.classWiseData.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No attendance data found for the selected period.
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-md">
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/admin/attendance/take"
            className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
          >
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
              <Image
                src="/create.png"
                alt=""
                width={20}
                height={20}
                className="filter brightness-0 invert"
              />
            </div>
            <div>
              <h4 className="font-medium text-green-800">Take Attendance</h4>
              <p className="text-sm text-green-600">
                Record today's attendance
              </p>
            </div>
          </Link>

          <Link
            href="/admin/attendance/reports"
            className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
              <Image
                src="/result.png"
                alt=""
                width={20}
                height={20}
                className="filter brightness-0 invert"
              />
            </div>
            <div>
              <h4 className="font-medium text-blue-800">View Reports</h4>
              <p className="text-sm text-blue-600">Generate detailed reports</p>
            </div>
          </Link>

          <Link
            href="/list/students"
            className="flex items-center gap-3 p-4 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors"
          >
            <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
              <Image
                src="/student.png"
                alt=""
                width={20}
                height={20}
                className="filter brightness-0 invert"
              />
            </div>
            <div>
              <h4 className="font-medium text-purple-800">Manage Students</h4>
              <p className="text-sm text-purple-600">View all students</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ClassWiseAttendance;
