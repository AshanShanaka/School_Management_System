"use client";

import { useState } from "react";
import {
  Calendar,
  Clock,
  Users,
  CheckCircle,
  XCircle,
  Save,
  BookOpen,
  ChevronRight,
  User,
  CheckSquare,
} from "lucide-react";

interface Student {
  id: string;
  name: string;
  status: "present" | "absent" | "late" | null;
}

interface TimetableLesson {
  id: string;
  subject: string;
  className: string;
  startTime: string;
  endTime: string;
  day: string;
  students: Student[];
}

// Mock timetable data for Teacher Kasun Silva
const MOCK_TIMETABLE: TimetableLesson[] = [
  {
    id: "lesson-1",
    subject: "Mathematics",
    className: "Grade 11 - Science A",
    startTime: "08:00 AM",
    endTime: "09:30 AM",
    day: "Monday",
    students: [
      { id: "1", name: "Nimal Perera", status: null },
      { id: "2", name: "Kasun Silva", status: null },
      { id: "3", name: "Nimali Fernando", status: null },
      { id: "4", name: "Tharindu Rajapaksa", status: null },
      { id: "5", name: "Sachini Wickramasinghe", status: null },
      { id: "6", name: "Dinesh Silva", status: null },
      { id: "7", name: "Kavindi Jayawardena", status: null },
      { id: "8", name: "Ruwan Bandara", status: null },
      { id: "9", name: "Madhavi Dissanayake", status: null },
      { id: "10", name: "Chathura Gunawardena", status: null },
    ],
  },
  {
    id: "lesson-2",
    subject: "Science",
    className: "Grade 11 - Science B",
    startTime: "10:00 AM",
    endTime: "11:30 AM",
    day: "Monday",
    students: [
      { id: "11", name: "Sanduni Rajapaksa", status: null },
      { id: "12", name: "Dilshan Perera", status: null },
      { id: "13", name: "Nethmi Silva", status: null },
      { id: "14", name: "Kavindu Fernando", status: null },
      { id: "15", name: "Anusha Jayasinghe", status: null },
      { id: "16", name: "Harsha Wickramasinghe", status: null },
      { id: "17", name: "Thilini Bandara", status: null },
      { id: "18", name: "Nuwan Dissanayake", status: null },
    ],
  },
  {
    id: "lesson-3",
    subject: "Mathematics",
    className: "Grade 11 - Science A",
    startTime: "01:00 PM",
    endTime: "02:30 PM",
    day: "Monday",
    students: [
      { id: "1", name: "Nimal Perera", status: null },
      { id: "2", name: "Kasun Silva", status: null },
      { id: "3", name: "Nimali Fernando", status: null },
      { id: "4", name: "Tharindu Rajapaksa", status: null },
      { id: "5", name: "Sachini Wickramasinghe", status: null },
      { id: "6", name: "Dinesh Silva", status: null },
      { id: "7", name: "Kavindi Jayawardena", status: null },
      { id: "8", name: "Ruwan Bandara", status: null },
      { id: "9", name: "Madhavi Dissanayake", status: null },
      { id: "10", name: "Chathura Gunawardena", status: null },
    ],
  },
];

// Days of the week
const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
];

