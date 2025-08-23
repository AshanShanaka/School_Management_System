"use client";

import { useState, useEffect } from "react";
import { formatClassDisplay } from "@/lib/formatters";
import Image from "next/image";

interface AttendanceReport {
  studentId: string;
  studentName: string;
  className: string;
  totalLessons: number;
  presentLessons: number;
  absentLessons: number;
  lateCount: number;
  attendanceRate: number;
  subjectWiseAttendance: {
    subjectName: string;
    present: number;
    total: number;
    rate: number;
  }[];
}

interface AttendanceReportsProps {
  userRole: string;
}

const AttendanceReports = ({ userRole }: AttendanceReportsProps) => {
  const [reportType, setReportType] = useState<
    "daily" | "weekly" | "monthly" | "yearly"
  >("monthly");
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const [selectedStudent, setSelectedStudent] = useState<string>("all");
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  });
  const [reports, setReports] = useState<AttendanceReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState<
    Array<{ id: number; name: string; grade: { level: number } }>
  >([]);
  const [subjects, setSubjects] = useState<Array<{ id: number; name: string }>>(
    []
  );
  const [students, setStudents] = useState<
    Array<{ id: string; name: string; surname: string }>
  >([]);

  useEffect(() => {
    fetchFilterOptions();
  }, []);

  useEffect(() => {
    fetchReports();
  }, [reportType, selectedClass, selectedSubject, selectedStudent, dateRange]);

  const fetchFilterOptions = async () => {
    try {
      // Fetch classes, subjects, and students for filters
      const [classesRes, subjectsRes, studentsRes] = await Promise.all([
        fetch("/api/admin/attendance/classes"),
        fetch("/api/admin/attendance/subjects"),
        fetch("/api/admin/attendance/students"),
      ]);

      if (classesRes.ok) setClasses(await classesRes.json());
      if (subjectsRes.ok) setSubjects(await subjectsRes.json());
      if (studentsRes.ok) setStudents(await studentsRes.json());
    } catch (error) {
      console.error("Error fetching filter options:", error);
    }
  };

  const fetchReports = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        type: reportType,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        ...(selectedClass !== "all" && { classId: selectedClass }),
        ...(selectedSubject !== "all" && { subjectId: selectedSubject }),
        ...(selectedStudent !== "all" && { studentId: selectedStudent }),
      });

      const response = await fetch(`/api/admin/attendance/reports?${params}`);
      if (response.ok) {
        const data = await response.json();
        setReports(data.reports || []);
      }
    } catch (error) {
      console.error("Error fetching reports:", error);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const headers = [
      "Student Name",
      "Class",
      "Total Lessons",
      "Present",
      "Absent",
      "Late",
      "Attendance Rate (%)",
    ];

    const csvData = reports.map((report) => [
      report.studentName,
      report.className,
      report.totalLessons,
      report.presentLessons,
      report.absentLessons,
      report.lateCount,
      report.attendanceRate.toFixed(2),
    ]);

    const csvContent = [headers, ...csvData]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `attendance_report_${reportType}_${
      new Date().toISOString().split("T")[0]
    }.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const getAttendanceColor = (rate: number) => {
    if (rate >= 95) return "text-green-600 bg-green-100";
    if (rate >= 85) return "text-yellow-600 bg-yellow-100";
    return "text-red-600 bg-red-100";
  };

  return (
    <div className="bg-white p-6 rounded-md">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Attendance Reports</h2>
        <button
          onClick={exportToCSV}
          className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors"
        >
          Export CSV
        </button>
      </div>

      {/* FILTERS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Report Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Report Type
          </label>
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value as any)}
            className="w-full p-2 border border-gray-300 rounded-md"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>

        {/* Class Filter */}
        {userRole === "admin" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Class
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="all">All Classes</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {formatClassDisplay(cls.name, cls.grade.level)}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Subject Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Subject
          </label>
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
          >
            <option value="all">All Subjects</option>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>
        </div>

        {/* Student Filter */}
        {userRole === "admin" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Student
            </label>
            <select
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="all">All Students</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name} {student.surname}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Date Range */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Start Date
          </label>
          <input
            type="date"
            value={dateRange.startDate}
            onChange={(e) =>
              setDateRange({ ...dateRange, startDate: e.target.value })
            }
            className="w-full p-2 border border-gray-300 rounded-md"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            End Date
          </label>
          <input
            type="date"
            value={dateRange.endDate}
            onChange={(e) =>
              setDateRange({ ...dateRange, endDate: e.target.value })
            }
            className="w-full p-2 border border-gray-300 rounded-md"
          />
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-lamaPurple mx-auto"></div>
          <p className="text-gray-500 mt-2">Loading reports...</p>
        </div>
      )}

      {/* Reports Table */}
      {!loading && reports.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-200 p-3 text-left">
                  Student
                </th>
                <th className="border border-gray-200 p-3 text-left">Class</th>
                <th className="border border-gray-200 p-3 text-center">
                  Total Lessons
                </th>
                <th className="border border-gray-200 p-3 text-center">
                  Present
                </th>
                <th className="border border-gray-200 p-3 text-center">
                  Absent
                </th>
                <th className="border border-gray-200 p-3 text-center">Late</th>
                <th className="border border-gray-200 p-3 text-center">
                  Attendance Rate
                </th>
                <th className="border border-gray-200 p-3 text-center">
                  Subject-wise
                </th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report.studentId} className="hover:bg-gray-50">
                  <td className="border border-gray-200 p-3">
                    {report.studentName}
                  </td>
                  <td className="border border-gray-200 p-3">
                    {report.className}
                  </td>
                  <td className="border border-gray-200 p-3 text-center">
                    {report.totalLessons}
                  </td>
                  <td className="border border-gray-200 p-3 text-center">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-sm bg-green-100 text-green-800">
                      {report.presentLessons}
                    </span>
                  </td>
                  <td className="border border-gray-200 p-3 text-center">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-sm bg-red-100 text-red-800">
                      {report.absentLessons}
                    </span>
                  </td>
                  <td className="border border-gray-200 p-3 text-center">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-sm bg-yellow-100 text-yellow-800">
                      {report.lateCount}
                    </span>
                  </td>
                  <td className="border border-gray-200 p-3 text-center">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-sm ${getAttendanceColor(
                        report.attendanceRate
                      )}`}
                    >
                      {report.attendanceRate.toFixed(1)}%
                    </span>
                  </td>
                  <td className="border border-gray-200 p-3">
                    <div className="space-y-1">
                      {report.subjectWiseAttendance.map((subject, index) => (
                        <div key={index} className="text-xs">
                          <span className="font-medium">
                            {subject.subjectName}:
                          </span>{" "}
                          <span
                            className={
                              getAttendanceColor(subject.rate).split(" ")[0]
                            }
                          >
                            {subject.rate.toFixed(1)}%
                          </span>
                          <span className="text-gray-500">
                            {" "}
                            ({subject.present}/{subject.total})
                          </span>
                        </div>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* No Data */}
      {!loading && reports.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>No attendance data found for the selected criteria.</p>
        </div>
      )}
    </div>
  );
};

export default AttendanceReports;
