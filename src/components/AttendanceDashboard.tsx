"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

interface AttendanceStats {
  totalStudents: number;
  presentToday: number;
  absentToday: number;
  lateToday: number;
  attendanceRate: number;
}

interface ClassAttendance {
  classId: number;
  className: string;
  gradeLevel: number;
  totalStudents: number;
  presentToday: number;
  absentToday: number;
  lateToday: number;
  attendanceRate: number;
}

interface AttendanceDashboardProps {
  overallStats: AttendanceStats;
  classStats: ClassAttendance[];
  userRole: string;
}

const AttendanceDashboard = ({
  overallStats,
  classStats,
  userRole,
}: AttendanceDashboardProps) => {
  const [showClassBreakdown, setShowClassBreakdown] = useState(false);

  const getAttendanceColor = (rate: number) => {
    if (rate >= 95) return "text-green-600 bg-green-100";
    if (rate >= 85) return "text-yellow-600 bg-yellow-100";
    return "text-red-600 bg-red-100";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "present":
        return "bg-green-500";
      case "absent":
        return "bg-red-500";
      case "late":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="bg-white p-6 rounded-md">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Attendance Overview</h2>
        <div className="text-sm text-gray-500">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </div>
      </div>

      {!showClassBreakdown ? (
        // OVERALL STATS VIEW
        <div className="space-y-6">
          {/* MAIN STATS CARDS */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                  <Image
                    src="/student.png"
                    alt=""
                    width={20}
                    height={20}
                    className="filter brightness-0 invert"
                  />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-blue-600">
                    {overallStats.totalStudents}
                  </h3>
                  <p className="text-sm text-gray-600">Total Students</p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                  <Image
                    src="/attendance.png"
                    alt=""
                    width={20}
                    height={20}
                    className="filter brightness-0 invert"
                  />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-green-600">
                    {overallStats.presentToday}
                  </h3>
                  <p className="text-sm text-gray-600">Present Today</p>
                </div>
              </div>
            </div>

            <div className="bg-red-50 p-4 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">!</span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-red-600">
                    {overallStats.absentToday}
                  </h3>
                  <p className="text-sm text-gray-600">Absent Today</p>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">⏰</span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-yellow-600">
                    {overallStats.lateToday}
                  </h3>
                  <p className="text-sm text-gray-600">Late Today</p>
                </div>
              </div>
            </div>
          </div>

          {/* ATTENDANCE RATE */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Overall Attendance Rate</h3>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${getAttendanceColor(
                  overallStats.attendanceRate
                )}`}
              >
                {overallStats.attendanceRate.toFixed(1)}%
              </span>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className="bg-green-500 h-4 rounded-full transition-all duration-300"
                style={{ width: `${overallStats.attendanceRate}%` }}
              ></div>
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex gap-3 flex-wrap">
            {userRole === "admin" && (
              <>
                <button
                  onClick={() => setShowClassBreakdown(true)}
                  className="bg-lamaPurple text-white px-4 py-2 rounded-md hover:bg-lamaPurpleLight transition-colors"
                >
                  View by Class
                </button>
                <Link href="/admin/attendance/take">
                  <button className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors">
                    Take Attendance
                  </button>
                </Link>
                <Link href="/admin/attendance/reports">
                  <button className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors">
                    View Reports
                  </button>
                </Link>
              </>
            )}

            {userRole === "teacher" && (
              <Link href="/teacher/attendance">
                <button className="bg-lamaSky text-white px-4 py-2 rounded-md hover:bg-lamaSkyLight transition-colors">
                  My Classes Attendance
                </button>
              </Link>
            )}
          </div>
        </div>
      ) : (
        // CLASS BREAKDOWN VIEW
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Attendance by Class</h3>
            <button
              onClick={() => setShowClassBreakdown(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ← Back to Overview
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left p-3 font-semibold">Class</th>
                  <th className="text-center p-3 font-semibold">Total</th>
                  <th className="text-center p-3 font-semibold">Present</th>
                  <th className="text-center p-3 font-semibold">Absent</th>
                  <th className="text-center p-3 font-semibold">Late</th>
                  <th className="text-center p-3 font-semibold">Rate</th>
                  <th className="text-center p-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {classStats.map((classData) => (
                  <tr
                    key={classData.classId}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-lamaSky rounded-full flex items-center justify-center">
                          <Image
                            src="/class.png"
                            alt=""
                            width={16}
                            height={16}
                          />
                        </div>
                        <div>
                          <div className="font-medium">
                            Grade {classData.gradeLevel}-{classData.className}
                          </div>
                          <div className="text-sm text-gray-500">
                            {classData.totalStudents} students
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="text-center p-3 font-medium">
                      {classData.totalStudents}
                    </td>
                    <td className="text-center p-3">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-sm bg-green-100 text-green-800">
                        {classData.presentToday}
                      </span>
                    </td>
                    <td className="text-center p-3">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-sm bg-red-100 text-red-800">
                        {classData.absentToday}
                      </span>
                    </td>
                    <td className="text-center p-3">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-sm bg-yellow-100 text-yellow-800">
                        {classData.lateToday}
                      </span>
                    </td>
                    <td className="text-center p-3">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-sm ${getAttendanceColor(
                          classData.attendanceRate
                        )}`}
                      >
                        {classData.attendanceRate.toFixed(1)}%
                      </span>
                    </td>
                    <td className="text-center p-3">
                      <div className="flex gap-2 justify-center">
                        <Link
                          href={`/list/attendance?classId=${classData.classId}`}
                        >
                          <button className="p-2 bg-blue-100 text-blue-600 rounded hover:bg-blue-200">
                            <Image
                              src="/view.png"
                              alt=""
                              width={16}
                              height={16}
                            />
                          </button>
                        </Link>
                        {userRole === "admin" && (
                          <Link
                            href={`/admin/attendance/take?classId=${classData.classId}`}
                          >
                            <button className="p-2 bg-green-100 text-green-600 rounded hover:bg-green-200">
                              <Image
                                src="/create.png"
                                alt=""
                                width={16}
                                height={16}
                              />
                            </button>
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceDashboard;
