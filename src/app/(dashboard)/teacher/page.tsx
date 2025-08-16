import Announcements from "@/components/Announcements";
import BigCalendarContainer from "@/components/BigCalendarContainer";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import Image from "next/image";
import Link from "next/link";

const TeacherPage = async () => {
  const { userId } = auth();

  // Get teacher data
  const teacher = await prisma.teacher.findUnique({
    where: { id: userId! },
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

  // Get upcoming lessons
  const upcomingLessons = await prisma.lesson.findMany({
    where: {
      teacherId: userId!,
      startTime: { gte: new Date() },
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
    take: 5,
  });

  // Get assignments that need grading
  const assignmentsToGrade = await prisma.assignment.findMany({
    where: {
      lesson: {
        teacherId: userId!,
      },
      results: {
        none: {},
      },
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
    take: 5,
  });

  // Get recent student submissions
  const recentSubmissions = await prisma.result.findMany({
    where: {
      assignment: {
        lesson: {
          teacherId: userId!,
        },
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
    take: 8,
  });

  if (!teacher) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-500">Teacher profile not found.</p>
      </div>
    );
  }

  return (
    <div className="p-4 flex gap-4 flex-col xl:flex-row">
      {/* LEFT */}
      <div className="w-full xl:w-2/3 flex flex-col gap-4">
        {/* TEACHER INFO CARDS */}
        <div className="flex gap-4 justify-between flex-wrap">
          {/* PROFILE CARD */}
          <div className="bg-lamaSky p-4 rounded-md flex gap-4 w-full md:w-[48%]">
            <Image
              src={teacher.img || "/noAvatar.png"}
              alt=""
              width={60}
              height={60}
              className="w-15 h-15 rounded-full object-cover"
            />
            <div className="flex flex-col justify-center">
              <h3 className="font-semibold">
                {teacher.name + " " + teacher.surname}
              </h3>
              <p className="text-xs text-gray-500">
                Teacher ID: {teacher.username}
              </p>
              <p className="text-xs text-gray-500">
                {teacher.subjects.map((s) => s.name).join(", ")}
              </p>
            </div>
          </div>

          {/* QUICK STATS CARD */}
          <div className="bg-lamaPurple p-4 rounded-md w-full md:w-[48%]">
            <h3 className="font-semibold text-white mb-2">Quick Stats</h3>
            <div className="space-y-1">
              <p className="text-xs text-lamaPurpleLight">
                Classes: {teacher._count.classes}
              </p>
              <p className="text-xs text-lamaPurpleLight">
                Subjects: {teacher._count.subjects}
              </p>
              <p className="text-xs text-lamaPurpleLight">
                Lessons: {teacher._count.lessons}
              </p>
            </div>
          </div>

          {/* CLASSES OVERVIEW */}
          <div className="bg-lamaYellow p-4 rounded-md w-full">
            <h3 className="font-semibold mb-2">My Classes</h3>
            <div className="flex flex-wrap gap-2">
              {teacher.classes.map((classItem) => (
                <Link
                  key={classItem.id}
                  href={`/list/students?classId=${classItem.id}`}
                  className="bg-white px-3 py-1 rounded text-xs hover:bg-gray-100"
                >
                  {classItem.grade.level}-{classItem.name} (
                  {classItem._count.students} students)
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* SCHEDULE */}
        <div className="bg-white p-4 rounded-md h-[400px]">
          <h1 className="text-xl font-semibold mb-4">My Teaching Schedule</h1>
          <BigCalendarContainer type="teacherId" id={userId!} />
        </div>

        {/* UPCOMING LESSONS */}
        <div className="bg-white p-4 rounded-md">
          <h2 className="text-lg font-semibold mb-4">Upcoming Lessons</h2>
          {upcomingLessons.length > 0 ? (
            <div className="space-y-3">
              {upcomingLessons.map((lesson) => (
                <div
                  key={lesson.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                >
                  <div>
                    <h4 className="font-medium">{lesson.name}</h4>
                    <p className="text-sm text-gray-500">
                      {lesson.subject.name} • Class {lesson.class.grade.level}-
                      {lesson.class.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {new Intl.DateTimeFormat("en-US", {
                        month: "short",
                        day: "numeric",
                      }).format(lesson.startTime)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Intl.DateTimeFormat("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      }).format(lesson.startTime)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No upcoming lessons</p>
          )}
        </div>

        {/* ASSIGNMENTS TO GRADE */}
        <div className="bg-white p-4 rounded-md">
          <h2 className="text-lg font-semibold mb-4">
            Assignments Needing Grading
          </h2>
          {assignmentsToGrade.length > 0 ? (
            <div className="space-y-3">
              {assignmentsToGrade.map((assignment) => (
                <div
                  key={assignment.id}
                  className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-md"
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
                    <p className="text-sm text-red-600 font-medium">Due:</p>
                    <p className="text-xs text-gray-500">
                      {new Intl.DateTimeFormat("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      }).format(assignment.dueDate)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No assignments pending grading</p>
          )}
        </div>
      </div>

      {/* RIGHT */}
      <div className="w-full xl:w-1/3 flex flex-col gap-4">
        {/* QUICK ACTIONS */}
        <div className="bg-white p-4 rounded-md">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="space-y-2">
            <Link
              href="/list/lessons"
              className="block w-full bg-blue-500 text-white text-center py-2 rounded hover:bg-blue-600"
            >
              Manage Lessons
            </Link>
            <Link
              href="/list/assignments"
              className="block w-full bg-green-500 text-white text-center py-2 rounded hover:bg-green-600"
            >
              Manage Assignments
            </Link>
            <Link
              href="/list/results"
              className="block w-full bg-purple-500 text-white text-center py-2 rounded hover:bg-purple-600"
            >
              View Results
            </Link>
            <Link
              href="/list/students"
              className="block w-full bg-orange-500 text-white text-center py-2 rounded hover:bg-orange-600"
            >
              View Students
            </Link>
          </div>
        </div>

        {/* RECENT SUBMISSIONS */}
        <div className="bg-white p-4 rounded-md">
          <h2 className="text-lg font-semibold mb-4">Recent Submissions</h2>
          {recentSubmissions.length > 0 ? (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {recentSubmissions.map((result) => (
                <div
                  key={result.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                >
                  <div>
                    <h4 className="font-medium text-sm">
                      {result.assignment?.title}
                    </h4>
                    <p className="text-xs text-gray-500">
                      {result.student.name} {result.student.surname}
                    </p>
                    <p className="text-xs text-gray-500">
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
            <p className="text-gray-500">No recent submissions</p>
          )}
        </div>

        <Announcements />
      </div>
    </div>
  );
};

export default TeacherPage;