export default function TeacherAttendanceDemo() {
  const [selectedDay, setSelectedDay] = useState<string>("Monday");
  const [selectedLesson, setSelectedLesson] = useState<TimetableLesson | null>(
    null
  );
  const [students, setStudents] = useState<Student[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const todayLessons = MOCK_TIMETABLE.filter(
    (lesson) => lesson.day === selectedDay
  );

  const handleSelectLesson = (lesson: TimetableLesson) => {
    setSelectedLesson(lesson);
    setStudents(lesson.students.map((s) => ({ ...s })));
    setSaved(false);
  };

  const handleAttendanceChange = (
    studentId: string,
    status: "present" | "absent" | "late"
  ) => {
    setStudents((prev) =>
      prev.map((student) =>
        student.id === studentId ? { ...student, status } : student
      )
    );
    setSaved(false);
  };

  const handleMarkAllPresent = () => {
    setStudents((prev) =>
      prev.map((student) => ({ ...student, status: "present" }))
    );
    setSaved(false);
  };

  const handleSaveAttendance = () => {
    setSaving(true);
    // Simulate API call
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      // Show success message
      alert(
        `Attendance saved successfully!\n\nClass: ${selectedLesson?.className}\nSubject: ${selectedLesson?.subject}\nTime: ${selectedLesson?.startTime} - ${selectedLesson?.endTime}`
      );
    }, 1000);
  };

  const getAttendanceSummary = () => {
    const present = students.filter((s) => s.status === "present").length;
    const absent = students.filter((s) => s.status === "absent").length;
    const late = students.filter((s) => s.status === "late").length;
    const notMarked = students.filter((s) => !s.status).length;
    return { present, absent, late, notMarked };
  };

  const summary = selectedLesson ? getAttendanceSummary() : null;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Attendance Management</h1>
            <p className="text-blue-100">Teacher: Kasun Silva</p>
          </div>
          <div className="text-right">
            <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
              <div className="text-sm text-blue-100">Today's Date</div>
              <div className="text-lg font-semibold">
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Day Selection */}
      <div className="bg-white rounded-lg border shadow-sm p-4">
        <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-600" />
          Select Day
        </h2>
        <div className="flex gap-2 flex-wrap">
          {DAYS.map((day) => (
            <button
              key={day}
              onClick={() => {
                setSelectedDay(day);
                setSelectedLesson(null);
                setStudents([]);
              }}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                selectedDay === day
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {day}
            </button>
          ))}
        </div>
      </div>

      {/* Today's Timetable */}
      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            {selectedDay}'s Timetable
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Click on a lesson to take attendance
          </p>
        </div>
        <div className="p-4">
          {todayLessons.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No lessons scheduled for {selectedDay}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {todayLessons.map((lesson) => (
                <button
                  key={lesson.id}
                  onClick={() => handleSelectLesson(lesson)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all hover:shadow-md ${
                    selectedLesson?.id === lesson.id
                      ? "border-blue-600 bg-blue-50"
                      : "border-gray-200 hover:border-blue-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-16 h-16 rounded-lg flex flex-col items-center justify-center ${
                          selectedLesson?.id === lesson.id
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        <Clock className="w-5 h-5 mb-1" />
                        <span className="text-xs font-medium">
                          {lesson.startTime.split(" ")[0]}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg">
                          {lesson.subject}
                        </h3>
                        <p className="text-gray-600">{lesson.className}</p>
                        <p className="text-sm text-gray-500 mt-1">
                          {lesson.startTime} - {lesson.endTime}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-gray-600">
                          <Users className="w-4 h-4" />
                          <span className="font-medium">
                            {lesson.students.length} Students
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Attendance Taking Section */}
      {selectedLesson && (
        <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <BookOpen className="w-6 h-6" />
                  {selectedLesson.subject} - {selectedLesson.className}
                </h2>
                <p className="text-blue-100 mt-1">
                  {selectedLesson.startTime} - {selectedLesson.endTime}
                </p>
              </div>
              {saved && (
                <div className="bg-green-500 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">Saved</span>
                </div>
              )}
            </div>
          </div>

          {/* Summary Statistics */}
          {summary && (
            <div className="grid grid-cols-4 gap-4 p-4 bg-gray-50 border-b">
              <div className="bg-white rounded-lg p-4 border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Students</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {students.length}
                    </p>
                  </div>
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Present</p>
                    <p className="text-2xl font-bold text-green-600">
                      {summary.present}
                    </p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Absent</p>
                    <p className="text-2xl font-bold text-red-600">
                      {summary.absent}
                    </p>
                  </div>
                  <XCircle className="w-8 h-8 text-red-600" />
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Late</p>
                    <p className="text-2xl font-bold text-yellow-600">
                      {summary.late}
                    </p>
                  </div>
                  <Clock className="w-8 h-8 text-yellow-600" />
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="p-4 bg-gray-50 border-b">
            <button
              onClick={handleMarkAllPresent}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center gap-2"
            >
              <CheckSquare className="w-4 h-4" />
              Mark All Present
            </button>
          </div>

          {/* Student List */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Student Name
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Attendance Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {students.map((student, index) => (
                  <tr
                    key={student.id}
                    className={`hover:bg-gray-50 ${
                      student.status === "present"
                        ? "bg-green-50"
                        : student.status === "absent"
                        ? "bg-red-50"
                        : student.status === "late"
                        ? "bg-yellow-50"
                        : ""
                    }`}
                  >
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                          <User className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {student.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            ID: {student.id}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() =>
                            handleAttendanceChange(student.id, "present")
                          }
                          className={`px-4 py-2 rounded-lg font-medium transition-all ${
                            student.status === "present"
                              ? "bg-green-600 text-white shadow-md"
                              : "bg-gray-100 text-gray-700 hover:bg-green-100"
                          }`}
                        >
                          <CheckCircle className="w-4 h-4 inline mr-1" />
                          Present
                        </button>
                        <button
                          onClick={() =>
                            handleAttendanceChange(student.id, "absent")
                          }
                          className={`px-4 py-2 rounded-lg font-medium transition-all ${
                            student.status === "absent"
                              ? "bg-red-600 text-white shadow-md"
                              : "bg-gray-100 text-gray-700 hover:bg-red-100"
                          }`}
                        >
                          <XCircle className="w-4 h-4 inline mr-1" />
                          Absent
                        </button>
                        <button
                          onClick={() =>
                            handleAttendanceChange(student.id, "late")
                          }
                          className={`px-4 py-2 rounded-lg font-medium transition-all ${
                            student.status === "late"
                              ? "bg-yellow-600 text-white shadow-md"
                              : "bg-gray-100 text-gray-700 hover:bg-yellow-100"
                          }`}
                        >
                          <Clock className="w-4 h-4 inline mr-1" />
                          Late
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Save Button */}
          <div className="p-6 bg-gray-50 border-t flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {summary && summary.notMarked > 0 && (
                <p className="text-amber-600 font-medium">
                  ⚠️ {summary.notMarked} student(s) not marked yet
                </p>
              )}
            </div>
            <button
              onClick={handleSaveAttendance}
              disabled={saving || (summary && summary.notMarked > 0)}
              className={`px-8 py-3 rounded-lg font-medium flex items-center gap-2 transition-all ${
                saving || (summary && summary.notMarked > 0)
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700 shadow-lg"
              }`}
            >
              {saving ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Save Attendance
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Instructions */}
      {!selectedLesson && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            How to Take Attendance
          </h3>
          <ol className="space-y-2 text-blue-800">
            <li className="flex items-start gap-2">
              <span className="font-bold">1.</span>
              <span>Select the day from the tabs above</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">2.</span>
              <span>Click on a lesson from your timetable</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">3.</span>
              <span>
                Mark each student as Present, Absent, or Late
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">4.</span>
              <span>
                Use "Mark All Present" for quick marking if everyone is present
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">5.</span>
              <span>Click "Save Attendance" when done</span>
            </li>
          </ol>
        </div>
      )}
    </div>
  );
}
