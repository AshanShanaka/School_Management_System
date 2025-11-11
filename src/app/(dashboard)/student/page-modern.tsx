import Announcements from "@/components/Announcements";
import ModernDashboardCard from "@/components/ModernDashboardCard";
import ModernActionCard from "@/components/ModernActionCard";
import Performance from "@/components/Performance";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import Image from "next/image";
import Link from "next/link";

const StudentPageModern = async () => {
  const user = await getCurrentUser();

  // Get student data with class and grade information
  const student = await prisma.student.findUnique({
    where: { id: user?.id },
    include: {
      class: {
        include: {
          grade: true,
          _count: { select: { lessons: true, students: true } },
        },
      },
    },
  });

  if (!student) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-500">Student profile not found.</p>
      </div>
    );
  }

  // Get attendance stats
  const totalAttendance = await prisma.attendance.count({
    where: { studentId: student.id },
  });

  const presentCount = await prisma.attendance.count({
    where: { studentId: student.id, present: true },
  });

  const attendanceRate =
    totalAttendance > 0
      ? Math.round((presentCount / totalAttendance) * 100)
      : 100;

  // Get upcoming assignments
  const upcomingAssignments = await prisma.assignment.findMany({
    where: {
      lessons: {
        classId: student.classId,
      },
      dueDate: {
        gte: new Date(),
      },
    },
    include: {
      lessons: {
        include: {
          subject: true,
        },
      },
    },
    orderBy: { dueDate: "asc" },
    take: 5,
  });

  // Get recent results
  const recentResults = await prisma.result.findMany({
    where: {
      studentId: student.id,
    },
    include: {
      exam: {
        include: {
          lesson: {
            include: {
              subject: true,
            },
          },
        },
      },
    },
    orderBy: { exam: { startTime: "desc" } },
    take: 5,
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8 space-y-6">
        {/* Welcome Header */}
        <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-md">
                <Image
                  src="/student.png"
                  alt="Student"
                  width={32}
                  height={32}
                  className="brightness-0 invert"
                />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                  Welcome, {student.name}! 🎓
                </h1>
                <p className="text-gray-600">
                  Class {student.class.name} • Grade {student.class.grade.level}
                </p>
              </div>
            </div>
            <div className="hidden md:block text-right">
              <p className="text-sm text-gray-500">Attendance Rate</p>
              <p className="text-2xl font-bold text-green-600">
                {attendanceRate}%
              </p>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <ModernDashboardCard
            title="Attendance"
            count={`${attendanceRate}%`}
            icon="/attendance.png"
            href="/student/attendance"
            gradient="bg-gradient-to-br from-green-500 to-green-600"
          />
          <ModernDashboardCard
            title="Assignments"
            count={upcomingAssignments.length}
            icon="/assignment.png"
            href={`/list/assignments?classId=${student.classId}`}
            gradient="bg-gradient-to-br from-purple-500 to-purple-600"
          />
          <ModernDashboardCard
            title="Recent Results"
            count={recentResults.length}
            icon="/result.png"
            href={`/list/results?studentId=${student.id}`}
            gradient="bg-gradient-to-br from-orange-500 to-orange-600"
          />
          <ModernDashboardCard
            title="Classmates"
            count={student.class._count.students}
            icon="/student.png"
            href={`/list/students?classId=${student.classId}`}
            gradient="bg-gradient-to-br from-blue-500 to-blue-600"
          />
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <ModernActionCard
              title="View Attendance"
              description="Check your attendance record"
              icon="/attendance.png"
              href="/student/attendance"
              iconBgColor="bg-green-100"
            />
            <ModernActionCard
              title="My Assignments"
              description="View and submit assignments"
              icon="/assignment.png"
              href={`/list/assignments?classId=${student.classId}`}
              iconBgColor="bg-purple-100"
            />
            <ModernActionCard
              title="My Results"
              description="View exam results"
              icon="/result.png"
              href={`/list/results?studentId=${student.id}`}
              iconBgColor="bg-orange-100"
            />
            <ModernActionCard
              title="Class Schedule"
              description="View your timetable"
              icon="/calendar.png"
              href={`/list/lessons?classId=${student.classId}`}
              iconBgColor="bg-blue-100"
            />
            <ModernActionCard
              title="Upcoming Exams"
              description="Check exam schedule"
              icon="/exam.png"
              href={`/list/exams?classId=${student.classId}`}
              iconBgColor="bg-red-100"
            />
            <ModernActionCard
              title="Messages"
              description="View announcements"
              icon="/message.png"
              href="/list/messages"
              iconBgColor="bg-indigo-100"
            />
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Assignments & Results */}
          <div className="lg:col-span-2 space-y-6">
            {/* Upcoming Assignments */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Upcoming Assignments
                </h2>
                <Link
                  href={`/list/assignments?classId=${student.classId}`}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  View All →
                </Link>
              </div>
              {upcomingAssignments.length > 0 ? (
                <div className="space-y-3">
                  {upcomingAssignments.map((assignment) => (
                    <div
                      key={assignment.id}
                      className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1">
                            {assignment.lessons?.subject.name}
                          </h3>
                          <p className="text-sm text-gray-600 mb-2">
                            Due:{" "}
                            {assignment.dueDate.toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                        <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">
                          Pending
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Image
                    src="/assignment.png"
                    alt="No assignments"
                    width={48}
                    height={48}
                    className="mx-auto mb-3 opacity-50"
                  />
                  <p>No upcoming assignments</p>
                </div>
              )}
            </div>

            {/* Recent Results */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Recent Results
                </h2>
                <Link
                  href={`/list/results?studentId=${student.id}`}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  View All →
                </Link>
              </div>
              {recentResults.length > 0 ? (
                <div className="space-y-3">
                  {recentResults.map((result) => (
                    <div
                      key={result.id}
                      className="flex items-center justify-between border border-gray-200 rounded-xl p-4"
                    >
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {result.exam.lesson?.subject.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {result.exam.startTime.toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-blue-600">
                          {result.score}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Image
                    src="/result.png"
                    alt="No results"
                    width={48}
                    height={48}
                    className="mx-auto mb-3 opacity-50"
                  />
                  <p>No results available</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Performance & Announcements */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
              <Performance />
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
              <Announcements />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentPageModern;
