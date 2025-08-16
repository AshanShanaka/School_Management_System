import Announcements from "@/components/Announcements";
import AttendanceDashboardContainer from "@/components/AttendanceDashboardContainer";
import BigCalendarContainer from "@/components/BigCalendarContainer";
import EventCalendar from "@/components/EventCalendar";
import Performance from "@/components/Performance";
import StudentAttendanceCard from "@/components/StudentAttendanceCard";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";

const StudentPage = async () => {
  const { userId } = auth();

  // Get student data with class and grade information
  const student = await prisma.student.findUnique({
    where: { id: userId! },
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
          students: { some: { id: userId! } },
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
    where: { studentId: userId! },
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
    <div className="p-4 flex gap-4 flex-col xl:flex-row">
      {/* LEFT */}
      <div className="w-full xl:w-2/3 flex flex-col gap-4">
        {/* STUDENT INFO CARDS */}
        <div className="flex gap-4 justify-between flex-wrap">
          {/* PROFILE CARD */}
          <div className="bg-lamaSky p-4 rounded-md flex gap-4 w-full md:w-[48%]">
            <Image
              src={student.img || "/noAvatar.png"}
              alt=""
              width={60}
              height={60}
              className="w-15 h-15 rounded-full object-cover"
            />
            <div className="flex flex-col justify-center">
              <h3 className="font-semibold">
                {student.name + " " + student.surname}
              </h3>
              <p className="text-xs text-gray-500">
                Class: {student.class.grade.level}-{student.class.name}
              </p>
              <p className="text-xs text-gray-500">ID: {student.username}</p>
            </div>
          </div>

          {/* ATTENDANCE CARD */}
          <div className="bg-white p-4 rounded-md flex gap-4 w-full md:w-[48%]">
            <Image src="/singleAttendance.png" alt="" width={24} height={24} />
            <Suspense fallback="loading...">
              <StudentAttendanceCard id={student.id} />
            </Suspense>
          </div>

          {/* CLASS INFO CARD */}
          <div className="bg-lamaPurple p-4 rounded-md flex gap-4 w-full md:w-[48%]">
            <Image src="/singleClass.png" alt="" width={24} height={24} />
            <div>
              <h3 className="font-semibold text-white">
                {student.class.grade.level}-{student.class.name}
              </h3>
              <p className="text-xs text-lamaPurpleLight">
                {student.class._count.students} students
              </p>
              <p className="text-xs text-lamaPurpleLight">
                {student.class._count.lessons} lessons
              </p>
            </div>
          </div>

          {/* QUICK ACTIONS CARD */}
          <div className="bg-lamaYellow p-4 rounded-md w-full md:w-[48%]">
            <h3 className="font-semibold mb-2">Quick Actions</h3>
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/list/assignments?classId=${student.classId}`}
                className="bg-white px-3 py-1 rounded text-xs hover:bg-gray-100"
              >
                View Assignments
              </Link>
              <Link
                href={`/list/results?studentId=${student.id}`}
                className="bg-white px-3 py-1 rounded text-xs hover:bg-gray-100"
              >
                My Results
              </Link>
              <Link
                href={`/list/lessons?classId=${student.classId}`}
                className="bg-white px-3 py-1 rounded text-xs hover:bg-gray-100"
              >
                Class Schedule
              </Link>
            </div>
          </div>
        </div>

        {/* ATTENDANCE DASHBOARD */}
        <AttendanceDashboardContainer />

        {/* SCHEDULE */}
        <div className="bg-white p-4 rounded-md h-[400px]">
          <h1 className="text-xl font-semibold mb-4">
            My Schedule - Class {student.class.grade.level}-{student.class.name}
          </h1>
          <BigCalendarContainer type="classId" id={student.classId} />
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
                      {assignment.lesson.subject.name}
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
        <EventCalendar />

        {/* RECENT RESULTS */}
        <div className="bg-white p-4 rounded-md">
          <h2 className="text-lg font-semibold mb-4">Recent Results</h2>
          {recentResults.length > 0 ? (
            <div className="space-y-3">
              {recentResults.map((result) => (
                <div
                  key={result.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                >
                  <div>
                    <h4 className="font-medium">{result.assignment?.title}</h4>
                    <p className="text-sm text-gray-500">
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

        <Performance />
        <Announcements />
      </div>
    </div>
  );
};

export default StudentPage;
