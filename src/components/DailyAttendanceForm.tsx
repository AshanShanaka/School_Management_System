"use client";

import { useState, useEffect } from "react";
import { toast } from "react-toastify";

interface Student {
  id: string;
  name: string;
  surname: string;
  present: boolean;
}

interface ClassData {
  id: number;
  name: string;
  grade: {
    level: number;
  };
}

interface AttendanceData {
  class: ClassData;
  students: Student[];
  date: string;
  hasExistingAttendance: boolean;
}

const DailyAttendanceForm = () => {
  const [attendanceData, setAttendanceData] = useState<AttendanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [notes, setNotes] = useState("");

  useEffect(() => {
    fetchAttendanceData();
  }, [selectedDate]);

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/teacher/daily-attendance?date=${selectedDate}`
      );
      const data = await response.json();

      if (data.success) {
        setAttendanceData(data);
      } else {
        toast.error(data.error || "Failed to load attendance data");
      }
    } catch (error) {
      console.error("Error fetching attendance data:", error);
      toast.error("Failed to load attendance data");
    } finally {
      setLoading(false);
    }
  };

  const toggleStudentAttendance = (studentId: string) => {
    if (!attendanceData) return;

    setAttendanceData((prev) => ({
      ...prev!,
      students: prev!.students.map((student) =>
        student.id === studentId
          ? { ...student, present: !student.present }
          : student
      ),
    }));
  };

  const markAllPresent = () => {
    if (!attendanceData) return;

    setAttendanceData((prev) => ({
      ...prev!,
      students: prev!.students.map((student) => ({
        ...student,
        present: true,
      })),
    }));
  };

  const markAllAbsent = () => {
    if (!attendanceData) return;

    setAttendanceData((prev) => ({
      ...prev!,
      students: prev!.students.map((student) => ({
        ...student,
        present: false,
      })),
    }));
  };

  const saveAttendance = async () => {
    if (!attendanceData) return;

    setSaving(true);
    try {
      const response = await fetch("/api/teacher/daily-attendance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          classId: attendanceData.class.id,
          date: selectedDate,
          attendance: attendanceData.students.map((student) => ({
            studentId: student.id,
            present: student.present,
          })),
          notes,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(result.message);
        fetchAttendanceData(); // Refresh data
      } else {
        toast.error(result.error || "Failed to save attendance");
      }
    } catch (error) {
      console.error("Error saving attendance:", error);
      toast.error("Failed to save attendance");
    } finally {
      setSaving(false);
    }
  };

  const isWeekend = (date: string) => {
    const day = new Date(date).getDay();
    return day === 0 || day === 6; // Sunday or Saturday
  };

  const presentCount = attendanceData?.students.filter((s) => s.present).length || 0;
  const absentCount = (attendanceData?.students.length || 0) - presentCount;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3">Loading attendance data...</span>
      </div>
    );
  }

  if (!attendanceData) {
    return (
      <div className="bg-red-50 border border-red-200 p-6 rounded-lg text-center">
        <h3 className="text-lg font-semibold text-red-800 mb-2">
          No Class Assignment
        </h3>
        <p className="text-red-700">
          You are not assigned as a class teacher. Only class teachers can take daily attendance.
        </p>
        <p className="text-sm text-red-600 mt-2">
          Please contact the administrator if you believe this is an error.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Daily Attendance</h1>
            <p className="text-gray-600">
              Class: {attendanceData.class.name} (Grade {attendanceData.class.grade.level})
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">
              {attendanceData.hasExistingAttendance && (
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                  Already Marked
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Date Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Date
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            max={new Date().toISOString().split("T")[0]}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {isWeekend(selectedDate) && (
            <p className="text-orange-600 text-sm mt-1">
              ⚠️ Weekend selected. Attendance is typically taken on weekdays only.
            </p>
          )}
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-blue-600">{attendanceData.students.length}</div>
            <div className="text-sm text-gray-600">Total Students</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-green-600">{presentCount}</div>
            <div className="text-sm text-gray-600">Present</div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-red-600">{absentCount}</div>
            <div className="text-sm text-gray-600">Absent</div>
          </div>
        </div>

        {/* Bulk Actions */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={markAllPresent}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
          >
            Mark All Present
          </button>
          <button
            onClick={markAllAbsent}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
          >
            Mark All Absent
          </button>
        </div>
      </div>

      {/* Students List */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">Student Attendance</h3>
        
        <div className="grid gap-3">
          {attendanceData.students.map((student) => (
            <div
              key={student.id}
              className={`flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                student.present
                  ? "border-green-200 bg-green-50 hover:bg-green-100"
                  : "border-red-200 bg-red-50 hover:bg-red-100"
              }`}
              onClick={() => toggleStudentAttendance(student.id)}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    student.present
                      ? "border-green-500 bg-green-500"
                      : "border-gray-300 bg-white"
                  }`}
                >
                  {student.present && (
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
                <div>
                  <div className="font-medium text-gray-900">
                    {student.name} {student.surname}
                  </div>
                </div>
              </div>
              <div
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  student.present
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {student.present ? "Present" : "Absent"}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">Notes (Optional)</h3>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add any notes about today's attendance..."
          rows={3}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={saveAttendance}
          disabled={saving}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {saving && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          )}
          {saving ? "Saving..." : "Save Attendance"}
        </button>
      </div>
    </div>
  );
};

export default DailyAttendanceForm;
