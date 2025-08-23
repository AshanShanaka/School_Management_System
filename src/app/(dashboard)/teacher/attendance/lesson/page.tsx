import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import SubjectAttendanceForm from "@/components/SubjectAttendanceForm";
import { Day } from "@prisma/client";

const TeacherLessonAttendancePage = async ({
  searchParams,
}: {
  searchParams: { lessonId?: string; date?: string };
}) => {
  const user = await getCurrentUser();
  const role = user?.role;
  const userId = user?.id;

  // Only teachers can access this page
  if (role !== "teacher") {
    redirect("/");
  }

  const selectedLessonId = searchParams.lessonId
    ? parseInt(searchParams.lessonId)
    : null;
  const selectedDate =
    searchParams.date || new Date().toISOString().split("T")[0];

  // Get current day of week for filtering lessons
  const currentDate = new Date(selectedDate);
  const dayNames = [
    "SUNDAY",
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
  ];
  const currentDay = dayNames[currentDate.getDay()] as Day;

  // Get teacher's lessons for the selected day
  const lessons = await prisma.lesson.findMany({
    where: {
      teacherId: user?.id,
      day: currentDay,
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

  // Get students for selected lesson
  let students: any[] = [];
  let selectedLesson = null;
  let existingAttendance: any[] = [];

  if (selectedLessonId) {
    selectedLesson = await prisma.lesson.findUnique({
      where: { id: selectedLessonId },
      include: {
        subject: true,
        class: {
          include: {
            grade: true,
          },
        },
      },
    });

    if (selectedLesson) {
      students = await prisma.student.findMany({
        where: { classId: selectedLesson.classId },
        orderBy: [{ surname: "asc" }, { name: "asc" }],
      });

      // Get existing attendance for the selected date and lesson
      const attendanceDate = new Date(selectedDate);
      attendanceDate.setHours(0, 0, 0, 0);
      const nextDay = new Date(attendanceDate);
      nextDay.setDate(nextDay.getDate() + 1);

      existingAttendance = await prisma.attendance.findMany({
        where: {
          lessonId: selectedLessonId,
          date: {
            gte: attendanceDate,
            lt: nextDay,
          },
        },
      });
    }
  }

  return (
    <div className="p-4">
      <div className="bg-white p-6 rounded-md">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Subject-wise Attendance</h1>
          <div className="text-sm text-gray-500">
            {new Date(selectedDate).toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </div>
        </div>

        {lessons.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>You have no lessons scheduled for {currentDay.toLowerCase()}.</p>
            <p className="mt-2">
              Please select a different day or contact administration.
            </p>
          </div>
        )}

        {lessons.length > 0 && (
          <SubjectAttendanceForm
            lessons={lessons}
            students={students}
            selectedLessonId={selectedLessonId}
            selectedDate={selectedDate}
            selectedLesson={selectedLesson}
            existingAttendance={existingAttendance}
          />
        )}
      </div>
    </div>
  );
};

export default TeacherLessonAttendancePage;
