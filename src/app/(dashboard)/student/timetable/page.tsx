// Student Timetable View - Shows their class timetable
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import StudentTimetableClient from "@/components/StudentTimetableClient";

export default async function StudentTimetablePage() {
  const user = await getCurrentUser();
  
  if (!user || user.role !== "student") {
    redirect("/login");
  }

  // Get student with class info
  const student = await prisma.student.findUnique({
    where: { id: user.id },
    include: {
      class: {
        include: {
          classTeacher: true,
          grade: true,
        },
      },
    },
  });

  if (!student) {
    redirect("/login");
  }

  // Get timetable for student's class
  const timetable = await prisma.schoolTimetable.findFirst({
    where: {
      classId: student.classId,
      isActive: true,
    },
    include: {
      slots: {
        include: {
          subject: true,
          teacher: true,
        },
        orderBy: [
          { day: "asc" },
          { period: "asc" },
        ],
      },
    },
  });

  // Serialize data
  const serializedStudent = JSON.parse(JSON.stringify(student));
  const serializedTimetable = timetable ? JSON.parse(JSON.stringify(timetable)) : null;

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      <StudentTimetableClient
        student={serializedStudent}
        timetable={serializedTimetable}
      />
    </div>
  );
}
