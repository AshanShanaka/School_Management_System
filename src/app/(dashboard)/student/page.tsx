import Announcements from "@/components/Announcements";
import EventCalendar from "@/components/EventCalendar";
import StudentAttendanceCard from "@/components/StudentAttendanceCard";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { formatClassName } from "@/lib/formatClassName";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";

const StudentPage = async () => {
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

  // Calculate real attendance statistics
  const attendanceStats = await prisma.attendance.aggregate({
    where: { studentId: student.id },
    _count: {
      id: true,
      present: true,
    },
  });

  const totalAttendanceRecords = attendanceStats._count.id || 0;
  const presentCount = await prisma.attendance.count({
    where: { studentId: student.id, present: true },
  });
  const absentCount = await prisma.attendance.count({
    where: { studentId: student.id, present: false },
  });

  // Calculate attendance rate
  const attendanceRate = totalAttendanceRecords > 0 
    ? Math.round((presentCount / totalAttendanceRecords) * 100)
    : 0;

  // Get upcoming assignments - removed for now

  // Get recent results
  const recentResults = await prisma.result.findMany({
    where: { studentId: user?.id },
    include: {
      assignment: {
        select: {
          title: true,
          lesson: {
            select: {
              subject: { select: { name: true } },
            },
          },
        },
      },
    },
    orderBy: { id: "desc" },
    take: 5,
  });

  // Calculate average grade
  const averageResult = await prisma.result.aggregate({
    where: { studentId: student.id },
    _avg: { score: true },
    _count: { id: true },
  });

  const averageGrade = averageResult._avg.score 
    ? Math.round(averageResult._avg.score)
    : 0;
  const totalResults = averageResult._count.id || 0;

  return (
    <div className="p-4 flex gap-4 flex-col xl:flex-row min-h-screen bg-gray-50">
      {/* LEFT */}
      <div className="w-full xl:w-2/3 flex flex-col gap-6">
        {/* WELCOME BANNER */}
        <div className="bg-gradient-to-r from-purple-600 via-purple-700 to-pink-600 text-white p-8 rounded-xl shadow-2xl">
          <div className="flex items-center gap-6">
            <div className="relative">
              <Image
                src={student.img || "/noAvatar.png"}
                alt=""
                width={96}
                height={96}
                className="w-24 h-24 rounded-full border-4 border-white shadow-2xl object-cover"
              />
              <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-green-500 rounded-full border-4 border-white"></div>
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-1">
                Welcome back, {student.name}!
              </h1>
              <p className="text-purple-100 text-sm">
                Student ID: {student.username} • Class {formatClassName(student.class.name)}
              </p>
              <div className="flex gap-3 mt-3">
                <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium">
                  📚 {student.class._count.lessons} Lessons
                </div>
                <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium">
                  👥 {student.class._count.students} Classmates
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* QUICK STATS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-lg transform hover:scale-105 transition-transform">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-100 mb-1">Attendance Rate</p>
                <p className="text-3xl font-bold">{attendanceRate}%</p>
                <p className="text-xs text-blue-100 mt-1">Overall performance</p>
              </div>
              <div className="p-4 bg-white/20 backdrop-blur-sm rounded-xl">
                <Image src="/attendance.png" alt="" width={28} height={28} />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-xl shadow-lg transform hover:scale-105 transition-transform">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-100 mb-1">Days Present</p>
                <p className="text-3xl font-bold">{presentCount}</p>
                <p className="text-xs text-green-100 mt-1">Keep it up!</p>
              </div>
              <div className="p-4 bg-white/20 backdrop-blur-sm rounded-xl">
                <Image src="/attendance.png" alt="" width={28} height={28} />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-500 to-red-600 text-white p-6 rounded-xl shadow-lg transform hover:scale-105 transition-transform">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-100 mb-1">Days Absent</p>
                <p className="text-3xl font-bold">{absentCount}</p>
                <p className="text-xs text-red-100 mt-1">
                  {absentCount === 0 ? 'Perfect!' : 'Try to improve'}
                </p>
              </div>
              <div className="p-4 bg-white/20 backdrop-blur-sm rounded-xl">
                <Image src="/attendance.png" alt="" width={28} height={28} />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white p-6 rounded-xl shadow-lg transform hover:scale-105 transition-transform">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-100 mb-1">Average Grade</p>
                <p className="text-3xl font-bold">{averageGrade}%</p>
                <p className="text-xs text-yellow-100 mt-1">
                  {averageGrade >= 75 ? 'Excellent!' : averageGrade >= 60 ? 'Good work!' : 'Keep going!'}
                </p>
              </div>
              <div className="p-4 bg-white/20 backdrop-blur-sm rounded-xl">
                <Image src="/result.png" alt="" width={28} height={28} />
              </div>
            </div>
          </div>
        </div>

        {/* CLASS INFORMATION */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Image src="/class.png" alt="" width={24} height={24} className="brightness-0 invert" />
            My Class Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border-l-4 border-purple-500">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-purple-500 rounded-lg">
                  <Image src="/class.png" alt="" width={20} height={20} />
                </div>
                <h3 className="font-semibold text-lg text-gray-800">
                  Class {formatClassName(student.class.name)}
                </h3>
              </div>
              <div className="space-y-2 text-sm text-gray-700">
                <div className="flex items-center gap-2">
                  <span className="text-purple-600">👥</span>
                  <span>{student.class._count.students} students in class</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-purple-600">📚</span>
                  <span>{student.class._count.lessons} total lessons</span>
                </div>
              </div>
              <div className="mt-4">
                <Suspense fallback="loading...">
                  <StudentAttendanceCard id={student.id} />
                </Suspense>
              </div>
            </div>
            <div className="p-5 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border-l-4 border-blue-500">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <span className="text-white text-xl">🎯</span>
                </div>
                <h3 className="font-semibold text-lg text-gray-800">
                  Quick Links
                </h3>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                <Link
                  href={`/list/assignments?classId=${student.classId}`}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg text-xs font-medium hover:bg-purple-700 transition-colors shadow-sm"
                >
                  📝 Assignments
                </Link>
                <Link
                  href="/student/my-results"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors shadow-sm"
                >
                  📊 Results
                </Link>
                <Link
                  href={`/list/lessons?classId=${student.classId}`}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg text-xs font-medium hover:bg-green-700 transition-colors shadow-sm"
                >
                  🗓️ Schedule
                </Link>
                <Link
                  href="/student/my-results"
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-xs font-medium hover:bg-indigo-700 transition-colors shadow-sm"
                >
                  📊 My Results
                </Link>
                <Link
                  href={`/list/assignments?classId=${student.classId}`}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg text-xs font-medium hover:bg-purple-700 transition-colors shadow-sm"
                >
                  📝 Assignments
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* ATTENDANCE OVERVIEW */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Image src="/attendance.png" alt="" width={24} height={24} className="brightness-0 invert" />
              My Attendance Overview
            </h2>
            <Link
              href="/student/attendance"
              className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-blue-800 text-sm transition-all shadow-md"
            >
              View Details
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-5 rounded-xl text-center border border-blue-200">
              <div className="text-3xl font-bold text-blue-600">{attendanceRate}%</div>
              <div className="text-sm text-gray-600 mt-1">Overall Rate</div>
              <div className="mt-2">
                <span className={`text-xs px-2 py-1 rounded-full ${
                  attendanceRate >= 90 ? 'bg-green-500 text-white' : 
                  attendanceRate >= 75 ? 'bg-blue-500 text-white' : 
                  'bg-orange-500 text-white'
                }`}>
                  {attendanceRate >= 90 ? 'Excellent' : attendanceRate >= 75 ? 'Good' : 'Improve'}
                </span>
              </div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-5 rounded-xl text-center border border-green-200">
              <div className="text-3xl font-bold text-green-600">{presentCount}</div>
              <div className="text-sm text-gray-600 mt-1">Days Present</div>
              <div className="mt-2 text-xs text-green-600">✓ Keep going!</div>
            </div>
            <div className="bg-gradient-to-br from-red-50 to-red-100 p-5 rounded-xl text-center border border-red-200">
              <div className="text-3xl font-bold text-red-600">{absentCount}</div>
              <div className="text-sm text-gray-600 mt-1">Days Absent</div>
              <div className="mt-2 text-xs text-red-600">
                {absentCount === 0 ? '★ Perfect!' : '⚠ Watch out'}
              </div>
            </div>
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-5 rounded-xl text-center border border-yellow-200">
              <div className="text-3xl font-bold text-yellow-600">{totalResults}</div>
              <div className="text-sm text-gray-600 mt-1">Assessments</div>
              <div className="mt-2 text-xs text-yellow-600">📝 Completed</div>
            </div>
          </div>
        </div>


      </div>

      {/* RIGHT */}
      <div className="w-full xl:w-1/3 flex flex-col gap-6">
        {/* QUICK ACTIONS */}
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 p-6 rounded-xl shadow-md border border-purple-100">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="text-xl">⚡</span>
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 gap-3">
            <Link
              href="/student/attendance"
              className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-md transform hover:scale-105"
            >
              <div className="p-2 bg-white/20 rounded-lg">
                <Image src="/attendance.png" alt="" width={20} height={20} />
              </div>
              <span className="font-medium">View Attendance</span>
            </Link>
            <Link
              href={`/list/assignments?classId=${student.classId}`}
              className="flex items-center gap-3 p-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all shadow-md transform hover:scale-105"
            >
              <div className="p-2 bg-white/20 rounded-lg">
                <Image src="/assignment.png" alt="" width={20} height={20} />
              </div>
              <span className="font-medium">My Assignments</span>
            </Link>
            <Link
              href="/student/my-results"
              className="flex items-center gap-3 p-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all shadow-md transform hover:scale-105"
            >
              <div className="p-2 bg-white/20 rounded-lg">
                <Image src="/result.png" alt="" width={20} height={20} />
              </div>
              <span className="font-medium">My Results</span>
            </Link>
            <Link
              href={`/list/lessons?classId=${student.classId}`}
              className="flex items-center gap-3 p-4 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-xl hover:from-orange-700 hover:to-orange-800 transition-all shadow-md transform hover:scale-105"
            >
              <div className="p-2 bg-white/20 rounded-lg">
                <Image src="/lesson.png" alt="" width={20} height={20} />
              </div>
              <span className="font-medium">Class Schedule</span>
            </Link>
          </div>
        </div>

        <EventCalendar />

        {/* RECENT RESULTS */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Image src="/result.png" alt="" width={24} height={24} className="brightness-0 invert" />
              Recent Results
            </h2>
            <Link
              href="/student/my-results"
              className="text-sm text-purple-600 hover:text-purple-800 font-medium"
            >
              View All →
            </Link>
          </div>
          {recentResults.length > 0 ? (
            <div className="space-y-3">
              {recentResults.map((result) => {
                const getGradeColor = (score: number) => {
                  if (score >= 75) return 'text-green-600 bg-green-50 border-green-200';
                  if (score >= 65) return 'text-blue-600 bg-blue-50 border-blue-200';
                  if (score >= 50) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
                  if (score >= 35) return 'text-orange-600 bg-orange-50 border-orange-200';
                  return 'text-red-600 bg-red-50 border-red-200';
                };

                return (
                  <div
                    key={result.id}
                    className={`flex items-center justify-between p-4 rounded-lg border ${getGradeColor(result.score)}`}
                  >
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800">
                        {result.assignment?.title || 'Assignment'}
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {result.assignment?.lesson.subject.name}
                      </p>
                    </div>
                    <div className="text-right ml-4">
                      <div className={`text-3xl font-bold ${getGradeColor(result.score).split(' ')[0]}`}>
                        {result.score}%
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {result.score >= 75 ? 'Excellent' : result.score >= 65 ? 'Good' : result.score >= 50 ? 'Pass' : 'Needs Improvement'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Image src="/result.png" alt="" width={32} height={32} className="opacity-50" />
              </div>
              <p className="text-gray-500 font-medium">No results available</p>
              <p className="text-sm text-gray-400 mt-1">Complete assignments to see your results here</p>
            </div>
          )}
        </div>

        <Announcements />
      </div>
    </div>
  );
};

export default StudentPage;
