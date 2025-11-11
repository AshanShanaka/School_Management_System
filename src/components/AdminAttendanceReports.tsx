"use client";

import { useState, useEffect } from "react";
import { toast } from "react-toastify";

interface AttendanceReport {
  classId: number;
  className: string;
  gradeLevel: number;
  totalStudents: number;
  presentToday: number;
  absentToday: number;
  attendanceRate: number;
  hasAttendanceData: boolean;
}

interface AttendanceStats {
  totalClasses: number;
  totalStudents: number;
  totalPresent: number;
  totalAbsent: number;
  overallAttendanceRate: number;
}

const AdminAttendanceReports = () => {
  const [reports, setReports] = useState<AttendanceReport[]>([]);
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  useEffect(() => {
    fetchAttendanceReports();
  }, [selectedDate]);

  const fetchAttendanceReports = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/admin/attendance/daily-reports?date=${selectedDate}`
      );
      const data = await response.json();

      if (data.success) {
        setReports(data.reports || []);
        setStats(data.stats || null);
      } else {
        toast.error("Failed to load attendance reports");
      }
    } catch (error) {
      console.error("Error fetching attendance reports:", error);
      toast.error("Failed to load attendance reports");
    } finally {
      setLoading(false);
    }
  };

  const getAttendanceColor = (rate: number) => {
    if (rate >= 90) return "text-green-600 bg-green-50";
    if (rate >= 75) return "text-yellow-600 bg-yellow-50";
    return "text-red-600 bg-red-50";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3">Loading attendance reports...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Attendance Reports</h1>
            <p className="text-gray-600">
              View and analyze daily attendance across all classes
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                max={new Date().toISOString().split("T")[0]}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Overall Statistics */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.totalClasses}</div>
              <div className="text-sm text-gray-600">Total Classes</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-gray-600">{stats.totalStudents}</div>
              <div className="text-sm text-gray-600">Total Students</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-600">{stats.totalPresent}</div>
              <div className="text-sm text-gray-600">Present Today</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-red-600">{stats.totalAbsent}</div>
              <div className="text-sm text-gray-600">Absent Today</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-purple-600">
                {stats.overallAttendanceRate.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Overall Rate</div>
            </div>
          </div>
        )}
      </div>

      {/* Class-wise Reports */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">Class-wise Attendance</h3>
        
        {reports.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 text-lg mb-2">📊</div>
            <p className="text-gray-500">No attendance data found for this date.</p>
            <p className="text-sm text-gray-400 mt-1">
              Class teachers need to mark attendance for their classes.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">Class</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">Grade</th>
                  <th className="px-6 py-3 text-center font-semibold text-gray-700">Total Students</th>
                  <th className="px-6 py-3 text-center font-semibold text-gray-700">Present</th>
                  <th className="px-6 py-3 text-center font-semibold text-gray-700">Absent</th>
                  <th className="px-6 py-3 text-center font-semibold text-gray-700">Attendance Rate</th>
                  <th className="px-6 py-3 text-center font-semibold text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {reports.map((report) => (
                  <tr key={report.classId} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{report.className}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-900">Grade {report.gradeLevel}</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="text-gray-900">{report.totalStudents}</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="text-green-600 font-medium">{report.presentToday}</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="text-red-600 font-medium">{report.absentToday}</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getAttendanceColor(
                          report.attendanceRate
                        )}`}
                      >
                        {report.attendanceRate.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {report.hasAttendanceData ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          ✓ Marked
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                          ⏳ Pending
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Info Notice */}
      <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
        <div className="flex items-start gap-3">
          <div className="text-blue-500 text-lg">ℹ️</div>
          <div>
            <h4 className="font-semibold text-blue-800">Information</h4>
            <p className="text-blue-700 text-sm mt-1">
              Attendance can only be marked by class teachers. As an administrator, 
              you can view and analyze attendance reports but cannot mark attendance directly.
            </p>
            <p className="text-blue-700 text-sm mt-1">
              This ensures accountability and proper supervision of each class.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAttendanceReports;
