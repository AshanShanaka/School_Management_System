import Announcements from "@/components/Announcements";
import AttendanceDashboardContainer from "@/components/AttendanceDashboardContainer";
import BigCalendarContainer from "@/components/BigCalendarContainer";
import StudentAttendanceCard from "@/components/StudentAttendanceCard";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";

const ParentPage = async () => {
  const { userId } = auth();
  const currentUserId = userId;

  // Get students with detailed information
  const students = await prisma.student.findMany({
    where: {
      parentId: currentUserId!,
    },
    include: {
      class: {
        include: {
          grade: true,
          _count: { select: { lessons: true, students: true } },
        },
      },
    },
  });

  // Get upcoming assignments for all children
  const upcomingAssignments = await prisma.assignment.findMany({
    where: {
      lesson: {
        class: {
          students: {
            some: {
              parentId: currentUserId!,
            },
          },
        },
      },
      dueDate: { gte: new Date() },
    },
    include: {
      lesson: {
        select: {
          subject: { select: { name: true } },
          class: {
            select: {
              name: true,
              grade: { select: { level: true } },
            },
          },
        },
      },
    },
    orderBy: { dueDate: "asc" },
    take: 10,
  });

  // Get recent results for all children
  const recentResults = await prisma.result.findMany({
    where: {
      student: {
        parentId: currentUserId!,
      },
    },
    include: {
      student: { select: { name: true, surname: true } },
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
    take: 10,
  });

  if (students.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-500">No children found in the system.</p>
      </div>
    );
  }

  return (
    <div className="p-4 flex gap-4 flex-col xl:flex-row">
      {/* LEFT */}
      <div className="w-full xl:w-2/3 flex flex-col gap-4">
        {/* CHILDREN OVERVIEW */}
        <div className="bg-white p-4 rounded-md">
          <h2 className="text-xl font-semibold mb-4">My Children</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {students.map((student) => (
              <div
                key={student.id}
                className="bg-lamaSky p-4 rounded-md flex gap-4"
              >
                <Image
                  src={student.img || "/noAvatar.png"}
                  alt=""
                  width={60}
                  height={60}
                  className="w-15 h-15 rounded-full object-cover"
                />
                <div className="flex-1">
                  <h3 className="font-semibold">
                    {student.name} {student.surname}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Class: {student.class.grade.level}-{student.class.name}
                  </p>
                  <div className="mt-2 flex gap-2">
                    <Link
                      href={`/list/students/${student.id}`}
                      className="text-xs bg-white px-2 py-1 rounded hover:bg-gray-100"
                    >
                      View Profile
                    </Link>
                    <Link
                      href={`/list/results?studentId=${student.id}`}
                      className="text-xs bg-white px-2 py-1 rounded hover:bg-gray-100"
                    >
                      Results
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ATTENDANCE DASHBOARD */}
        <AttendanceDashboardContainer />

        {/* ATTENDANCE OVERVIEW */}
        <div className="bg-white p-4 rounded-md">
          <h2 className="text-lg font-semibold mb-4">Attendance Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {students.map((student) => (
              <div key={student.id} className="border p-3 rounded-md">
                <h4 className="font-medium mb-2">
                  {student.name} {student.surname}
                </h4>
                <Suspense fallback="Loading attendance...">
                  <StudentAttendanceCard id={student.id} />
                </Suspense>
              </div>
            ))}
          </div>
        </div>

        {/* SCHEDULES */}
        <div className="space-y-4">
          {students.map((student) => (
            <div key={student.id} className="bg-white p-4 rounded-md">
              <h2 className="text-lg font-semibold mb-4">
                {student.name}&apos;s Schedule - Class{" "}
                {student.class.grade.level}-{student.class.name}
              </h2>
              <div className="h-[400px]">
                <BigCalendarContainer type="classId" id={student.classId} />
              </div>
            </div>
          ))}
        </div>

        {/* UPCOMING ASSIGNMENTS */}
        <div className="bg-white p-4 rounded-md">
          <h2 className="text-lg font-semibold mb-4">Upcoming Assignments</h2>
          {upcomingAssignments.length > 0 ? (
            <div className="space-y-3">
              {upcomingAssignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                >
                  <div>
                    <h4 className="font-medium">{assignment.title}</h4>
                    <p className="text-sm text-gray-500">
                      {assignment.lesson.subject.name} • Class{" "}
                      {assignment.lesson.class.grade.level}-
                      {assignment.lesson.class.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
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
      <div className="w-full xl:w-1/3 flex flex-col gap-4">
        {/* QUICK STATS */}
        <div className="bg-white p-4 rounded-md">
          <h2 className="text-lg font-semibold mb-4">Quick Stats</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Children:</span>
              <span className="font-semibold">{students.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Classes:</span>
              <span className="font-semibold">
                {Array.from(new Set(students.map((s) => s.classId))).length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">
                Upcoming Assignments:
              </span>
              <span className="font-semibold">
                {upcomingAssignments.length}
              </span>
            </div>
          </div>
        </div>

        {/* RECENT RESULTS */}
        <div className="bg-white p-4 rounded-md">
          <h2 className="text-lg font-semibold mb-4">Recent Results</h2>
          {recentResults.length > 0 ? (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {recentResults.map((result) => (
                <div
                  key={result.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                >
                  <div>
                    <h4 className="font-medium text-sm">
                      {result.assignment?.title}
                    </h4>
                    <p className="text-xs text-gray-500">
                      {result.student.name} •{" "}
                      {result.assignment?.lesson.subject.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-blue-600">
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

        <Announcements />
      </div>
    </div>
  );
};

export default ParentPage;
