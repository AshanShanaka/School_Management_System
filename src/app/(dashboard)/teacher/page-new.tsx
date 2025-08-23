import Announcements from "@/components/Announcements";
import DashboardCard from "@/components/DashboardCard";
import QuickActionCard from "@/components/QuickActionCard";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import Image from "next/image";
import Link from "next/link";

const TeacherPage = async () => {
  const user = await getCurrentUser();

  // Get teacher data
  const teacher = await prisma.teacher.findUnique({
    where: { id: user?.id },
    include: {
      subjects: true,
      classes: {
        include: {
          grade: true,
          _count: { select: { students: true } },
        },
      },
      _count: {
        select: {
          lessons: true,
          classes: true,
          subjects: true,
        },
      },
    },
  });

  // Count total students across all classes
  const totalStudents =
    teacher?.classes.reduce((sum, cls) => sum + cls._count.students, 0) || 0;

  // Get upcoming lessons for today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todaysLessons = await prisma.lesson.findMany({
    where: {
      teacherId: user?.id,
      startTime: {
        gte: today,
        lt: tomorrow,
      },
    },
    include: {
      subject: true,
      class: {
        include: {
          grade: true,
        },
      },
    },
    orderBy: { startTime: "asc" },
  });

  return (
    <div className="p-6 space-y-8">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-xl p-6 text-white">
        <div className="flex items-center space-x-4">
          <div className="bg-white bg-opacity-20 rounded-full p-3">
            <Image src="/teacher.png" alt="Teacher" width={32} height={32} />
          </div>
          <div>
            <h1 className="text-3xl font-bold">
              Welcome, {teacher?.name} {teacher?.surname}
            </h1>
            <p className="text-green-100">
              Teacher Dashboard - Manage your classes and students
            </p>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardCard
          title="My Classes"
          count={teacher?._count.classes || 0}
          icon="/class.png"
          href="/list/classes"
          bgColor="bg-gradient-to-br from-blue-500 to-blue-700"
          description="Classes you teach"
        />
        <DashboardCard
          title="My Students"
          count={totalStudents}
          icon="/student.png"
          href="/list/students"
          bgColor="bg-gradient-to-br from-green-500 to-green-700"
          description="Total students"
        />
        <DashboardCard
          title="My Subjects"
          count={teacher?._count.subjects || 0}
          icon="/subject.png"
          href="/list/subjects"
          bgColor="bg-gradient-to-br from-purple-500 to-purple-700"
          description="Subjects you teach"
        />
        <DashboardCard
          title="My Lessons"
          count={teacher?._count.lessons || 0}
          icon="/lesson.png"
          href="/list/lessons"
          bgColor="bg-gradient-to-br from-orange-500 to-orange-700"
          description="Total lessons"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <QuickActionCard
          title="Take Attendance"
          description="Mark student attendance for your classes"
          icon="/attendance.png"
          href="/teacher/attendance/timetable"
          bgColor="bg-white"
          iconBgColor="bg-green-100"
        />
        <QuickActionCard
          title="View Timetable"
          description="Check your teaching schedule"
          icon="/calendar.png"
          href="/list/timetables"
          bgColor="bg-white"
          iconBgColor="bg-blue-100"
        />
        <QuickActionCard
          title="Manage Assignments"
          description="Create and grade assignments"
          icon="/assignment.png"
          href="/list/assignments"
          bgColor="bg-white"
          iconBgColor="bg-purple-100"
        />
        <QuickActionCard
          title="Student Results"
          description="View and input student results"
          icon="/result.png"
          href="/list/results"
          bgColor="bg-white"
          iconBgColor="bg-orange-100"
        />
        <QuickActionCard
          title="Exam Management"
          description="Schedule and manage exams"
          icon="/exam.png"
          href="/list/exams"
          bgColor="bg-white"
          iconBgColor="bg-red-100"
        />
        <QuickActionCard
          title="Messages"
          description="Communicate with students and parents"
          icon="/message.png"
          href="/list/messages"
          bgColor="bg-white"
          iconBgColor="bg-indigo-100"
        />
      </div>

      {/* Today's Schedule & Classes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Today's Lessons */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <Image
              src="/calendar.png"
              alt="Calendar"
              width={24}
              height={24}
              className="mr-2"
            />
            Today's Lessons
          </h2>
          <div className="space-y-3">
            {todaysLessons.length > 0 ? (
              todaysLessons.map((lesson) => (
                <div
                  key={lesson.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <div className="font-medium text-gray-800">
                      {lesson.subject.name}
                    </div>
                    <div className="text-sm text-gray-600">
                      {lesson.class.name} ({lesson.class.grade.level})
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-blue-600">
                      {lesson.startTime.toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                    <div className="text-xs text-gray-500">
                      {lesson.endTime.toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Image
                  src="/calendar.png"
                  alt="No lessons"
                  width={48}
                  height={48}
                  className="mx-auto mb-3 opacity-50"
                />
                <p>No lessons scheduled for today</p>
              </div>
            )}
          </div>
        </div>

        {/* My Classes */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <Image
              src="/class.png"
              alt="Classes"
              width={24}
              height={24}
              className="mr-2"
            />
            My Classes
          </h2>
          <div className="space-y-3">
            {teacher?.classes && teacher.classes.length > 0 ? (
              teacher.classes.map((cls) => (
                <Link
                  key={cls.id}
                  href={`/list/students?classId=${cls.id}`}
                  className="block"
                >
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer">
                    <div>
                      <div className="font-medium text-gray-800">
                        {cls.name}
                      </div>
                      <div className="text-sm text-gray-600">
                        Grade {cls.grade.level}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-blue-600">
                        {cls._count.students} students
                      </div>
                      <div className="text-xs text-gray-500">
                        View Details →
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Image
                  src="/class.png"
                  alt="No classes"
                  width={48}
                  height={48}
                  className="mx-auto mb-3 opacity-50"
                />
                <p>No classes assigned</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Announcements */}
      <div className="bg-white rounded-xl shadow-lg">
        <Announcements />
      </div>
    </div>
  );
};

export default TeacherPage;
