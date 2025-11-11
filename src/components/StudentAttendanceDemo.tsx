"use client";

import { useState } from "react";
import {
  Calendar,
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  BarChart3,
  User,
} from "lucide-react";

interface AttendanceRecord {
  id: string;
  date: string;
  day: string;
  subject: string;
  teacher: string;
  status: "present" | "absent" | "late";
  time: string;
}

// Mock attendance data for student1
const MOCK_ATTENDANCE_DATA: AttendanceRecord[] = [
  // Week 1 - October 14-18, 2025
  { id: "1", date: "2025-10-14", day: "Monday", subject: "Mathematics", teacher: "Mr. Kasun Silva", status: "present", time: "08:00 AM" },
  { id: "2", date: "2025-10-14", day: "Monday", subject: "English", teacher: "Mrs. Nimal Perera", status: "present", time: "10:00 AM" },
  { id: "3", date: "2025-10-14", day: "Monday", subject: "Science", teacher: "Mr. Kasun Silva", status: "present", time: "01:00 PM" },
  
  { id: "4", date: "2025-10-15", day: "Tuesday", subject: "History", teacher: "Mrs. Sanduni Fernando", status: "present", time: "08:00 AM" },
  { id: "5", date: "2025-10-15", day: "Tuesday", subject: "Sinhala", teacher: "Mr. Ruwan Bandara", status: "present", time: "10:00 AM" },
  { id: "6", date: "2025-10-15", day: "Tuesday", subject: "Religion", teacher: "Mrs. Thilini Jayasinghe", status: "late", time: "01:00 PM" },
  
  { id: "7", date: "2025-10-16", day: "Wednesday", subject: "Mathematics", teacher: "Mr. Kasun Silva", status: "present", time: "08:00 AM" },
  { id: "8", date: "2025-10-16", day: "Wednesday", subject: "Science", teacher: "Mr. Kasun Silva", status: "present", time: "10:00 AM" },
  { id: "9", date: "2025-10-16", day: "Wednesday", subject: "English", teacher: "Mrs. Nimal Perera", status: "present", time: "01:00 PM" },
  
  { id: "10", date: "2025-10-17", day: "Thursday", subject: "Sinhala", teacher: "Mr. Ruwan Bandara", status: "present", time: "08:00 AM" },
  { id: "11", date: "2025-10-17", day: "Thursday", subject: "History", teacher: "Mrs. Sanduni Fernando", status: "absent", time: "10:00 AM" },
  { id: "12", date: "2025-10-17", day: "Thursday", subject: "Mathematics", teacher: "Mr. Kasun Silva", status: "present", time: "01:00 PM" },
  
  { id: "13", date: "2025-10-18", day: "Friday", subject: "Religion", teacher: "Mrs. Thilini Jayasinghe", status: "present", time: "08:00 AM" },
  { id: "14", date: "2025-10-18", day: "Friday", subject: "English", teacher: "Mrs. Nimal Perera", status: "present", time: "10:00 AM" },
  { id: "15", date: "2025-10-18", day: "Friday", subject: "Science", teacher: "Mr. Kasun Silva", status: "present", time: "01:00 PM" },

  // Week 2 - October 7-11, 2025
  { id: "16", date: "2025-10-07", day: "Monday", subject: "Mathematics", teacher: "Mr. Kasun Silva", status: "present", time: "08:00 AM" },
  { id: "17", date: "2025-10-07", day: "Monday", subject: "English", teacher: "Mrs. Nimal Perera", status: "present", time: "10:00 AM" },
  { id: "18", date: "2025-10-07", day: "Monday", subject: "Science", teacher: "Mr. Kasun Silva", status: "late", time: "01:00 PM" },
  
  { id: "19", date: "2025-10-08", day: "Tuesday", subject: "History", teacher: "Mrs. Sanduni Fernando", status: "present", time: "08:00 AM" },
  { id: "20", date: "2025-10-08", day: "Tuesday", subject: "Sinhala", teacher: "Mr. Ruwan Bandara", status: "present", time: "10:00 AM" },
  { id: "21", date: "2025-10-08", day: "Tuesday", subject: "Religion", teacher: "Mrs. Thilini Jayasinghe", status: "present", time: "01:00 PM" },
  
  { id: "22", date: "2025-10-09", day: "Wednesday", subject: "Mathematics", teacher: "Mr. Kasun Silva", status: "present", time: "08:00 AM" },
  { id: "23", date: "2025-10-09", day: "Wednesday", subject: "Science", teacher: "Mr. Kasun Silva", status: "present", time: "10:00 AM" },
  { id: "24", date: "2025-10-09", day: "Wednesday", subject: "English", teacher: "Mrs. Nimal Perera", status: "present", time: "01:00 PM" },
  
  { id: "25", date: "2025-10-10", day: "Thursday", subject: "Sinhala", teacher: "Mr. Ruwan Bandara", status: "present", time: "08:00 AM" },
  { id: "26", date: "2025-10-10", day: "Thursday", subject: "History", teacher: "Mrs. Sanduni Fernando", status: "present", time: "10:00 AM" },
  { id: "27", date: "2025-10-10", day: "Thursday", subject: "Mathematics", teacher: "Mr. Kasun Silva", status: "absent", time: "01:00 PM" },
  
  { id: "28", date: "2025-10-11", day: "Friday", subject: "Religion", teacher: "Mrs. Thilini Jayasinghe", status: "present", time: "08:00 AM" },
  { id: "29", date: "2025-10-11", day: "Friday", subject: "English", teacher: "Mrs. Nimal Perera", status: "present", time: "10:00 AM" },
  { id: "30", date: "2025-10-11", day: "Friday", subject: "Science", teacher: "Mr. Kasun Silva", status: "present", time: "01:00 PM" },
];

