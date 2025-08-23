import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import Image from "next/image";
import Link from "next/link";

const StudentAttendancePage = async ({
  searchParams,
}: {
  searchParams: { date?: string; period?: string };
}) => {
  const user = await getCurrentUser();
  const role = user?.role;
  const userId = user?.id;

  if (role !== "student") {
    redirect("/");
  }

  // Get student info
  const student = await prisma.student.findUnique({
    where: { id: user?.id },
    include: {
      class: {
        include: {
          grade: true,
        },
      },
    },
  });

  if (!student) {
    return <div>Student not found</div>;
  }

  const selectedDate =
    searchParams.date || new Date().toISOString().split("T")[0];
  const selectedPeriod = searchParams.period || "daily";

  // Calculate date ranges
  const today = new Date(selectedDate);
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay() + 1); // Monday
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6); // Sunday

  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  // Get attendance data based on selected period
  let startDate = today;
  let endDate = tomorrow;

  switch (selectedPeriod) {
    case "weekly":
      startDate = weekStart;
      endDate = weekEnd;
      break;
    case "monthly":
      startDate = monthStart;
      endDate = monthEnd;
      break;
    default:
      startDate = today;
      endDate = tomorrow;
  }

  // Get attendance records for the period
  const attendanceRecords = await prisma.attendance.findMany({
    where: {
      studentId: user?.id,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      lesson: {
        include: {
          subject: true,
          teacher: true,
        },
      },
    },
    orderBy: {
      date: "desc",
    },
  });

  // Calculate statistics
  const totalRecords = attendanceRecords.length;
  const presentCount = attendanceRecords.filter((a) => a.present).length;
  const absentCount = totalRecords - presentCount;
  const attendanceRate =
    totalRecords > 0 ? ((presentCount / totalRecords) * 100).toFixed(1) : "0";

  // Get monthly statistics for the chart
  const monthlyAttendance = await prisma.attendance.findMany({
    where: {
      studentId: user?.id,
      date: {
        gte: monthStart,
        lte: monthEnd,
      },
    },
  });

  const monthlyPresent = monthlyAttendance.filter((a) => a.present).length;
  const monthlyTotal = monthlyAttendance.length;
  const monthlyRate =
    monthlyTotal > 0 ? ((monthlyPresent / monthlyTotal) * 100).toFixed(1) : "0";

  return (
    <div className="p-4">
      <div className="bg-white p-6 rounded-md">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">My Attendance</h1>
            <p className="text-gray-500 mt-1">
              {student.name} {student.surname} - Class{" "}
              {student.class.grade.level}-{student.class.name}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">
              Viewing:{" "}
              {selectedPeriod.charAt(0).toUpperCase() + selectedPeriod.slice(1)}{" "}
              | {new Date(selectedDate).toLocaleDateString()}
            </p>
            <div className="mt-2 space-x-2">
              <Link
                href={`/student/attendance?date=${selectedDate}&period=daily`}
                className={`px-3 py-1 rounded text-xs ${
                  selectedPeriod === "daily"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                Daily
              </Link>
              <Link
                href={`/student/attendance?date=${selectedDate}&period=weekly`}
                className={`px-3 py-1 rounded text-xs ${
                  selectedPeriod === "weekly"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                Weekly
              </Link>
              <Link
                href={`/student/attendance?date=${selectedDate}&period=monthly`}
                className={`px-3 py-1 rounded text-xs ${
                  selectedPeriod === "monthly"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                Monthly
              </Link>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-md text-center">
            <div className="text-2xl font-bold text-blue-600">
              {attendanceRate}%
            </div>
            <div className="text-sm text-gray-600">
              {selectedPeriod.charAt(0).toUpperCase() + selectedPeriod.slice(1)}{" "}
              Rate
            </div>
          </div>
          <div className="bg-green-50 p-4 rounded-md text-center">
            <div className="text-2xl font-bold text-green-600">
              {presentCount}
            </div>
            <div className="text-sm text-gray-600">Present</div>
          </div>
          <div className="bg-red-50 p-4 rounded-md text-center">
            <div className="text-2xl font-bold text-red-600">{absentCount}</div>
            <div className="text-sm text-gray-600">Absent</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-md text-center">
            <div className="text-2xl font-bold text-purple-600">
              {monthlyRate}%
            </div>
            <div className="text-sm text-gray-600">Monthly Rate</div>
          </div>
        </div>

        {/* Period Header */}
        <div className="mb-4">
          <h2 className="text-xl font-semibold">
            Attendance Records -{" "}
            {selectedPeriod.charAt(0).toUpperCase() + selectedPeriod.slice(1)}
          </h2>
          <p className="text-gray-500">
            {selectedPeriod === "daily"
              ? new Date(selectedDate).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })
              : selectedPeriod === "weekly"
              ? `Week of ${weekStart.toLocaleDateString()} - ${weekEnd.toLocaleDateString()}`
              : `${monthStart.toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}`}
          </p>
        </div>

        {/* Attendance Records Table */}
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left">Date & Time</th>
                <th className="px-4 py-3 text-left">Subject</th>
                <th className="px-4 py-3 text-left">Teacher</th>
                <th className="px-4 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {attendanceRecords.length > 0 ? (
                attendanceRecords.map((attendance) => (
                  <tr key={attendance.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div>
                        <div className="font-medium">
                          {new Date(attendance.date).toLocaleDateString(
                            "en-US",
                            {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                            }
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(attendance.date).toLocaleTimeString(
                            "en-US",
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">
                        {attendance.lesson?.subject?.name || "N/A"}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">
                        {attendance.lesson?.teacher
                          ? `${attendance.lesson.teacher.name} ${attendance.lesson.teacher.surname}`
                          : "N/A"}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          attendance.present
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        <div
                          className={`w-2 h-2 rounded-full mr-2 ${
                            attendance.present ? "bg-green-500" : "bg-red-500"
                          }`}
                        />
                        {attendance.present ? "Present" : "Absent"}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Image
                        src="/attendance.png"
                        alt="No data"
                        width={64}
                        height={64}
                        className="opacity-50"
                      />
                      <p>No attendance records found for this period.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 flex gap-4">
          <Link
            href="/list/timetables"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            View My Timetable
          </Link>
          <Link
            href="/student"
            className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default StudentAttendancePage;
