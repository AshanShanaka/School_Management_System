import Announcements from "@/components/Announcements";
import ModernDashboardCard from "@/components/ModernDashboardCard";
import ModernActionCard from "@/components/ModernActionCard";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import Image from "next/image";
import Link from "next/link";

const ParentPageModern = async () => {
  const user = await getCurrentUser();

  // Get parent data with children
  const parent = await prisma.parent.findUnique({
    where: { id: user?.id },
    include: {
      students: {
        include: {
          class: {
            include: {
              grade: true,
            },
          },
        },
      },
    },
  });

  if (!parent) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-500">Parent profile not found.</p>
      </div>
    );
  }

  // Get recent attendance for all children
  const recentAttendance = await prisma.attendance.findMany({
    where: {
      studentId: {
        in: parent.students.map((s) => s.id),
      },
      date: {
        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
      },
    },
  });

  // Get upcoming exams for children
  const upcomingExams = await prisma.exam.findMany({
    where: {
      lesson: {
        classId: {
          in: parent.students.map((s) => s.classId),
        },
      },
      startTime: {
        gte: new Date(),
      },
    },
    include: {
      lesson: {
        include: {
          subject: true,
          class: true,
        },
      },
    },
    orderBy: { startTime: "asc" },
    take: 5,
  });

  const totalChildren = parent.students.length;
  const attendanceRate =
    recentAttendance.length > 0
      ? Math.round(
          (recentAttendance.filter((a) => a.present).length /
            recentAttendance.length) *
            100
        )
      : 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50">
      <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8 space-y-6">
        {/* Welcome Header */}
        <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-md">
                <Image
                  src="/parent.png"
                  alt="Parent"
                  width={32}
                  height={32}
                  className="brightness-0 invert"
                />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                  Welcome, {parent.name}! 👨‍👩‍👧
                </h1>
                <p className="text-gray-600">
                  {totalChildren} {totalChildren === 1 ? "Child" : "Children"}{" "}
                  Enrolled
                </p>
              </div>
            </div>
            <div className="hidden md:block text-right">
              <p className="text-sm text-gray-500">Attendance (7 days)</p>
              <p className="text-2xl font-bold text-green-600">
                {attendanceRate}%
              </p>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <ModernDashboardCard
            title="My Children"
            count={totalChildren}
            icon="/student.png"
            href="/parent/children"
            gradient="bg-gradient-to-br from-blue-500 to-blue-600"
          />
          <ModernDashboardCard
            title="Attendance"
            count={`${attendanceRate}%`}
            icon="/attendance.png"
            href="/parent/attendance"
            gradient="bg-gradient-to-br from-green-500 to-green-600"
          />
          <ModernDashboardCard
            title="Upcoming Exams"
            count={upcomingExams.length}
            icon="/exam.png"
            href="/list/exams"
            gradient="bg-gradient-to-br from-orange-500 to-orange-600"
          />
          <ModernDashboardCard
            title="Messages"
            count={0}
            icon="/message.png"
            href="/list/messages"
            gradient="bg-gradient-to-br from-purple-500 to-purple-600"
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
              description="Track your children's attendance"
              icon="/attendance.png"
              href="/parent/attendance"
              iconBgColor="bg-green-100"
            />
            <ModernActionCard
              title="Check Results"
              description="View exam results and grades"
              icon="/result.png"
              href="/list/results"
              iconBgColor="bg-orange-100"
            />
            <ModernActionCard
              title="View Timetables"
              description="Check class schedules"
              icon="/calendar.png"
              href="/parent/timetable"
              iconBgColor="bg-blue-100"
            />
            <ModernActionCard
              title="Upcoming Events"
              description="View school events"
              icon="/calendar.png"
              href="/list/events"
              iconBgColor="bg-indigo-100"
            />
            <ModernActionCard
              title="Contact Teachers"
              description="Send messages to teachers"
              icon="/message.png"
              href="/list/messages"
              iconBgColor="bg-pink-100"
            />
            <ModernActionCard
              title="View Assignments"
              description="Monitor assignments"
              icon="/assignment.png"
              href="/list/assignments"
              iconBgColor="bg-purple-100"
            />
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Children & Exams */}
          <div className="lg:col-span-2 space-y-6">
            {/* My Children */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  My Children
                </h2>
                <Link
                  href="/parent/children"
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  View Details →
                </Link>
              </div>
              {parent.students.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {parent.students.map((student) => (
                    <Link
                      key={student.id}
                      href={`/list/students/${student.id}`}
                      className="border border-gray-200 rounded-xl p-5 hover:shadow-md hover:border-blue-300 transition-all group"
                    >
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-lg font-bold text-blue-600">
                            {student.name[0]}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {student.name} {student.surname}
                          </h3>
                          <p className="text-sm text-gray-600">
                            Class {student.class.name} • Grade{" "}
                            {student.class.grade.level}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">View Progress</span>
                        <span className="text-blue-600 group-hover:translate-x-1 transition-transform">
                          →
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Image
                    src="/student.png"
                    alt="No children"
                    width={48}
                    height={48}
                    className="mx-auto mb-3 opacity-50"
                  />
                  <p>No children registered</p>
                </div>
              )}
            </div>

            {/* Upcoming Exams */}
            {upcomingExams.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Upcoming Exams
                  </h2>
                  <Link
                    href="/list/exams"
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    View All →
                  </Link>
                </div>
                <div className="space-y-3">
                  {upcomingExams.map((exam) => (
                    <div
                      key={exam.id}
                      className="border border-gray-200 rounded-xl p-4"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">
                            {exam.lesson?.subject.name}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {exam.lesson?.class.name}
                          </p>
                        </div>
                        <span className="px-3 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                          Exam
                        </span>
                      </div>
                      <div className="text-sm text-blue-600 font-medium">
                        {exam.startTime.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}{" "}
                        at{" "}
                        {exam.startTime.toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Announcements */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
              <Announcements />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParentPageModern;
