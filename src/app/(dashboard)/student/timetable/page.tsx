import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { notFound } from "next/navigation";
import TimetableView from "@/components/TimetableView";

const StudentTimetablePage = async () => {
  const user = await getCurrentUser();
  const role = user?.role;

  if (role !== "student") {
    return notFound();
  }

  // Get the student's basic info
  const student = await prisma.student.findUnique({
    where: { id: user?.id },
  });

  if (!student) {
    return notFound();
  }

  // Get the student's class and active timetable
  const classData = await prisma.class.findUnique({
    where: { id: student.classId },
    include: {
      grade: true,
    },
  });

  if (!classData) {
    return notFound();
  }

  // Get active timetable for the class
  const timetable = await prisma.timetable.findFirst({
    where: {
      classId: student.classId,
      isActive: true,
    },
    include: {
      class: {
        include: {
          grade: true,
        },
      },
      slots: {
        include: {
          subject: true,
          teacher: true,
        },
        orderBy: [{ day: "asc" }, { period: "asc" }],
      },
    },
  });

  if (!timetable) {
    return (
      <div className="p-4">
        <div className="bg-white p-6 rounded-md text-center">
          <h1 className="text-xl font-semibold mb-4">My Timetable</h1>
          <p className="text-gray-500">
            No active timetable found for your class.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 flex flex-col gap-6">
      {/* HEADER */}
      <div className="bg-white p-6 rounded-md">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">My Timetable</h1>
            <p className="text-gray-500">
              Grade {classData.grade.level}-{classData.name} •{" "}
              {timetable.academicYear}
            </p>
            <div className="mt-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                Active Timetable
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* TIMETABLE VIEW */}
      <TimetableView timetable={timetable} userRole={role} />
    </div>
  );
};

export default StudentTimetablePage;
