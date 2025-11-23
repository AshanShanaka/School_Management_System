"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import AttendanceCalendar from "@/components/AttendanceCalendar";

interface AttendanceRecord {
  date: string;
  present: number;
  absent: number;
  late: number;
  total: number;
}

interface StudentAttendance {
  id: string;
  name: string;
  surname: string;
  img: string | null;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  totalDays: number;
  attendancePercentage: number;
}

interface ClassInfo {
  id: number;
  name: string;
  grade: {
    id: number;
    level: number;
  };
}

export default function AttendanceReportsPage() {
  const router = useRouter();
  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"calendar" | "daily" | "student">("calendar");
  const [dateRange, setDateRange] = useState<"week" | "month" | "term">("month");
  const [dailyRecords, setDailyRecords] = useState<AttendanceRecord[]>([]);
  const [studentRecords, setStudentRecords] = useState<StudentAttendance[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [selectedDayData, setSelectedDayData] = useState<AttendanceRecord | null>(null);

  useEffect(() => {
    loadReports();
  }, [dateRange]);

  useEffect(() => {
    if (selectedDate && dailyRecords.length > 0) {
      const dayData = dailyRecords.find(r => r.date === selectedDate);
      setSelectedDayData(dayData || null);
    }
  }, [selectedDate, dailyRecords]);

  const loadReports = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/daily-attendance/reports?range=${dateRange}`);
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 403) {
          alert(data.error || "You are not assigned as a class teacher");
          router.push("/teacher");
          return;
        }
        throw new Error(data.error || "Failed to load reports");
      }

      setClassInfo(data.class);
      setDailyRecords(data.dailyRecords || []);
      setStudentRecords(data.studentRecords || []);
    } catch (error: any) {
      console.error("Error loading reports:", error);
      alert(error.message || "Failed to load attendance reports");
    } finally {
      setLoading(false);
    }
  };

  const getAttendanceColor = (percentage: number) => {
    if (percentage >= 90) return "text-green-700 bg-green-50/70 backdrop-blur-sm border border-green-200/60";
    if (percentage >= 75) return "text-blue-700 bg-blue-50/70 backdrop-blur-sm border border-blue-200/60";
    if (percentage >= 60) return "text-amber-700 bg-amber-50/70 backdrop-blur-sm border border-amber-200/60";
    return "text-red-700 bg-red-50/70 backdrop-blur-sm border border-red-200/60";
  };

  const exportToCSV = () => {
    if (viewMode === "daily") {
      const headers = ["Date", "Present", "Absent", "Late", "Total"];
      const rows = dailyRecords.map(record => [
        new Date(record.date).toLocaleDateString(),
        record.present,
        record.absent,
        record.late,
        record.total
      ]);
      
      const csv = [headers, ...rows].map(row => row.join(",")).join("\n");
      downloadCSV(csv, `attendance-daily-${dateRange}.csv`);
    } else {
      const headers = ["Student Name", "Present", "Absent", "Late", "Total Days", "Attendance %"];
      const rows = studentRecords.map(student => [
        `${student.name} ${student.surname}`,
        student.presentCount,
        student.absentCount,
        student.lateCount,
        student.totalDays,
        student.attendancePercentage.toFixed(1) + "%"
      ]);
      
      const csv = [headers, ...rows].map(row => row.join(",")).join("\n");
      downloadCSV(csv, `attendance-students-${dateRange}.csv`);
    }
  };

  const downloadCSV = (csv: string, filename: string) => {
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-xl text-gray-600">Loading reports...</p>
        </div>
      </div>
    );
  }

  if (!classInfo) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-red-500">No class assigned</div>
      </div>
    );
  }

  const overallStats = {
    totalDays: dailyRecords.length,
    avgPresent: dailyRecords.length > 0 
      ? (dailyRecords.reduce((sum, r) => sum + r.present, 0) / dailyRecords.length).toFixed(1)
      : "0",
    avgAbsent: dailyRecords.length > 0
      ? (dailyRecords.reduce((sum, r) => sum + r.absent, 0) / dailyRecords.length).toFixed(1)
      : "0",
    avgLate: dailyRecords.length > 0
      ? (dailyRecords.reduce((sum, r) => sum + r.late, 0) / dailyRecords.length).toFixed(1)
      : "0",
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500/30 to-indigo-500/30 backdrop-blur-xl rounded-xl shadow-lg p-6 border border-purple-300/30">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-purple-700 to-indigo-700 bg-clip-text text-transparent">📊 Attendance Reports</h1>
            <p className="text-purple-700/80 font-medium">
              Class {classInfo.name} - Grade {classInfo.grade.level}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => router.push("/teacher/attendance")}
              className="px-6 py-3 bg-white/40 backdrop-blur-md hover:bg-white/60 text-purple-700 rounded-lg font-medium transition-all flex items-center gap-2 border border-purple-300/50"
            >
              <span>←</span>
              Back to Attendance
            </button>
            <button
              onClick={exportToCSV}
              className="px-6 py-3 bg-white/40 backdrop-blur-md hover:bg-white/60 text-indigo-700 rounded-lg font-medium transition-all flex items-center gap-2 border border-indigo-300/50"
            >
              <span>📥</span>
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between">
          {/* View Mode Toggle */}
          <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setViewMode("calendar")}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                viewMode === "calendar"
                  ? "bg-white text-blue-600 shadow-md"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              📅 Calendar View
            </button>
            <button
              onClick={() => setViewMode("daily")}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                viewMode === "daily"
                  ? "bg-white text-blue-600 shadow-md"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              � Daily View
            </button>
            <button
              onClick={() => setViewMode("student")}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                viewMode === "student"
                  ? "bg-white text-blue-600 shadow-md"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              👥 Student View
            </button>
          </div>

          {/* Date Range Selector */}
          <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setDateRange("week")}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                dateRange === "week"
                  ? "bg-white text-purple-600 shadow-md"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              Last 7 Days
            </button>
            <button
              onClick={() => setDateRange("month")}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                dateRange === "month"
                  ? "bg-white text-purple-600 shadow-md"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              Last 30 Days
            </button>
            <button
              onClick={() => setDateRange("term")}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                dateRange === "term"
                  ? "bg-white text-purple-600 shadow-md"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              This Term
            </button>
          </div>
        </div>
      </div>

      {/* Overall Statistics */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border-2 border-blue-200">
          <div className="text-blue-600 text-sm font-semibold mb-1">TOTAL DAYS</div>
          <div className="text-3xl font-bold text-blue-900">{overallStats.totalDays}</div>
          <div className="text-xs text-blue-700 mt-1">Recorded</div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border-2 border-green-200">
          <div className="text-green-600 text-sm font-semibold mb-1">AVG PRESENT</div>
          <div className="text-3xl font-bold text-green-900">{overallStats.avgPresent}</div>
          <div className="text-xs text-green-700 mt-1">Students per day</div>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-xl border-2 border-red-200">
          <div className="text-red-600 text-sm font-semibold mb-1">AVG ABSENT</div>
          <div className="text-3xl font-bold text-red-900">{overallStats.avgAbsent}</div>
          <div className="text-xs text-red-700 mt-1">Students per day</div>
        </div>
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-6 rounded-xl border-2 border-yellow-200">
          <div className="text-yellow-600 text-sm font-semibold mb-1">AVG LATE</div>
          <div className="text-3xl font-bold text-yellow-900">{overallStats.avgLate}</div>
          <div className="text-xs text-yellow-700 mt-1">Students per day</div>
        </div>
      </div>

      {/* Calendar View */}
      {viewMode === "calendar" && (
        <div className="space-y-6">
          {/* Interactive Calendar */}
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 p-6">
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <span className="text-3xl">📅</span>
                Attendance Calendar
              </h2>
              <p className="text-gray-600 text-sm mt-1">
                Click on any day to view detailed attendance or use arrows to navigate between weeks
              </p>
            </div>
            <AttendanceCalendar 
              selectedDate={selectedDate} 
              onDateSelect={(date) => {
                setSelectedDate(date);
                router.push(`/teacher/attendance?date=${date}`);
              }}
              classId={classInfo?.id}
              showAttendanceStatus={true}
            />
          </div>

          {/* Selected Day Details */}
          {selectedDayData && (
            <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-2xl shadow-xl border-2 border-purple-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-800">
                    {new Date(selectedDate).toLocaleDateString("en-US", { 
                      weekday: "long", 
                      month: "long", 
                      day: "numeric",
                      year: "numeric"
                    })}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">Attendance Summary</p>
                </div>
                <button
                  onClick={() => router.push(`/teacher/attendance?date=${selectedDate}`)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all font-medium flex items-center gap-2"
                >
                  <span>👁️</span>
                  View Details
                </button>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-green-200">
                  <div className="text-green-600 text-xs font-semibold mb-1">PRESENT</div>
                  <div className="text-3xl font-bold text-green-700">{selectedDayData.present}</div>
                  <div className="text-xs text-gray-600 mt-1">
                    {((selectedDayData.present / selectedDayData.total) * 100).toFixed(1)}%
                  </div>
                </div>
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-red-200">
                  <div className="text-red-600 text-xs font-semibold mb-1">ABSENT</div>
                  <div className="text-3xl font-bold text-red-700">{selectedDayData.absent}</div>
                  <div className="text-xs text-gray-600 mt-1">
                    {((selectedDayData.absent / selectedDayData.total) * 100).toFixed(1)}%
                  </div>
                </div>
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-amber-200">
                  <div className="text-amber-600 text-xs font-semibold mb-1">LATE</div>
                  <div className="text-3xl font-bold text-amber-700">{selectedDayData.late}</div>
                  <div className="text-xs text-gray-600 mt-1">
                    {((selectedDayData.late / selectedDayData.total) * 100).toFixed(1)}%
                  </div>
                </div>
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-blue-200">
                  <div className="text-blue-600 text-xs font-semibold mb-1">TOTAL</div>
                  <div className="text-3xl font-bold text-blue-700">{selectedDayData.total}</div>
                  <div className="text-xs text-gray-600 mt-1">Students</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Reports Content */}
      {viewMode === "daily" ? (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-800">Daily Attendance Records</h2>
            <p className="text-sm text-gray-600 mt-1">View attendance by date</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Date</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Present</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Absent</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Late</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Total</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Attendance %</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {dailyRecords.length > 0 ? (
                  dailyRecords.map((record, index) => {
                    const percentage = record.total > 0 ? ((record.present + record.late * 0.5) / record.total) * 100 : 0;
                    return (
                      <tr key={index} className="hover:bg-blue-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-semibold text-gray-900">
                            {new Date(record.date).toLocaleDateString("en-US", { 
                              weekday: "short", 
                              month: "short", 
                              day: "numeric",
                              year: "numeric"
                            })}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="px-3 py-1 bg-green-50/60 backdrop-blur-sm text-green-700 rounded-full font-semibold border border-green-200/50">
                            {record.present}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="px-3 py-1 bg-red-50/60 backdrop-blur-sm text-red-700 rounded-full font-semibold border border-red-200/50">
                            {record.absent}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="px-3 py-1 bg-amber-50/60 backdrop-blur-sm text-amber-700 rounded-full font-semibold border border-amber-200/50">
                            {record.late}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-lg font-bold text-gray-900">{record.total}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-3 py-1 rounded-full font-semibold ${getAttendanceColor(percentage)}`}>
                            {percentage.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      <div className="text-4xl mb-2">📭</div>
                      <div className="text-lg font-semibold">No attendance records found</div>
                      <div className="text-sm">Start taking attendance to see reports here</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-800">Student Attendance Summary</h2>
            <p className="text-sm text-gray-600 mt-1">Individual student statistics</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Student</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Present</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Absent</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Late</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Total Days</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Attendance %</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {studentRecords.length > 0 ? (
                  studentRecords
                    .sort((a, b) => b.attendancePercentage - a.attendancePercentage)
                    .map((student) => (
                      <tr key={student.id} className="hover:bg-blue-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Image
                              src={student.img || "/avatar.png"}
                              alt={student.name}
                              width={40}
                              height={40}
                              className="rounded-full"
                            />
                            <div className="font-semibold text-gray-900">
                              {student.name} {student.surname}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="px-2 py-1 bg-green-50/60 backdrop-blur-sm text-green-700 rounded-lg font-semibold border border-green-200/50">{student.presentCount}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="px-2 py-1 bg-red-50/60 backdrop-blur-sm text-red-700 rounded-lg font-semibold border border-red-200/50">{student.absentCount}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="px-2 py-1 bg-amber-50/60 backdrop-blur-sm text-amber-700 rounded-lg font-semibold border border-amber-200/50">{student.lateCount}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-lg font-bold text-gray-900">{student.totalDays}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span className={`px-3 py-1 rounded-full font-bold text-lg ${getAttendanceColor(student.attendancePercentage)}`}>
                              {student.attendancePercentage.toFixed(1)}%
                            </span>
                            <div className="w-24 h-2 bg-gray-100/80 backdrop-blur-sm rounded-full overflow-hidden border border-gray-200/50">
                              <div
                                className={`h-full transition-all ${
                                  student.attendancePercentage >= 90 ? "bg-gradient-to-r from-green-400/80 to-green-500/80" :
                                  student.attendancePercentage >= 75 ? "bg-gradient-to-r from-blue-400/80 to-blue-500/80" :
                                  student.attendancePercentage >= 60 ? "bg-gradient-to-r from-amber-400/80 to-amber-500/80" : "bg-gradient-to-r from-red-400/80 to-red-500/80"
                                }`}
                                style={{ width: `${student.attendancePercentage}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {student.attendancePercentage >= 90 && (
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-50/60 backdrop-blur-sm text-green-700 font-semibold rounded-full border border-green-200/50">
                              <span>🌟</span> Excellent
                            </span>
                          )}
                          {student.attendancePercentage >= 75 && student.attendancePercentage < 90 && (
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50/60 backdrop-blur-sm text-blue-700 font-semibold rounded-full border border-blue-200/50">
                              <span>👍</span> Good
                            </span>
                          )}
                          {student.attendancePercentage >= 60 && student.attendancePercentage < 75 && (
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-50/60 backdrop-blur-sm text-amber-700 font-semibold rounded-full border border-amber-200/50">
                              <span>⚠️</span> Fair
                            </span>
                          )}
                          {student.attendancePercentage < 60 && (
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-50/60 backdrop-blur-sm text-red-700 font-semibold rounded-full border border-red-200/50">
                              <span>❗</span> Poor
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      <div className="text-4xl mb-2">📭</div>
                      <div className="text-lg font-semibold">No student records found</div>
                      <div className="text-sm">Start taking attendance to see student statistics</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
