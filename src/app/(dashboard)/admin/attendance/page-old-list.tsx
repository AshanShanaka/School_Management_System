"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import AttendanceCalendar from "@/components/AttendanceCalendar";

type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE";

interface Student {
  id: string;
  name: string;
  surname: string;
  img: string | null;
  status: AttendanceStatus;
  notes: string;
  attendanceId?: number | null;
}

interface ClassInfo {
  id: number;
  name: string;
  grade: {
    id: number;
    level: number;
  };
  classTeacher?: {
    id: string;
    name: string;
    surname: string;
  } | null;
}

interface ClassListItem {
  id: number;
  name: string;
  grade: {
    level: number;
  };
  classTeacher?: {
    name: string;
    surname: string;
  } | null;
  _count: {
    students: number;
  };
}

function AdminAttendancePage() {
  const router = useRouter();
  const [classList, setClassList] = useState<ClassListItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasExistingAttendance, setHasExistingAttendance] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "attendance">("list");

  useEffect(() => {
    loadClassList();
  }, []);

  useEffect(() => {
    if (selectedClassId && viewMode === "attendance") {
      loadAttendance();
    }
  }, [selectedClassId, date, viewMode]);

  const loadClassList = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/classes");
      const data = await response.json();
      
      if (Array.isArray(data)) {
        setClassList(data);
      }
    } catch (error) {
      console.error("Error loading class list:", error);
      alert("Failed to load class list");
    } finally {
      setLoading(false);
    }
  };

  const loadAttendance = async () => {
    if (!selectedClassId) return;

    try {
      setLoading(true);
      const response = await fetch(
        `/api/daily-attendance?classId=${selectedClassId}&date=${date}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load attendance");
      }

      setClassInfo(data.class);
      setStudents(
        data.students.map((s: any) => ({
          id: s.id,
          name: s.name,
          surname: s.surname,
          img: s.img,
          status: s.status || "PRESENT",
          notes: s.notes || "",
          attendanceId: s.attendanceId,
        }))
      );
      setHasExistingAttendance(data.hasExistingAttendance);
    } catch (error: any) {
      console.error("Error loading attendance:", error);
      alert(error.message || "Failed to load attendance data");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = (studentId: string, status: AttendanceStatus) => {
    setStudents(
      students.map((s) => (s.id === studentId ? { ...s, status } : s))
    );
  };

  const updateNotes = (studentId: string, notes: string) => {
    setStudents(students.map((s) => (s.id === studentId ? { ...s, notes } : s)));
  };

  const markAll = (status: AttendanceStatus) => {
    setStudents(students.map((s) => ({ ...s, status })));
  };

  const saveAttendance = async () => {
    try {
      setSaving(true);
      const response = await fetch("/api/daily-attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId: selectedClassId,
          date,
          attendance: students.map((s) => ({
            studentId: s.id,
            status: s.status,
            notes: s.notes,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save attendance");
      }

      alert("Attendance saved successfully!");
      await loadAttendance();
    } catch (error: any) {
      console.error("Error saving attendance:", error);
      alert(error.message || "Failed to save attendance");
    } finally {
      setSaving(false);
    }
  };

  const handleClassSelect = (classId: number) => {
    setSelectedClassId(classId);
    setViewMode("attendance");
  };

  const handleBackToList = () => {
    setViewMode("list");
    setSelectedClassId(null);
    setClassInfo(null);
    setStudents([]);
  };

  if (loading && viewMode === "list") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading classes...</div>
      </div>
    );
  }

  if (viewMode === "list") {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Attendance Management
          </h1>
          <p className="text-gray-600">
            Select a class to view or manage daily attendance
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
            <h2 className="text-xl font-semibold">All Classes</h2>
          </div>

          {classList.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <div className="text-6xl mb-4">🏫</div>
              <p className="text-lg">No classes found</p>
            </div>
          ) : (
            <div className="divide-y">
              {classList.map((classItem) => (
                <div
                  key={classItem.id}
                  className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => handleClassSelect(classItem.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-800 mb-1">
                        {classItem.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Grade {classItem.grade.level} • {classItem._count.students}{" "}
                        students
                      </p>
                      {classItem.classTeacher && (
                        <p className="text-sm text-blue-600 mt-1">
                          Class Teacher: {classItem.classTeacher.name}{" "}
                          {classItem.classTeacher.surname}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleClassSelect(classItem.id);
                        }}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Manage Attendance →
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Attendance view
  const stats = {
    present: students.filter((s) => s.status === "PRESENT").length,
    absent: students.filter((s) => s.status === "ABSENT").length,
    late: students.filter((s) => s.status === "LATE").length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading attendance...</div>
      </div>
    );
  }

  if (!classInfo) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-red-500">No class selected</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Back Button & Header */}
      <button
        onClick={handleBackToList}
        className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-2 font-medium"
      >
        ← Back to Class List
      </button>

      {/* Page Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">📋 Daily Attendance</h1>
        <p className="text-blue-100">
          Class {classInfo.name} - Grade {classInfo.grade.level} • {students.length} Students
        </p>
        {classInfo.classTeacher && (
          <p className="text-sm text-blue-200 mt-1">
            Class Teacher: {classInfo.classTeacher.name}{" "}
            {classInfo.classTeacher.surname}
          </p>
        )}
        {hasExistingAttendance && (
          <div className="mt-3 inline-flex items-center gap-2 bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm">
            <span className="text-green-300">✓</span>
            Attendance recorded for {new Date(date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </div>
        )}
      </div>

      {/* Calendar Week View */}
      <AttendanceCalendar selectedDate={date} onDateSelect={setDate} />

      {/* Attendance Content */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border-2 border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-green-700">{stats.present}</div>
                <div className="text-sm text-green-600 font-medium">Present</div>
              </div>
              <div className="text-4xl">✓</div>
            </div>
          </div>
          <div className="p-6 bg-gradient-to-br from-red-50 to-red-100 rounded-lg border-2 border-red-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-red-700">{stats.absent}</div>
                <div className="text-sm text-red-600 font-medium">Absent</div>
              </div>
              <div className="text-4xl">✗</div>
            </div>
          </div>
          <div className="p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg border-2 border-yellow-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-yellow-700">{stats.late}</div>
                <div className="text-sm text-yellow-600 font-medium">Late</div>
              </div>
              <div className="text-4xl">⏰</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => markAll("PRESENT")}
            className="px-6 py-3 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors font-medium flex items-center gap-2"
          >
            <span>✓</span> Mark All Present
          </button>
          <button
            onClick={() => markAll("ABSENT")}
            className="px-6 py-3 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-medium flex items-center gap-2"
          >
            <span>✗</span> Mark All Absent
          </button>
        </div>

        {/* Student List */}
        <div className="space-y-3 mb-6">
          {students.map((student) => (
            <div
              key={student.id}
              className="flex items-center gap-4 p-4 border-2 border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all"
            >
              <Image
                src={student.img || "/avatar.png"}
                alt={student.name}
                width={50}
                height={50}
                className="rounded-full ring-2 ring-gray-200"
              />
              <div className="flex-1">
                <div className="font-semibold text-gray-800">
                  {student.name} {student.surname}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => updateStatus(student.id, "PRESENT")}
                  className={`px-5 py-2 rounded-lg font-medium transition-all ${
                    student.status === "PRESENT"
                      ? "bg-green-600 text-white shadow-lg scale-105"
                      : "bg-gray-100 text-gray-700 hover:bg-green-50 hover:text-green-700"
                  }`}
                >
                  ✓ Present
                </button>
                <button
                  onClick={() => updateStatus(student.id, "ABSENT")}
                  className={`px-5 py-2 rounded-lg font-medium transition-all ${
                    student.status === "ABSENT"
                      ? "bg-red-600 text-white shadow-lg scale-105"
                      : "bg-gray-100 text-gray-700 hover:bg-red-50 hover:text-red-700"
                  }`}
                >
                  ✗ Absent
                </button>
                <button
                  onClick={() => updateStatus(student.id, "LATE")}
                  className={`px-5 py-2 rounded-lg font-medium transition-all ${
                    student.status === "LATE"
                      ? "bg-yellow-600 text-white shadow-lg scale-105"
                      : "bg-gray-100 text-gray-700 hover:bg-yellow-50 hover:text-yellow-700"
                  }`}
                >
                  ⏰ Late
                </button>
              </div>
              <input
                type="text"
                value={student.notes}
                onChange={(e) => updateNotes(student.id, e.target.value)}
                placeholder="Notes (optional)"
                className="w-64 px-4 py-2 border-2 border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4 pt-6 border-t-2 border-gray-200">
          <button
            onClick={handleBackToList}
            className="px-8 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={saveAttendance}
            disabled={saving}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium shadow-lg flex items-center gap-2"
          >
            <span>💾</span>
            {saving ? "Saving..." : "Save Attendance"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AdminAttendancePage;
