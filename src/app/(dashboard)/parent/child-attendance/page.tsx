"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowLeft,
  Filter,
} from "lucide-react";

type Period = "today" | "week" | "month" | "year";

interface Student {
  id: string;
  name: string;
  surname: string;
  img?: string;
  class: {
    id: string;
    name: string;
    grade: {
      id: string;
      level: number;
    };
  };
}

interface AttendanceRecord {
  id: string;
  date: string;
  status: string;
  notes?: string;
  teacher: {
    name: string;
    surname: string;
  };
}

interface AttendanceStats {
  total: number;
  present: number;
  late: number;
  absent: number;
}

export default function ChildAttendancePage() {
  const [children, setChildren] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [period, setPeriod] = useState<Period>("month");
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState<AttendanceStats>({
    total: 0,
    present: 0,
    late: 0,
    absent: 0,
  });
  const [attendancePercentage, setAttendancePercentage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch children on mount
  useEffect(() => {
    fetchChildren();
  }, []);

  // Load attendance when student or period changes
  useEffect(() => {
    if (selectedStudent) {
      loadAttendance();
    }
  }, [selectedStudent, period]);

  const fetchChildren = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/daily-attendance/parent");
      const data = await response.json();
      
      if (data.success && data.students) {
        setChildren(data.students);
        if (data.students.length > 0) {
          setSelectedStudent(data.students[0].id);
        }
      }
    } catch (err) {
      setError("Failed to load children");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadAttendance = async () => {
    if (!selectedStudent) return;

    setLoading(true);
    try {
      const response = await fetch(
        `/api/daily-attendance/parent?studentId=${selectedStudent}&period=${period}`
      );
      const data = await response.json();
      
      if (data.success) {
        setRecords(data.records || []);
        setStats(data.stats || { total: 0, present: 0, late: 0, absent: 0 });
        setAttendancePercentage(data.attendancePercentage || 0);
      }
    } catch (error) {
      console.error("Failed to load attendance:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "present":
        return "bg-green-100 text-green-800 border-green-300";
      case "absent":
        return "bg-red-100 text-red-800 border-red-300";
      case "late":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "present":
        return <CheckCircle2 className="w-5 h-5" />;
      case "absent":
        return <XCircle className="w-5 h-5" />;
      case "late":
        return <AlertCircle className="w-5 h-5" />;
      default:
        return null;
    }
  };

  if (loading && children.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading attendance data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center bg-white p-8 rounded-2xl shadow-xl">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchChildren}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (children.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
        <div className="max-w-2xl mx-auto text-center bg-white p-12 rounded-2xl shadow-xl">
          <Calendar className="w-20 h-20 text-gray-400 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-gray-900 mb-4">No Children Found</h2>
          <p className="text-gray-600 text-lg mb-6">
            No children are registered under your account.
          </p>
          <Link
            href="/parent"
            className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const selectedStudentInfo = children.find((s) => s.id === selectedStudent);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-6 space-y-6">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-2xl p-6 md:p-8 text-white shadow-xl">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center space-x-4">
            <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-full p-3">
              <Calendar className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">Child Attendance</h1>
              <p className="text-blue-100 text-lg">
                Track your child's attendance records
              </p>
            </div>
          </div>
          {selectedStudentInfo && stats.total > 0 && (
            <div className="text-right bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-4">
              <div className="text-5xl font-bold">{attendancePercentage}%</div>
              <div className="text-blue-100 text-sm mt-1">Attendance Rate</div>
            </div>
          )}
        </div>
      </div>

      {/* Child Selector */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <label className="block text-sm font-semibold text-gray-700 mb-4">
          Select Child
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {children.map((student) => (
            <button
              key={student.id}
              onClick={() => setSelectedStudent(student.id)}
              className={`p-5 rounded-xl border-2 transition-all duration-200 flex items-center gap-4 ${
                selectedStudent === student.id
                  ? "border-blue-600 bg-gradient-to-r from-blue-50 to-purple-50 shadow-lg scale-105"
                  : "border-gray-200 hover:border-blue-300 hover:bg-blue-50 hover:scale-102"
              }`}
            >
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center overflow-hidden flex-shrink-0">
                {student.img ? (
                  <Image
                    src={student.img}
                    alt={student.name}
                    width={56}
                    height={56}
                    className="rounded-full object-cover"
                  />
                ) : (
                  <span className="text-xl font-bold text-white">
                    {student.name.charAt(0)}
                    {student.surname.charAt(0)}
                  </span>
                )}
              </div>
              <div className="text-left flex-1">
                <div className="font-semibold text-gray-900 text-lg">
                  {student.name} {student.surname}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  Grade {student.class.grade.level} - {student.class.name}
                </div>
              </div>
              {selectedStudent === student.id && (
                <CheckCircle2 className="w-6 h-6 text-blue-600 flex-shrink-0" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Period Filter */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <label className="flex items-center text-sm font-semibold text-gray-700">
            <Filter className="w-5 h-5 mr-2" />
            Time Period
          </label>
        </div>
        <div className="flex gap-3 flex-wrap">
          {(["today", "week", "month", "year"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                period === p
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg scale-105"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-102"
              }`}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading && selectedStudent ? (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading attendance records...</p>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-lg border-l-4 border-blue-500 p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600 font-medium mb-2">
                    Total Days
                  </div>
                  <div className="text-4xl font-bold text-gray-900">
                    {stats.total}
                  </div>
                </div>
                <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center">
                  <Calendar className="w-7 h-7 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg border-l-4 border-green-500 p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600 font-medium mb-2">
                    Present
                  </div>
                  <div className="text-4xl font-bold text-green-600">
                    {stats.present}
                  </div>
                </div>
                <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-7 h-7 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg border-l-4 border-yellow-500 p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600 font-medium mb-2">
                    Late
                  </div>
                  <div className="text-4xl font-bold text-yellow-600">
                    {stats.late}
                  </div>
                </div>
                <div className="w-14 h-14 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Clock className="w-7 h-7 text-yellow-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg border-l-4 border-red-500 p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600 font-medium mb-2">
                    Absent
                  </div>
                  <div className="text-4xl font-bold text-red-600">
                    {stats.absent}
                  </div>
                </div>
                <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center">
                  <XCircle className="w-7 h-7 text-red-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Attendance Records */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="px-6 py-5 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
              <h3 className="font-bold text-xl text-gray-900">
                Attendance History
                {selectedStudentInfo && (
                  <span className="text-blue-600">
                    {" "}
                    - {selectedStudentInfo.name} {selectedStudentInfo.surname}
                  </span>
                )}
              </h3>
            </div>

            {records.length === 0 ? (
              <div className="p-16 text-center">
                <Calendar className="w-20 h-20 text-gray-300 mx-auto mb-6" />
                <h4 className="text-2xl font-semibold text-gray-900 mb-3">
                  No Records Found
                </h4>
                <p className="text-gray-500 text-lg">
                  No attendance records found for this period.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {records.map((record) => (
                  <div
                    key={record.id}
                    className="p-6 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-200"
                  >
                    <div className="flex items-start justify-between flex-wrap gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-3 flex-wrap">
                          <span
                            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm border-2 ${getStatusColor(
                              record.status
                            )}`}
                          >
                            {getStatusIcon(record.status)}
                            {record.status}
                          </span>
                          <div className="font-semibold text-gray-900 text-lg flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-gray-500" />
                            {new Date(record.date).toLocaleDateString("en-US", {
                              weekday: "long",
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                          <span className="font-medium">
                            👨‍🏫 Marked by: {record.teacher.name}{" "}
                            {record.teacher.surname}
                          </span>
                        </div>
                        {record.notes && (
                          <div className="mt-3 text-sm text-gray-700 bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <span className="font-semibold">📝 Note:</span>{" "}
                            {record.notes}
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

      {/* Back Button */}
      <div className="text-center pb-6">
        <Link
          href="/parent"
          className="inline-flex items-center px-8 py-4 bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl border border-gray-200"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Parent Dashboard
        </Link>
      </div>
    </div>
  );
}