export default function StudentAttendanceDemo() {
  const [selectedMonth, setSelectedMonth] = useState<string>("October 2025");

  // Calculate statistics
  const totalClasses = MOCK_ATTENDANCE_DATA.length;
  const presentCount = MOCK_ATTENDANCE_DATA.filter((r) => r.status === "present").length;
  const absentCount = MOCK_ATTENDANCE_DATA.filter((r) => r.status === "absent").length;
  const lateCount = MOCK_ATTENDANCE_DATA.filter((r) => r.status === "late").length;
  const attendancePercentage = ((presentCount / totalClasses) * 100).toFixed(1);

  // Group by date for calendar view
  const groupedByDate = MOCK_ATTENDANCE_DATA.reduce((acc, record) => {
    if (!acc[record.date]) {
      acc[record.date] = [];
    }
    acc[record.date].push(record);
    return acc;
  }, {} as Record<string, AttendanceRecord[]>);

  const sortedDates = Object.keys(groupedByDate).sort().reverse();

  // Subject-wise attendance
  const subjectAttendance = MOCK_ATTENDANCE_DATA.reduce((acc, record) => {
    if (!acc[record.subject]) {
      acc[record.subject] = { present: 0, absent: 0, late: 0, total: 0 };
    }
    acc[record.subject].total++;
    if (record.status === "present") acc[record.subject].present++;
    if (record.status === "absent") acc[record.subject].absent++;
    if (record.status === "late") acc[record.subject].late++;
    return acc;
  }, {} as Record<string, { present: number; absent: number; late: number; total: number }>);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "present":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
            <CheckCircle className="w-3 h-3" />
            Present
          </span>
        );
      case "absent":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
            <XCircle className="w-3 h-3" />
            Absent
          </span>
        );
      case "late":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
            <Clock className="w-3 h-3" />
            Late
          </span>
        );
      default:
        return null;
    }
  };

  const getAttendanceColor = (percentage: number) => {
    if (percentage >= 90) return "text-green-600";
    if (percentage >= 75) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Attendance</h1>
            <p className="text-blue-100">Student: student1 - Grade 11 Science A</p>
          </div>
          <div className="text-right">
            <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
              <div className="text-sm text-blue-100">Current Month</div>
              <div className="text-lg font-semibold">{selectedMonth}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-sm text-gray-500">Total Classes</p>
              <p className="text-3xl font-bold text-gray-900">{totalClasses}</p>
            </div>
            <Calendar className="w-10 h-10 text-blue-600" />
          </div>
          <p className="text-xs text-gray-500 mt-2">This month</p>
        </div>

        <div className="bg-white rounded-lg border shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-sm text-gray-500">Present</p>
              <p className="text-3xl font-bold text-green-600">{presentCount}</p>
            </div>
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div
              className="bg-green-600 h-2 rounded-full"
              style={{ width: `${(presentCount / totalClasses) * 100}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-white rounded-lg border shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-sm text-gray-500">Absent</p>
              <p className="text-3xl font-bold text-red-600">{absentCount}</p>
            </div>
            <XCircle className="w-10 h-10 text-red-600" />
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div
              className="bg-red-600 h-2 rounded-full"
              style={{ width: `${(absentCount / totalClasses) * 100}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-white rounded-lg border shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-sm text-gray-500">Late</p>
              <p className="text-3xl font-bold text-yellow-600">{lateCount}</p>
            </div>
            <Clock className="w-10 h-10 text-yellow-600" />
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div
              className="bg-yellow-600 h-2 rounded-full"
              style={{ width: `${(lateCount / totalClasses) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Attendance Percentage */}
      <div className="bg-white rounded-lg border shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Overall Attendance</h2>
            <p className="text-sm text-gray-500">Your attendance performance</p>
          </div>
          <div className="text-right">
            <div className={`text-5xl font-bold ${getAttendanceColor(parseFloat(attendancePercentage))}`}>
              {attendancePercentage}%
            </div>
            <div className="flex items-center gap-1 mt-2">
              {parseFloat(attendancePercentage) >= 90 ? (
                <>
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-600 font-medium">Excellent</span>
                </>
              ) : parseFloat(attendancePercentage) >= 75 ? (
                <>
                  <AlertTriangle className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm text-yellow-600 font-medium">Good</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <span className="text-sm text-red-600 font-medium">Needs Improvement</span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className={`h-4 rounded-full transition-all ${
                parseFloat(attendancePercentage) >= 90
                  ? "bg-green-600"
                  : parseFloat(attendancePercentage) >= 75
                  ? "bg-yellow-600"
                  : "bg-red-600"
              }`}
              style={{ width: `${attendancePercentage}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>
      </div>

      {/* Subject-wise Attendance */}
      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            Subject-wise Attendance
          </h2>
          <p className="text-sm text-gray-500 mt-1">Attendance breakdown by subject</p>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {Object.entries(subjectAttendance).map(([subject, stats]) => {
              const percentage = ((stats.present / stats.total) * 100).toFixed(1);
              return (
                <div key={subject} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                        <span className="text-indigo-600 font-bold">{subject.charAt(0)}</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{subject}</h3>
                        <p className="text-sm text-gray-500">
                          {stats.present} / {stats.total} classes
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${getAttendanceColor(parseFloat(percentage))}`}>
                        {percentage}%
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="flex gap-3 text-xs">
                      <span className="text-green-600">✓ {stats.present}</span>
                      <span className="text-red-600">✗ {stats.absent}</span>
                      <span className="text-yellow-600">⏱ {stats.late}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Attendance History */}
      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Attendance History
          </h2>
          <p className="text-sm text-gray-500 mt-1">Daily attendance records</p>
        </div>
        <div className="p-6">
          <div className="space-y-6">
            {sortedDates.map((date) => {
              const records = groupedByDate[date];
              const dateObj = new Date(date);
              const dayRecords = records[0];
              
              return (
                <div key={date} className="border-l-4 border-blue-600 pl-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-blue-100 rounded-lg px-3 py-2">
                      <div className="text-xs text-blue-600 font-medium">
                        {dateObj.toLocaleDateString("en-US", { month: "short" })}
                      </div>
                      <div className="text-2xl font-bold text-blue-600">
                        {dateObj.getDate()}
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {dayRecords.day}, {dateObj.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                      </h3>
                      <p className="text-sm text-gray-500">{records.length} classes</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {records.map((record) => (
                      <div
                        key={record.id}
                        className="bg-gray-50 rounded-lg p-3 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                            <span className="text-purple-600 text-xs font-bold">
                              {record.subject.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{record.subject}</p>
                            <p className="text-xs text-gray-500">
                              {record.teacher} • {record.time}
                            </p>
                          </div>
                        </div>
                        {getStatusBadge(record.status)}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Attendance Guidelines */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
        <h3 className="font-bold text-amber-900 mb-3 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          Attendance Guidelines
        </h3>
        <ul className="space-y-2 text-amber-800 text-sm">
          <li className="flex items-start gap-2">
            <span className="font-bold">•</span>
            <span>Minimum 75% attendance required for exam eligibility</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold">•</span>
            <span>90% or above attendance considered excellent</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold">•</span>
            <span>Late arrivals count as 0.5 absence</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold">•</span>
            <span>Medical certificates required for extended absences</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
