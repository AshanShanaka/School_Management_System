"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatClassDisplay } from "@/lib/formatters";
import Image from "next/image";

interface SubjectAttendanceFormProps {
  lessons: Array<{
    id: number;
    name: string;
    subject: { id: number; name: string };
    class: { id: number; name: string; grade: { level: number } };
    startTime: Date;
    endTime: Date;
    day: string;
  }>;
  students: Array<{
    id: string;
    name: string;
    surname: string;
    img?: string | null;
  }>;
  selectedLessonId: number | null;
  selectedDate: string;
  selectedLesson: {
    id: number;
    name: string;
    subject: { id: number; name: string };
    class: { id: number; name: string; grade: { level: number } };
  } | null;
  existingAttendance: Array<{
    id: number;
    studentId: string;
    present: boolean;
    date: Date;
  }>;
}

const SubjectAttendanceForm = ({
  lessons,
  students,
  selectedLessonId,
  selectedDate,
  selectedLesson,
  existingAttendance,
}: SubjectAttendanceFormProps) => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attendanceData, setAttendanceData] = useState<Record<string, boolean>>(
    () => {
      // Initialize with existing attendance data
      const initial: Record<string, boolean> = {};
      students.forEach((student) => {
        const existing = existingAttendance.find(
          (a) => a.studentId === student.id
        );
        initial[student.id] = existing?.present ?? true; // Default to present
      });
      return initial;
    }
  );

  const handleLessonChange = (lessonId: string) => {
    const params = new URLSearchParams();
    params.set("lessonId", lessonId);
    params.set("date", selectedDate);
    router.push(`/teacher/attendance/lesson?${params.toString()}`);
  };

  const handleDateChange = (date: string) => {
    const params = new URLSearchParams();
    if (selectedLessonId) params.set("lessonId", selectedLessonId.toString());
    params.set("date", date);
    router.push(`/teacher/attendance/lesson?${params.toString()}`);
  };

  const handleAttendanceChange = (studentId: string, present: boolean) => {
    setAttendanceData((prev) => ({
      ...prev,
      [studentId]: present,
    }));
  };

  const handleSubmit = async () => {
    if (!selectedLessonId) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/teacher/attendance/lesson", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          lessonId: selectedLessonId,
          date: selectedDate,
          attendance: Object.entries(attendanceData).map(
            ([studentId, present]) => ({
              studentId,
              present,
            })
          ),
        }),
      });

      if (response.ok) {
        alert("Attendance saved successfully!");
        router.refresh();
      } else {
        alert("Failed to save attendance");
      }
    } catch (error) {
      console.error("Error saving attendance:", error);
      alert("Error saving attendance");
    } finally {
      setIsSubmitting(false);
    }
  };

  const presentCount = Object.values(attendanceData).filter(Boolean).length;
  const absentCount = students.length - presentCount;

  return (
    <div className="space-y-6">
      {/* FILTERS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* LESSON SELECTOR */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Lesson
          </label>
          <select
            value={selectedLessonId || ""}
            onChange={(e) => handleLessonChange(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-lamaPurple focus:border-transparent"
          >
            <option value="">Choose a lesson</option>
            {lessons.map((lesson) => (
              <option key={lesson.id} value={lesson.id}>
                {lesson.subject.name} -{" "}
                {formatClassDisplay(
                  lesson.class.name,
                  lesson.class.grade.level
                )}
                (
                {lesson.startTime.toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
                )
              </option>
            ))}
          </select>
        </div>

        {/* DATE SELECTOR */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Date
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => handleDateChange(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-lamaPurple focus:border-transparent"
          />
        </div>
      </div>

      {selectedLessonId && selectedLesson && students.length > 0 && (
        <>
          {/* LESSON INFO */}
          <div className="bg-lamaSky p-4 rounded-md">
            <h2 className="text-lg font-semibold mb-2">
              {selectedLesson.subject.name} -{" "}
              {formatClassDisplay(
                selectedLesson.class.name,
                selectedLesson.class.grade.level
              )}
            </h2>
            <div className="flex gap-6 text-sm text-white">
              <div>
                <span className="font-medium">Total Students: </span>
                <span>{students.length}</span>
              </div>
              <div>
                <span className="font-medium text-green-200">Present: </span>
                <span className="text-green-200 font-bold">{presentCount}</span>
              </div>
              <div>
                <span className="font-medium text-red-200">Absent: </span>
                <span className="text-red-200 font-bold">{absentCount}</span>
              </div>
              <div>
                <span className="font-medium">Attendance Rate: </span>
                <span className="font-bold">
                  {students.length > 0
                    ? ((presentCount / students.length) * 100).toFixed(1)
                    : 0}
                  %
                </span>
              </div>
            </div>
          </div>

          {/* QUICK ACTIONS */}
          <div className="flex gap-3">
            <button
              onClick={() => {
                const newData: Record<string, boolean> = {};
                students.forEach((student) => {
                  newData[student.id] = true;
                });
                setAttendanceData(newData);
              }}
              className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
            >
              Mark All Present
            </button>
            <button
              onClick={() => {
                const newData: Record<string, boolean> = {};
                students.forEach((student) => {
                  newData[student.id] = false;
                });
                setAttendanceData(newData);
              }}
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
            >
              Mark All Absent
            </button>
          </div>

          {/* STUDENT LIST */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Students</h3>
            <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-md">
              {students.map((student, index) => (
                <div
                  key={student.id}
                  className={`flex items-center justify-between p-3 ${
                    index % 2 === 0 ? "bg-gray-50" : "bg-white"
                  } hover:bg-blue-50 transition-colors`}
                >
                  <div className="flex items-center gap-3">
                    <Image
                      src={student.img || "/noAvatar.png"}
                      alt=""
                      width={40}
                      height={40}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div>
                      <h4 className="font-medium">
                        {student.name} {student.surname}
                      </h4>
                      <p className="text-sm text-gray-500">ID: {student.id}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAttendanceChange(student.id, true)}
                      className={`px-4 py-2 rounded-md transition-colors ${
                        attendanceData[student.id]
                          ? "bg-green-500 text-white"
                          : "bg-gray-200 text-gray-700 hover:bg-green-100"
                      }`}
                    >
                      Present
                    </button>
                    <button
                      onClick={() => handleAttendanceChange(student.id, false)}
                      className={`px-4 py-2 rounded-md transition-colors ${
                        !attendanceData[student.id]
                          ? "bg-red-500 text-white"
                          : "bg-gray-200 text-gray-700 hover:bg-red-100"
                      }`}
                    >
                      Absent
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SUBMIT BUTTON */}
          <div className="flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-6 py-3 bg-lamaPurple text-white rounded-md hover:bg-lamaPurpleLight disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Saving..." : "Save Lesson Attendance"}
            </button>
          </div>
        </>
      )}

      {selectedLessonId && students.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>No students found in this class.</p>
        </div>
      )}

      {!selectedLessonId && (
        <div className="text-center py-8 text-gray-500">
          <p>Please select a lesson to take attendance.</p>
        </div>
      )}
    </div>
  );
};

export default SubjectAttendanceForm;
