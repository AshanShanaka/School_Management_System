"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
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

interface ChildInfo {
  id: string;
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

export default function ChildAttendanceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const studentId = params.id as string;

  const [child, setChild] = useState<ChildInfo | null>(null);
  const [period, setPeriod] = useState<Period>("month");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState({ total: 0, present: 0, late: 0, absent: 0 });
  const [attendancePercentage, setAttendancePercentage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"summary" | "calendar">("summary");

  useEffect(() => {
    loadAttendance();
  }, [period, studentId]);

  const loadAttendance = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/daily-attendance/parent?studentId=${studentId}&period=${period}`);
      const data = await res.json();

      if (data.success) {
        setChild(data.student);
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

  if (!child) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <p className="text-yellow-800">Unable to load child information.</p>
          <button
            onClick={() => router.push("/parent")}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-white bg-opacity-20 flex items-center justify-center overflow-hidden">
            {child.img ? (
              <Image
                src={child.img}
                alt={child.name}
                width={80}
                height={80}
                className="rounded-full"
              />
            ) : (
              <span className="text-3xl font-bold">
                {child.name.charAt(0)}
                {child.surname.charAt(0)}
              </span>
            )}
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-1">📋 {child.name}&apos;s Attendance</h1>
            <p className="text-blue-100">
              {child.name} {child.surname} • {child.class.name} - Grade {child.class.grade.level}
            </p>
          </div>
          <div className="text-right">
            <div className="text-5xl font-bold">{attendancePercentage}%</div>
            <div className="text-blue-100 text-sm">Attendance Rate</div>
          </div>
        </div>
      </div>

      {/* Back Button */}
      <button
        onClick={() => router.push("/parent")}
        className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-2 font-medium"
      >
        ← Back to Dashboard
      </button>

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

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600 mb-1">Total Days</div>
                  <div className="text-3xl font-bold text-gray-800">{stats.total}</div>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl">📅</span>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600 mb-1">Present</div>
                  <div className="text-3xl font-bold text-green-600">{stats.present}</div>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl">✓</span>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-yellow-500">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600 mb-1">Late</div>
                  <div className="text-3xl font-bold text-yellow-600">{stats.late}</div>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl">⏰</span>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-red-500">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600 mb-1">Absent</div>
                  <div className="text-3xl font-bold text-red-600">{stats.absent}</div>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl">✗</span>
                </div>
              </div>
            </div>
          </div>

          {/* Attendance Records */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b">
              <h3 className="font-semibold text-lg">Attendance History</h3>
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
