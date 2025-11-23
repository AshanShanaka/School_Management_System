"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE";

interface Student {
  id: string;
  name: string;
  surname: string;
  img: string | null;
  attendanceId: number | null;
  status: AttendanceStatus;
  notes: string | null;
}

interface ClassInfo {
  id: number;
  name: string;
  grade: {
    level: number;
  };
  classTeacher: {
    id: string;
    name: string;
    surname: string;
  } | null;
}

interface DailyAttendanceFormProps {
  initialClassId?: number;
  isAdmin?: boolean;
}

export default function DailyAttendanceForm({
  initialClassId,
  isAdmin = false,
}: DailyAttendanceFormProps) {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<
    Record<string, AttendanceStatus>
  >({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const [hasExistingAttendance, setHasExistingAttendance] = useState(false);

  // Fetch assigned class or use provided classId
  useEffect(() => {
    const fetchClassData = async () => {
      try {
        setLoading(true);
        
        let classId = initialClassId;

        // If no classId provided and not admin, get teacher's assigned class
        if (!classId && !isAdmin) {
          const classResponse = await fetch("/api/teacher/assigned-class");
          const classData = await classResponse.json();

          if (!classData.success || !classData.hasAssignedClass) {
            alert("You are not assigned as a class teacher for any class.");
            return;
          }

          classId = classData.class.id;
        }

        if (!classId) {
          return;
        }

        // Fetch attendance data for the class and date
        const response = await fetch(
          `/api/daily-attendance?classId=${classId}&date=${selectedDate}`
        );
        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || "Failed to fetch attendance data");
        }

        setClassInfo(data.class);
        setStudents(data.students);
        setCanEdit(data.canEdit);
        setHasExistingAttendance(data.hasExistingAttendance);

        // Initialize attendance state
        const initialAttendance: Record<string, AttendanceStatus> = {};
        const initialNotes: Record<string, string> = {};
        
        data.students.forEach((student: Student) => {
          initialAttendance[student.id] = student.status || "PRESENT";
          if (student.notes) {
            initialNotes[student.id] = student.notes;
          }
        });

        setAttendance(initialAttendance);
        setNotes(initialNotes);
      } catch (error) {
        console.error("Error fetching class data:", error);
        alert("Failed to load attendance data");
      } finally {
        setLoading(false);
      }
    };

    fetchClassData();
  }, [initialClassId, isAdmin, selectedDate]);

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  const handleNoteChange = (studentId: string, note: string) => {
    setNotes((prev) => ({
      ...prev,
      [studentId]: note,
    }));
  };

  const markAllPresent = () => {
    const allPresent: Record<string, AttendanceStatus> = {};
    students.forEach((student) => {
      allPresent[student.id] = "PRESENT";
    });
    setAttendance(allPresent);
  };

  const markAllAbsent = () => {
    const allAbsent: Record<string, AttendanceStatus> = {};
    students.forEach((student) => {
      allAbsent[student.id] = "ABSENT";
    });
    setAttendance(allAbsent);
  };

  const handleSave = async () => {
    if (!classInfo) return;

    try {
      setSaving(true);

      const attendanceData = students.map((student) => ({
        studentId: student.id,
        status: attendance[student.id] || "PRESENT",
        notes: notes[student.id] || null,
      }));

      const response = await fetch("/api/daily-attendance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          classId: classInfo.id,
          date: selectedDate,
          attendance: attendanceData,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to save attendance");
      }

      alert(`✓ Attendance saved successfully! (${result.recordsUpdated} students)`);
      router.refresh();
    } catch (error) {
      console.error("Error saving attendance:", error);
      alert("Failed to save attendance. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status: AttendanceStatus) => {
    switch (status) {
      case "PRESENT":
        return "bg-green-100 text-green-800 border-green-300";
      case "ABSENT":
        return "bg-red-100 text-red-800 border-red-300";
      case "LATE":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getStatusIcon = (status: AttendanceStatus) => {
    switch (status) {
      case "PRESENT":
        return "✓";
      case "ABSENT":
        return "✗";
      case "LATE":
        return "⏰";
      default:
        return "?";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading attendance data...</p>
        </div>
      </div>
    );
  }

  if (!classInfo) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-yellow-800 mb-2">
          No Class Assigned
        </h3>
        <p className="text-yellow-700">
          You are not assigned as a class teacher for any class. Please contact
          the administrator.
        </p>
      </div>
    );
  }

  const presentCount = Object.values(attendance).filter(
    (s) => s === "PRESENT"
  ).length;
  const absentCount = Object.values(attendance).filter(
    (s) => s === "ABSENT"
  ).length;
  const lateCount = Object.values(attendance).filter(
    (s) => s === "LATE"
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold mb-2">Daily Attendance</h1>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-blue-100">
              <span className="font-semibold">Class:</span> Grade{" "}
              {classInfo.grade.level} - {classInfo.name}
            </p>
            {classInfo.classTeacher && (
              <p className="text-blue-100 text-sm">
                <span className="font-semibold">Class Teacher:</span>{" "}
                {classInfo.classTeacher.name} {classInfo.classTeacher.surname}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm text-blue-100 mb-1">Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              max={new Date().toISOString().split("T")[0]}
              className="px-4 py-2 rounded-lg text-gray-800 font-medium"
              disabled={!canEdit}
            />
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
          <div className="text-sm text-gray-600">Total Students</div>
          <div className="text-2xl font-bold text-gray-800">
            {students.length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
          <div className="text-sm text-gray-600">Present</div>
          <div className="text-2xl font-bold text-green-600">
            {presentCount}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-yellow-500">
          <div className="text-sm text-gray-600">Late</div>
          <div className="text-2xl font-bold text-yellow-600">{lateCount}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-red-500">
          <div className="text-sm text-gray-600">Absent</div>
          <div className="text-2xl font-bold text-red-600">{absentCount}</div>
        </div>
      </div>

      {/* Quick Actions */}
      {canEdit && (
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold text-gray-800 mb-3">Quick Actions</h3>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={markAllPresent}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Mark All Present
            </button>
            <button
              onClick={markAllAbsent}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Mark All Absent
            </button>
          </div>
        </div>
      )}

      {/* Read-only message */}
      {!canEdit && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800">
            <span className="font-semibold">View Only:</span> You can view
            attendance but cannot make changes to this class.
          </p>
        </div>
      )}

      {/* Student List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b">
          <h3 className="font-semibold text-gray-800">
            Student Attendance ({students.length} students)
          </h3>
        </div>

        <div className="divide-y">
          {students.map((student, index) => (
            <div
              key={student.id}
              className={`p-4 ${index % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-blue-50 transition-colors`}
            >
              <div className="flex items-center justify-between gap-4 flex-wrap">
                {/* Student Info */}
                <div className="flex items-center gap-3 flex-1 min-w-[200px]">
                  <Image
                    src={student.img || "/noAvatar.png"}
                    alt={`${student.name} ${student.surname}`}
                    width={48}
                    height={48}
                    className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                  />
                  <div>
                    <div className="font-medium text-gray-900">
                      {student.name} {student.surname}
                    </div>
                    <div className="text-sm text-gray-500">ID: {student.id.slice(-8)}</div>
                  </div>
                </div>

                {/* Status Buttons */}
                <div className="flex gap-2">
                  {(["PRESENT", "LATE", "ABSENT"] as AttendanceStatus[]).map(
                    (status) => (
                      <button
                        key={status}
                        onClick={() => handleStatusChange(student.id, status)}
                        disabled={!canEdit}
                        className={`px-4 py-2 rounded-lg font-medium transition-all border-2 ${
                          attendance[student.id] === status
                            ? getStatusColor(status) + " shadow-md scale-105"
                            : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
                        } ${!canEdit ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                      >
                        <span className="mr-1">{getStatusIcon(status)}</span>
                        {status.charAt(0) + status.slice(1).toLowerCase()}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Notes */}
              {canEdit && (
                <div className="mt-3">
                  <input
                    type="text"
                    placeholder="Add notes (optional)..."
                    value={notes[student.id] || ""}
                    onChange={(e) => handleNoteChange(student.id, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}
              {!canEdit && student.notes && (
                <div className="mt-2 text-sm text-gray-600 italic">
                  Note: {student.notes}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Save Button */}
      {canEdit && (
        <div className="flex justify-end gap-3">
          <button
            onClick={() => router.back()}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Saving...
              </>
            ) : (
              <>
                <span>💾</span>
                Save Attendance
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
