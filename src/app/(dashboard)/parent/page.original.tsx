import Announcements from "@/components/Announcements";
import ParentDashboardClient from "@/components/ParentDashboardClient";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { formatClassName } from "@/lib/formatClassName";
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
      class: true,
      teacher: true,
    },
    orderBy: { date: "desc" },
    take: 10,
  });

  // Get upcoming exams for children
  const upcomingExams = await prisma.exam.findMany({
    where: {
      publishedAt: {
        not: null,
      },
      status: "PUBLISHED",
    },
    include: {
      grade: true,
      class: true,
      examType: true,
    },
    orderBy: { createdAt: "desc" },
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
          description="Last 7 days"
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
          title="Children Attendance"
          description="View detailed attendance records"
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
              parent.students.map((student) => {
                // Get recent attendance for this student
                const studentAttendance = recentAttendance.filter(
                  (a) => a.studentId === student.id
                ).slice(0, 5);
                const presentCount = studentAttendance.filter((a) => a.present).length;
                const attendanceRate = studentAttendance.length > 0
                  ? Math.round((presentCount / studentAttendance.length) * 100)
                  : 0;

                return (
                  <div
                    key={student.id}
                    className="border border-gray-200 rounded-lg p-5 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-start space-x-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                        {student.img ? (
                          <Image
                            src={student.img}
                            alt={student.name}
                            width={64}
                            height={64}
                            className="rounded-full object-cover"
                          />
                        ) : (
                          <>
                            {student.name.charAt(0)}
                            {student.surname.charAt(0)}
                          </>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800 text-lg">
                          {student.name} {student.surname}
                        </h3>
                        <p className="text-sm text-gray-600 mb-3">
                          {formatClassName(student.class.name)} - Grade {student.class.grade.level}
                        </p>
                        
                        {/* Recent Attendance Summary */}
                        {studentAttendance.length > 0 ? (
                          <div className="mt-3 space-y-2">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-medium text-gray-600">Recent Attendance</span>
                              <span className="text-xs font-bold text-blue-600">{attendanceRate}%</span>
                            </div>
                            <div className="flex gap-1.5">
                              {studentAttendance.map((attendance) => (
                                <div
                                  key={attendance.id}
                                  className={`flex-1 h-2 rounded-full ${
                                    attendance.present
                                      ? "bg-green-500"
                                      : "bg-red-500"
                                  }`}
                                  title={`${attendance.date.toLocaleDateString()} - ${
                                    attendance.present ? "Present" : "Absent"
                                  }`}
                                />
                              ))}
                            </div>
                            <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
                              <span>Last 5 days</span>
                              <span className="flex items-center gap-3">
                                <span className="flex items-center gap-1">
                                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                  Present
                                </span>
                                <span className="flex items-center gap-1">
                                  <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                  Absent
                                </span>
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="mt-3 text-xs text-gray-500 italic">
                            No recent attendance records
                          </div>
                        )}

                        <div className="mt-4 flex gap-2">
                          <Link
                            href={`/parent/children/${student.id}/attendance`}
                            className="flex-1 text-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            View Details
                          </Link>
                          <Link
                            href={`/student/${student.id}`}
                            className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            Full Profile
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
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
        <div className="bg-white rounded-xl shadow-lg p-6" id="attendance">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center">
              <Image
                src="/attendance.png"
                alt="Attendance"
                width={24}
                height={24}
                className="mr-2"
              />
              Recent Attendance
            </h2>
            <a
              href="#attendance"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
            >
              Scroll to Top
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </a>
          </div>
          <div className="space-y-3">
            {recentAttendance.length > 0 ? (
              recentAttendance.slice(0, 5).map((attendance) => (
                <div
                  key={attendance.id}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg hover:shadow-md transition-all border border-gray-100"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      attendance.present
                        ? "bg-green-100"
                        : "bg-red-100"
                    }`}>
                      {attendance.present ? (
                        <span className="text-green-600 text-xl">✓</span>
                      ) : (
                        <span className="text-red-600 text-xl">✗</span>
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800">
                        {attendance.student.name} {attendance.student.surname}
                      </div>
                      <div className="text-sm text-gray-600">
                        {formatClassName(attendance.class.name)}
                      </div>
                      <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                        </svg>
                        {attendance.date.toLocaleDateString("en-US", { 
                          weekday: "short",
                          month: "short", 
                          day: "numeric" 
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-flex px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm ${
                        attendance.present
                          ? "bg-green-500 text-white"
                          : "bg-red-500 text-white"
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
                  {exam.publishedAt?.toLocaleDateString() || "Not scheduled"} {exam.publishedAt && "at"}{" "}
                  {exam.publishedAt?.toLocaleTimeString("en-US", {
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
