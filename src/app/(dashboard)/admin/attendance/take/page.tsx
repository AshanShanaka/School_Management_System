import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import AttendanceForm from "@/components/AttendanceForm";

const TakeAttendancePage = async ({
  searchParams,
}: {
  searchParams: { classId?: string; date?: string };
}) => {
  const { sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  // Only admin and teachers can take attendance
  if (role !== "admin" && role !== "teacher") {
    redirect("/");
  }

  const selectedClassId = searchParams.classId
    ? parseInt(searchParams.classId)
    : null;
  const selectedDate =
    searchParams.date || new Date().toISOString().split("T")[0];

  // Get all classes for the dropdown
  const classes = await prisma.class.findMany({
    include: {
      grade: true,
      _count: { select: { students: true } },
    },
    orderBy: [{ grade: { level: "asc" } }, { name: "asc" }],
  });

  // Get students for selected class
  let students: any[] = [];
  let selectedClass = null;
  let existingAttendance: any[] = [];

  if (selectedClassId) {
    selectedClass = await prisma.class.findUnique({
      where: { id: selectedClassId },
      include: {
        grade: true,
      },
    });

    students = await prisma.student.findMany({
      where: { classId: selectedClassId },
      orderBy: [{ surname: "asc" }, { name: "asc" }],
    });

    // Get existing attendance for the selected date
    const attendanceDate = new Date(selectedDate);
    attendanceDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(attendanceDate);
    nextDay.setDate(nextDay.getDate() + 1);

    existingAttendance = await prisma.attendance.findMany({
      where: {
        studentId: { in: students.map((s) => s.id) },
        date: {
          gte: attendanceDate,
          lt: nextDay,
        },
      },
    });
  }

  return (
    <div className="p-4">
      <div className="bg-white p-6 rounded-md">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Take Attendance</h1>
          <div className="text-sm text-gray-500">
            {new Date(selectedDate).toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </div>
        </div>

        <AttendanceForm
          classes={classes}
          students={students}
          selectedClassId={selectedClassId}
          selectedDate={selectedDate}
          selectedClass={selectedClass}
          existingAttendance={existingAttendance}
        />
      </div>
    </div>
  );
};

export default TakeAttendancePage;
