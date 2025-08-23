import Announcements from "@/components/Announcements";
import EventCalendar from "@/components/EventCalendar";
import Performance from "@/components/Performance";
import StudentAttendanceCard from "@/components/StudentAttendanceCard";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
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

  // Get upcoming assignments
  const upcomingAssignments = await prisma.assignment.findMany({
    where: {
      lesson: {
        class: {
          students: { some: { id: user?.id } },
        },
      },
      dueDate: { gte: new Date() },
    },
    include: {
      lesson: {
        select: {
          subject: { select: { name: true } },
        },
      },
    },
    orderBy: { dueDate: "asc" },
    take: 5,
  });

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

  if (!student) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-500">Student profile not found.</p>
      </div>
    );
  }

  return (
    <div className="p-4 flex gap-4 flex-col xl:flex-row min-h-screen bg-gray-50">
      {/* LEFT */}
      <div className="w-full xl:w-2/3 flex flex-col gap-6">
        {/* WELCOME BANNER */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 rounded-lg shadow-lg">
          <div className="flex items-center gap-4">
            <Image
              src={student.img || "/noAvatar.png"}
              alt=""
              width={80}
              height={80}
              className="w-20 h-20 rounded-full border-4 border-white shadow-lg object-cover"
            />
            <div>
              <h1 className="text-2xl font-bold">
                Welcome, {student.name} {student.surname}!
              </h1>
              <p className="text-purple-100 mt-1">
                Student ID: {student.username}
              </p>
              <p className="text-purple-100">
                Class {student.class.grade.level}-{student.class.name}
              </p>
            </div>
          </div>
        </div>

        {/* QUICK STATS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Overall Rate</p>
                <p className="text-2xl font-bold text-blue-600">95%</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Image src="/attendance.png" alt="" width={24} height={24} />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Days Present</p>
                <p className="text-2xl font-bold text-green-600">18</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <Image src="/attendance.png" alt="" width={24} height={24} />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Days Absent</p>
                <p className="text-2xl font-bold text-red-600">1</p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <Image src="/attendance.png" alt="" width={24} height={24} />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Times Late</p>
                <p className="text-2xl font-bold text-yellow-600">2</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <Image src="/attendance.png" alt="" width={24} height={24} />
              </div>
            </div>
          </div>
        </div>

        {/* CLASS INFORMATION */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Image src="/class.png" alt="" width={24} height={24} />
            My Class Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-purple-50 rounded-lg border-l-4 border-purple-500">
              <h3 className="font-semibold text-lg text-gray-800 mb-2">
                Class {student.class.grade.level}-{student.class.name}
              </h3>
              <p className="text-sm text-gray-600">
                {student.class._count.students} students •{" "}
                {student.class._count.lessons} lessons
              </p>
              <div className="mt-2">
                <Suspense fallback="loading...">
                  <StudentAttendanceCard id={student.id} />
                </Suspense>
              </div>
            </div>
            <div className="p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-500">
              <h3 className="font-semibold text-lg text-gray-800 mb-2">
                Quick Actions
              </h3>
              <div className="flex flex-wrap gap-2 mt-2">
                <Link
                  href={`/list/assignments?classId=${student.classId}`}
                  className="bg-purple-600 text-white px-3 py-1 rounded text-xs hover:bg-purple-700 transition-colors"
                >
                  View Assignments
                </Link>
                <Link
                  href={`/list/results?studentId=${student.id}`}
                  className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700 transition-colors"
                >
                  My Results
                </Link>
                <Link
                  href={`/list/lessons?classId=${student.classId}`}
                  className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700 transition-colors"
                >
                  Class Schedule
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* ATTENDANCE OVERVIEW */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Image src="/attendance.png" alt="" width={24} height={24} />
              My Attendance Overview
            </h2>
            <Link
              href="/student/attendance"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm transition-colors"
            >
              View Details
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-600">95%</div>
              <div className="text-sm text-gray-600">Overall Rate</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-600">18</div>
              <div className="text-sm text-gray-600">Days Present</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-red-600">1</div>
              <div className="text-sm text-gray-600">Days Absent</div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-yellow-600">2</div>
              <div className="text-sm text-gray-600">Times Late</div>
            </div>
          </div>
        </div>

        {/* UPCOMING ASSIGNMENTS */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Image src="/assignment.png" alt="" width={24} height={24} />
            Upcoming Assignments
          </h2>
          {upcomingAssignments.length > 0 ? (
            <div className="space-y-4">
              {upcomingAssignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-500"
                >
                  <div>
                    <h4 className="font-semibold text-gray-800">
                      {assignment.title}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {assignment.lesson.subject.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-orange-600">
                      Due:{" "}
                      {new Intl.DateTimeFormat("en-US", {
                        month: "short",
                        day: "numeric",
                      }).format(assignment.dueDate)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Intl.DateTimeFormat("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      }).format(assignment.dueDate)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No upcoming assignments</p>
          )}
        </div>
      </div>

      {/* RIGHT */}
      <div className="w-full xl:w-1/3 flex flex-col gap-6">
        {/* QUICK ACTIONS */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-bold text-gray-800 mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 gap-3">
            <Link
              href="/student/attendance"
              className="flex items-center gap-3 p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Image src="/attendance.png" alt="" width={20} height={20} />
              View Attendance
            </Link>
            <Link
              href={`/list/assignments?classId=${student.classId}`}
              className="flex items-center gap-3 p-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Image src="/assignment.png" alt="" width={20} height={20} />
              My Assignments
            </Link>
            <Link
              href={`/list/results?studentId=${student.id}`}
              className="flex items-center gap-3 p-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Image src="/result.png" alt="" width={20} height={20} />
              My Results
            </Link>
            <Link
              href={`/list/lessons?classId=${student.classId}`}
              className="flex items-center gap-3 p-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              <Image src="/lesson.png" alt="" width={20} height={20} />
              Class Schedule
            </Link>
          </div>
        </div>

        <EventCalendar />

        {/* RECENT RESULTS */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Image src="/result.png" alt="" width={24} height={24} />
            Recent Results
          </h2>
          {recentResults.length > 0 ? (
            <div className="space-y-4">
              {recentResults.map((result) => (
                <div
                  key={result.id}
                  className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500"
                >
                  <div>
                    <h4 className="font-semibold text-gray-800">
                      {result.assignment?.title}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {result.assignment?.lesson.subject.name}
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
            <p className="text-gray-500">No results available</p>
          )}
        </div>

        <Performance />
        <Announcements />
      </div>
    </div>
  );
};

export default StudentPage;
