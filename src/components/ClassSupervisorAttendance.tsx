"use client";

import { useState, useEffect } from "react";
import { formatClassDisplay } from "@/lib/formatters";
import Image from "next/image";
import Link from "next/link";

interface ClassSupervisorAttendanceProps {
  classId: number;
  className: string;
  gradeLevel: number;
}

interface StudentAttendanceData {
  studentId: string;
  studentName: string;
  overallAttendanceRate: number;
  monthlyAttendanceRate: number;
  weeklyAttendanceRate: number;
  lastSeenDate: string;
  totalAbsences: number;
  consecutiveAbsences: number;
  alertLevel: "none" | "warning" | "critical";
}

const ClassSupervisorAttendance = ({
  classId,
  className,
  gradeLevel,
}: ClassSupervisorAttendanceProps) => {
  const [studentData, setStudentData] = useState<StudentAttendanceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<
    "weekly" | "monthly" | "overall"
  >("monthly");

  useEffect(() => {
    fetchClassAttendanceData();
  }, [classId, selectedPeriod]);

  const fetchClassAttendanceData = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/teacher/class-attendance?classId=${classId}&period=${selectedPeriod}`
      );
      if (response.ok) {
        const data = await response.json();
        setStudentData(data.students || []);
      }
    } catch (error) {
      console.error("Error fetching class attendance data:", error);
    } finally {
      setLoading(false);
    }
  };

  const sendAbsenceAlert = async (studentId: string) => {
    try {
      const response = await fetch("/api/teacher/send-absence-alert", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          studentId,
          classId,
        }),
      });

      if (response.ok) {
        alert("Absence alert sent to parents successfully!");
      } else {
        alert("Failed to send absence alert.");
      }
    } catch (error) {
      console.error("Error sending absence alert:", error);
      alert("Error sending absence alert.");
    }
  };

  const getAlertColor = (alertLevel: string) => {
    switch (alertLevel) {
      case "critical":
        return "bg-red-100 text-red-800 border-red-200";
      case "warning":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-green-100 text-green-800 border-green-200";
    }
  };

  const getAttendanceColor = (rate: number) => {
    if (rate >= 95) return "text-green-600";
    if (rate >= 85) return "text-yellow-600";
    return "text-red-600";
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-lamaPurple mx-auto"></div>
        <p className="text-gray-500 mt-2">Loading class attendance data...</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-md">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">
          Class Supervisor Dashboard -{" "}
          {formatClassDisplay(className, gradeLevel)}
        </h2>
        <div className="flex gap-2">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as any)}
            className="p-2 border border-gray-300 rounded-md"
          >
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="overall">Overall</option>
          </select>
          <Link href={`/admin/attendance/take?classId=${classId}`}>
            <button className="bg-lamaPurple text-white px-4 py-2 rounded-md hover:bg-lamaPurpleLight">
              Take Attendance
            </button>
          </Link>
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-blue-600">Total Students</h3>
          <p className="text-2xl font-bold text-blue-900">
            {studentData.length}
          </p>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-yellow-600">
            Need Attention
          </h3>
          <p className="text-2xl font-bold text-yellow-900">
            {studentData.filter((s) => s.alertLevel === "warning").length}
          </p>
        </div>
        <div className="bg-red-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-red-600">
            Critical Absences
          </h3>
          <p className="text-2xl font-bold text-red-900">
            {studentData.filter((s) => s.alertLevel === "critical").length}
          </p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-green-600">
            Good Attendance
          </h3>
          <p className="text-2xl font-bold text-green-900">
            {studentData.filter((s) => s.overallAttendanceRate >= 95).length}
          </p>
        </div>
      </div>

      {/* STUDENT LIST */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left p-3 font-semibold">Student</th>
              <th className="text-center p-3 font-semibold">Overall Rate</th>
              <th className="text-center p-3 font-semibold">
                {selectedPeriod.charAt(0).toUpperCase() +
                  selectedPeriod.slice(1)}{" "}
                Rate
              </th>
              <th className="text-center p-3 font-semibold">Total Absences</th>
              <th className="text-center p-3 font-semibold">Consecutive</th>
              <th className="text-center p-3 font-semibold">Last Seen</th>
              <th className="text-center p-3 font-semibold">Status</th>
              <th className="text-center p-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {studentData.map((student) => (
              <tr
                key={student.studentId}
                className="border-b border-gray-100 hover:bg-gray-50"
              >
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-lamaSky rounded-full flex items-center justify-center">
                      <Image src="/student.png" alt="" width={16} height={16} />
                    </div>
                    <div>
                      <div className="font-medium">{student.studentName}</div>
                      <div className="text-sm text-gray-500">
                        ID: {student.studentId}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="text-center p-3">
                  <span
                    className={`font-bold ${getAttendanceColor(
                      student.overallAttendanceRate
                    )}`}
                  >
                    {student.overallAttendanceRate.toFixed(1)}%
                  </span>
                </td>
                <td className="text-center p-3">
                  <span
                    className={`font-bold ${getAttendanceColor(
                      student.monthlyAttendanceRate
                    )}`}
                  >
                    {student.monthlyAttendanceRate.toFixed(1)}%
                  </span>
                </td>
                <td className="text-center p-3">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-sm bg-gray-100 text-gray-800">
                    {student.totalAbsences}
                  </span>
                </td>
                <td className="text-center p-3">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-sm ${
                      student.consecutiveAbsences > 3
                        ? "bg-red-100 text-red-800"
                        : student.consecutiveAbsences > 1
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    {student.consecutiveAbsences}
                  </span>
                </td>
                <td className="text-center p-3 text-sm text-gray-600">
                  {new Date(student.lastSeenDate).toLocaleDateString()}
                </td>
                <td className="text-center p-3">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-sm border ${getAlertColor(
                      student.alertLevel
                    )}`}
                  >
                    {student.alertLevel === "critical"
                      ? "Critical"
                      : student.alertLevel === "warning"
                      ? "Warning"
                      : "Good"}
                  </span>
                </td>
                <td className="text-center p-3">
                  <div className="flex gap-2 justify-center">
                    <Link href={`/list/students/${student.studentId}`}>
                      <button className="p-2 bg-blue-100 text-blue-600 rounded hover:bg-blue-200">
                        <Image src="/view.png" alt="" width={16} height={16} />
                      </button>
                    </Link>
                    {student.alertLevel !== "none" && (
                      <button
                        onClick={() => sendAbsenceAlert(student.studentId)}
                        className="p-2 bg-orange-100 text-orange-600 rounded hover:bg-orange-200"
                        title="Send absence alert to parents"
                      >
                        <Image src="/mail.png" alt="" width={16} height={16} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {studentData.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>No attendance data found for this class.</p>
        </div>
      )}
    </div>
  );
};

export default ClassSupervisorAttendance;
