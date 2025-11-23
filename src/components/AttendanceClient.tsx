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
  status: AttendanceStatus;
  notes: string;
}

export default function AttendanceClient() {
  const router = useRouter();
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [classInfo, setClassInfo] = useState<any>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadAttendance();
  }, [date]);

  const loadAttendance = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/attendance?date=${date}`);
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 403) {
          alert(data.error || "You are not assigned as a class teacher");
          router.push("/teacher");
          return;
        }
        throw new Error(data.error || "Failed to load attendance");
      }

      setClassInfo(data.class);
      setStudents(data.students);
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
      const response = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
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
    } catch (error: any) {
      console.error("Error saving attendance:", error);
      alert(error.message || "Failed to save attendance");
    } finally {
      setSaving(false);
    }
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
        <div className="text-xl text-red-500">No class assigned</div>
      </div>
    );
  }

  const stats = {
    present: students.filter((s) => s.status === "PRESENT").length,
    absent: students.filter((s) => s.status === "ABSENT").length,
    late: students.filter((s) => s.status === "LATE").length,
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Daily Attendance</h1>
        <p className="text-gray-600">
          Class {classInfo.name} - Grade {classInfo.grade}
        </p>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Date</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="px-4 py-2 border rounded"
        />
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-green-50 rounded">
          <div className="text-2xl font-bold text-green-600">{stats.present}</div>
          <div className="text-sm text-gray-600">Present</div>
        </div>
        <div className="p-4 bg-red-50 rounded">
          <div className="text-2xl font-bold text-red-600">{stats.absent}</div>
          <div className="text-sm text-gray-600">Absent</div>
        </div>
        <div className="p-4 bg-yellow-50 rounded">
          <div className="text-2xl font-bold text-yellow-600">{stats.late}</div>
          <div className="text-sm text-gray-600">Late</div>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => markAll("PRESENT")}
          className="px-4 py-2 bg-green-100 text-green-700 rounded hover:bg-green-200"
        >
          Mark All Present
        </button>
        <button
          onClick={() => markAll("ABSENT")}
          className="px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200"
        >
          Mark All Absent
        </button>
      </div>

      <div className="space-y-4 mb-6">
        {students.map((student) => (
          <div
            key={student.id}
            className="flex items-center gap-4 p-4 border rounded hover:bg-gray-50"
          >
            <Image
              src={student.img || "/avatar.png"}
              alt={student.name}
              width={50}
              height={50}
              className="rounded-full"
            />
            <div className="flex-1">
              <div className="font-medium">
                {student.name} {student.surname}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => updateStatus(student.id, "PRESENT")}
                className={`px-4 py-2 rounded ${
                  student.status === "PRESENT"
                    ? "bg-green-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Present
              </button>
              <button
                onClick={() => updateStatus(student.id, "ABSENT")}
                className={`px-4 py-2 rounded ${
                  student.status === "ABSENT"
                    ? "bg-red-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Absent
              </button>
              <button
                onClick={() => updateStatus(student.id, "LATE")}
                className={`px-4 py-2 rounded ${
                  student.status === "LATE"
                    ? "bg-yellow-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Late
              </button>
            </div>
            <input
              type="text"
              value={student.notes}
              onChange={(e) => updateNotes(student.id, e.target.value)}
              placeholder="Notes (optional)"
              className="w-48 px-3 py-2 border rounded text-sm"
            />
          </div>
        ))}
      </div>

      <div className="flex justify-end gap-4">
        <button
          onClick={() => router.push("/teacher")}
          className="px-8 py-3 border rounded hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={saveAttendance}
          disabled={saving}
          className="px-8 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Attendance"}
        </button>
      </div>
    </div>
  );
}
