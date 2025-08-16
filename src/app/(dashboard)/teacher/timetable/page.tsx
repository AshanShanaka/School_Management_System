import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import TimetableView from "@/components/TimetableView";

const TeacherTimetablePage = async () => {
  const { sessionClaims, userId } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  if (role !== "teacher") {
    return notFound();
  }

  // Get teacher data
  const teacher = await prisma.teacher.findUnique({
    where: { id: userId! },
    include: {
      subjects: {
        include: {
          _count: {
            select: { lessons: true },
          },
        },
      },
    },
  });

  if (!teacher) {
    return notFound();
  }

  // Get all timetables where this teacher is assigned
  const timetables = await prisma.timetable.findMany({
    where: {
      isActive: true,
      slots: {
        some: {
          teacherId: teacher.id,
        },
      },
    },
    include: {
      class: {
        include: {
          grade: true,
        },
      },
      slots: {
        where: {
          teacherId: teacher.id,
        },
        include: {
          subject: true,
          teacher: true,
        },
        orderBy: [{ day: "asc" }, { period: "asc" }],
      },
    },
  });

  if (!timetables.length) {
    return (
      <div className="p-4">
        <div className="bg-white p-6 rounded-md text-center">
          <h1 className="text-xl font-semibold mb-4">My Teaching Schedule</h1>
          <p className="text-gray-500">
            No active timetables found. Please contact administration.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 flex flex-col gap-6">
      {/* HEADER */}
      <div className="bg-white p-6 rounded-md">
        <h1 className="text-2xl font-bold">My Teaching Schedule</h1>
        <p className="text-gray-500">
          View your assigned classes and teaching periods
        </p>
        <div className="mt-4 flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-lamaSky rounded"></div>
            <span>Your Classes</span>
          </div>
        </div>
      </div>

      {/* TEACHER'S TIMETABLES */}
      {timetables.map((timetable) => (
        <div key={timetable.id} className="space-y-4">
          <div className="bg-lamaSky p-4 rounded-md">
            <h2 className="text-xl font-semibold text-white">
              Grade {timetable.class.grade.level}-{timetable.class.name}
            </h2>
            <p className="text-lamaSkyLight">
              Academic Year: {timetable.academicYear}
            </p>
          </div>

          <TimetableView timetable={timetable} userRole={role} />
        </div>
      ))}
    </div>
  );
};

export default TeacherTimetablePage;
