"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import AttendanceCalendar from "@/components/AttendanceCalendar";

type Period = "today" | "week" | "month" | "year";

interface AttendanceRecord {
  id: number;
  date: string;
  status: string;
  notes: string | null;
  teacher: {
    name: string;
    surname: string;
  };
}

interface StudentInfo {
  name: string;
  surname: string;
  img: string | null;
  class: {
    id: number;
    name: string;
    grade: {
      level: number;
    };
  };
}

export default function StudentAttendancePage() {
  const [student, setStudent] = useState<StudentInfo | null>(null);
  const [period, setPeriod] = useState<Period>("month");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState({ total: 0, present: 0, late: 0, absent: 0 });
  const [attendancePercentage, setAttendancePercentage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"summary" | "calendar">("summary");

  useEffect(() => {
    loadAttendance();
  }, [period]);

  const loadAttendance = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/daily-attendance/student?period=${period}`);
      const data = await res.json();

      if (data.success) {
        setStudent(data.student);
        setRecords(data.records);
        setStats(data.stats);
        setAttendancePercentage(data.attendancePercentage || 0);
      } else {
        console.error("Failed to load attendance:", data.error);
      }
    } catch (error) {
      console.error("Error loading attendance:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PRESENT":
        return "text-green-600 bg-green-50";
      case "LATE":
        return "text-yellow-600 bg-yellow-50";
      case "ABSENT":
        return "text-red-600 bg-red-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PRESENT":
        return "✓";
      case "LATE":
        return "⏰";
      case "ABSENT":
        return "✗";
      default:
        return "?";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading attendance...</p>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <p className="text-yellow-800">Unable to load student information.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header - Report Style */}
      <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center overflow-hidden border-4 border-white shadow-xl">
                {student.img ? (
                  <Image
                    src={student.img}
                    alt={student.name}
                    width={80}
                    height={80}
                    className="rounded-full object-cover"
                  />
                ) : (
                  <span className="text-3xl font-bold">
                    {student.name.charAt(0)}
                    {student.surname.charAt(0)}
                  </span>
                )}
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-1">
                  📊 Attendance Report
                </h1>
                <p className="text-blue-100">
                  {student.name} {student.surname} • {student.class.name} - Grade {student.class.grade.level}
                </p>
              </div>
            </div>
            <div className="text-right bg-white/20 backdrop-blur-sm rounded-xl p-6 border-2 border-white/30">
              <div className="text-6xl font-bold mb-1">{attendancePercentage}%</div>
              <div className="text-blue-100 text-sm font-medium">Overall Rate</div>
              <div className="mt-2">
                <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                  attendancePercentage >= 90 ? 'bg-green-500' : 
                  attendancePercentage >= 75 ? 'bg-blue-500' : 
                  'bg-orange-500'
                }`}>
                  {attendancePercentage >= 90 ? '⭐ Excellent' : attendancePercentage >= 75 ? '✓ Good' : '⚠ Needs Improvement'}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-r from-gray-50 to-blue-50 px-6 py-3 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 font-medium">📅 Report Period: {period.toUpperCase()}</span>
            <span className="text-gray-600 font-medium">📋 Generated: {new Date().toLocaleDateString('en-GB')}</span>
          </div>
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="flex gap-3">
        <button
          onClick={() => setViewMode("summary")}
          className={`px-6 py-3 rounded-lg font-medium transition-all ${
            viewMode === "summary"
              ? "bg-blue-600 text-white shadow-lg"
              : "bg-white text-gray-700 hover:bg-gray-50 shadow"
          }`}
        >
          📊 Summary View
        </button>
        <button
          onClick={() => setViewMode("calendar")}
          className={`px-6 py-3 rounded-lg font-medium transition-all ${
            viewMode === "calendar"
              ? "bg-blue-600 text-white shadow-lg"
              : "bg-white text-gray-700 hover:bg-gray-50 shadow"
          }`}
        >
          📅 Calendar View
        </button>
      </div>

      {viewMode === "calendar" ? (
        <>
          {/* Calendar Week View */}
          <AttendanceCalendar selectedDate={selectedDate} onDateSelect={setSelectedDate} />

          {/* Selected Date Attendance */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold mb-4 text-gray-800">
              Attendance for {new Date(selectedDate).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
            </h3>
            {records.find(r => r.date.split("T")[0] === selectedDate) ? (
              <div className="space-y-4">
                {(() => {
                  const record = records.find(r => r.date.split("T")[0] === selectedDate);
                  if (!record) return null;
                  return (
                    <div className="p-6 border-2 border-gray-200 rounded-lg">
                      <div className="flex items-center gap-4 mb-3">
                        <span
                          className={`px-6 py-3 rounded-full font-semibold text-lg ${getStatusColor(
                            record.status
                          )}`}
                        >
                          {getStatusIcon(record.status)} {record.status}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mb-2">
                        Marked by: {record.teacher.name} {record.teacher.surname}
                      </div>
                      {record.notes && (
                        <div className="mt-3 text-sm text-gray-700 bg-blue-50 p-4 rounded border-l-4 border-blue-400">
                          <span className="font-medium">Note:</span> {record.notes}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            ) : (
              <div className="p-12 text-center bg-gray-50 rounded-lg">
                <div className="text-6xl mb-4">📋</div>
                <p className="text-gray-500 text-lg">No attendance record for this date.</p>
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          {/* Period Filter */}
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex gap-2">
              {(["today", "week", "month", "year"] as Period[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-6 py-2 rounded-lg font-medium transition-all ${
                    period === p
                      ? "bg-blue-600 text-white shadow-lg scale-105"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Stats - Report Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl shadow-lg border-2 border-blue-200 transform hover:scale-105 transition-transform">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-blue-700 font-semibold mb-2">Total Days</div>
                  <div className="text-4xl font-bold text-blue-900">{stats.total}</div>
                  <div className="text-xs text-blue-600 mt-1">School days tracked</div>
                </div>
                <div className="w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center shadow-md">
                  <span className="text-3xl">📅</span>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl shadow-lg border-2 border-green-200 transform hover:scale-105 transition-transform">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-green-700 font-semibold mb-2">Present</div>
                  <div className="text-4xl font-bold text-green-900">{stats.present}</div>
                  <div className="text-xs text-green-600 mt-1">{stats.total > 0 ? `${Math.round((stats.present/stats.total)*100)}% attended` : 'N/A'}</div>
                </div>
                <div className="w-14 h-14 bg-green-600 rounded-xl flex items-center justify-center shadow-md">
                  <span className="text-3xl">✓</span>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-6 rounded-xl shadow-lg border-2 border-yellow-200 transform hover:scale-105 transition-transform">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-yellow-700 font-semibold mb-2">Late</div>
                  <div className="text-4xl font-bold text-yellow-900">{stats.late}</div>
                  <div className="text-xs text-yellow-600 mt-1">{stats.total > 0 ? `${Math.round((stats.late/stats.total)*100)}% late arrivals` : 'N/A'}</div>
                </div>
                <div className="w-14 h-14 bg-yellow-600 rounded-xl flex items-center justify-center shadow-md">
                  <span className="text-3xl">⏰</span>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-xl shadow-lg border-2 border-red-200 transform hover:scale-105 transition-transform">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-red-700 font-semibold mb-2">Absent</div>
                  <div className="text-4xl font-bold text-red-900">{stats.absent}</div>
                  <div className="text-xs text-red-600 mt-1">{stats.total > 0 ? `${Math.round((stats.absent/stats.total)*100)}% missed` : 'N/A'}</div>
                </div>
                <div className="w-14 h-14 bg-red-600 rounded-xl flex items-center justify-center shadow-md">
                  <span className="text-3xl">✗</span>
                </div>
              </div>
            </div>
          </div>

          {/* Attendance Records - Report Table Style */}
          <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-blue-50 border-b-2 border-gray-300">
              <h3 className="font-bold text-xl text-gray-800 flex items-center gap-2">
                <span className="text-2xl">📋</span>
                Attendance History Report
              </h3>
              <p className="text-sm text-gray-600 mt-1">Detailed record of daily attendance</p>
            </div>

            {records.length === 0 ? (
              <div className="p-12 text-center">
                <div className="text-6xl mb-4">📋</div>
                <p className="text-gray-500 text-lg">No attendance records found for this period.</p>
              </div>
            ) : (
              <div className="divide-y">
                {records.map((record) => (
                  <div key={record.id} className="p-5 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span
                            className={`px-4 py-2 rounded-full font-semibold text-sm ${getStatusColor(
                              record.status
                            )}`}
                          >
                            {getStatusIcon(record.status)} {record.status}
                          </span>
                          <div className="font-medium text-gray-800 text-lg">
                            {new Date(record.date).toLocaleDateString("en-US", {
                              weekday: "long",
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </div>
                        </div>
                        <div className="text-sm text-gray-600 ml-1">
                          Marked by: {record.teacher.name} {record.teacher.surname}
                        </div>
                        {record.notes && (
                          <div className="mt-2 text-sm text-gray-700 bg-gray-50 p-3 rounded italic border-l-4 border-blue-300">
                            <span className="font-medium">Note:</span> {record.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
