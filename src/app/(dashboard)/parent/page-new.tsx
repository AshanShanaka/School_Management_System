import Announcements from "@/components/Announcements";
import DashboardCard from "@/components/DashboardCard";
import QuickActionCard from "@/components/QuickActionCard";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import Image from "next/image";
import Link from "next/link";

const ParentPage = async () => {
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

  // Get recent attendance for all children
  const recentAttendance = await prisma.attendance.findMany({
    where: {
      studentId: {
        in: parent?.students.map((s) => s.id) || [],
      },
      date: {
        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
      },
    },
    include: {
      student: true,
      lesson: {
        include: {
          subject: true,
        },
      },
    },
    orderBy: { date: "desc" },
    take: 10,
  });

  // Get upcoming exams for children
  const upcomingExams = await prisma.exam.findMany({
    where: {
      startTime: {
        gte: new Date(),
      },
    },
    orderBy: { startTime: "asc" },
    take: 5,
  });

  const totalChildren = parent?.students.length || 0;
  const attendanceRate =
    recentAttendance.length > 0
      ? Math.round(
          (recentAttendance.filter((a) => a.present).length /
            recentAttendance.length) *
            100
        )
      : 100;

  return (
    <div className="p-6 space-y-8">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-6 text-white">
        <div className="flex items-center space-x-4">
          <div className="bg-white bg-opacity-20 rounded-full p-3">
            <Image src="/parent.png" alt="Parent" width={32} height={32} />
          </div>
          <div>
            <h1 className="text-3xl font-bold">
              Welcome, {parent?.name} {parent?.surname}
            </h1>
            <p className="text-purple-100">
              Parent Dashboard - Monitor your children's progress
            </p>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardCard
          title="My Children"
          count={totalChildren}
          icon="/student.png"
          href="/parent/children"
          bgColor="bg-gradient-to-br from-blue-500 to-blue-700"
          description="Enrolled children"
        />
        <DashboardCard
          title="Attendance Rate"
          count={attendanceRate}
          icon="/attendance.png"
          href="/parent/attendance"
          bgColor="bg-gradient-to-br from-green-500 to-green-700"
          description="7-day average %"
        />
        <DashboardCard
          title="Upcoming Exams"
          count={upcomingExams.length}
          icon="/exam.png"
          href="/list/exams"
          bgColor="bg-gradient-to-br from-orange-500 to-orange-700"
          description="This month"
        />
        <DashboardCard
          title="Messages"
          count={0}
          icon="/message.png"
          href="/list/messages"
          bgColor="bg-gradient-to-br from-purple-500 to-purple-700"
          description="Unread messages"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <QuickActionCard
          title="View Attendance"
          description="Check your children's attendance records"
          icon="/attendance.png"
          href="/parent/attendance"
          bgColor="bg-white"
          iconBgColor="bg-green-100"
        />
        <QuickActionCard
          title="Academic Results"
          description="View exam results and grades"
          icon="/result.png"
          href="/list/results"
          bgColor="bg-white"
          iconBgColor="bg-blue-100"
        />
        <QuickActionCard
          title="Timetable"
          description="Check class schedules"
          icon="/calendar.png"
          href="/parent/timetable"
          bgColor="bg-white"
          iconBgColor="bg-purple-100"
        />
        <QuickActionCard
          title="Assignments"
          description="Track homework and assignments"
          icon="/assignment.png"
          href="/list/assignments"
          bgColor="bg-white"
          iconBgColor="bg-orange-100"
        />
        <QuickActionCard
          title="School Events"
          description="Stay updated with school events"
          icon="/calendar.png"
          href="/list/events"
          bgColor="bg-white"
          iconBgColor="bg-indigo-100"
        />
        <QuickActionCard
          title="Contact Teachers"
          description="Send messages to teachers"
          icon="/message.png"
          href="/list/messages"
          bgColor="bg-white"
          iconBgColor="bg-pink-100"
        />
      </div>

      {/* Children & Their Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* My Children */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <Image
              src="/student.png"
              alt="Students"
              width={24}
              height={24}
              className="mr-2"
            />
            My Children
          </h2>
          <div className="space-y-4">
            {parent?.students && parent.students.length > 0 ? (
              parent.students.map((student) => (
                <div
                  key={student.id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <Image
                        src="/student.png"
                        alt="Student"
                        width={24}
                        height={24}
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800">
                        {student.name} {student.surname}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {student.class.name} - Grade {student.class.grade.level}
                      </p>
                      <p className="text-xs text-gray-500">
                        Student ID: {student.id}
                      </p>
                    </div>
                    <div className="text-right">
                      <Link
                        href={`/student/${student.id}`}
                        className="text-blue-600 text-sm font-medium hover:text-blue-800"
                      >
                        View Details →
                      </Link>
                    </div>
                  </div>
                </div>
              ))
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
        </div>

        {/* Recent Attendance */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <Image
              src="/attendance.png"
              alt="Attendance"
              width={24}
              height={24}
              className="mr-2"
            />
            Recent Attendance
          </h2>
          <div className="space-y-3">
            {recentAttendance.length > 0 ? (
              recentAttendance.slice(0, 5).map((attendance) => (
                <div
                  key={attendance.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <div className="font-medium text-gray-800">
                      {attendance.student.name} {attendance.student.surname}
                    </div>
                    <div className="text-sm text-gray-600">
                      {attendance.lesson.subject.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {attendance.date.toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                        attendance.present
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {attendance.present ? "Present" : "Absent"}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Image
                  src="/attendance.png"
                  alt="No attendance"
                  width={48}
                  height={48}
                  className="mx-auto mb-3 opacity-50"
                />
                <p>No recent attendance records</p>
              </div>
            )}
          </div>
          {recentAttendance.length > 5 && (
            <div className="mt-4 text-center">
              <Link
                href="/parent/attendance"
                className="text-blue-600 text-sm font-medium hover:text-blue-800"
              >
                View All Attendance →
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Upcoming Exams */}
      {upcomingExams.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <Image
              src="/exam.png"
              alt="Exams"
              width={24}
              height={24}
              className="mr-2"
            />
            Upcoming Exams
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingExams.map((exam) => (
              <div
                key={exam.id}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="font-medium text-gray-800">{exam.title}</div>
                <div className="text-sm text-gray-600 mb-2">Exam</div>
                <div className="text-sm text-blue-600 font-medium">
                  {exam.startTime.toLocaleDateString()} at{" "}
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

      {/* Announcements */}
      <div className="bg-white rounded-xl shadow-lg">
        <Announcements />
      </div>
    </div>
  );
};

export default ParentPage;
