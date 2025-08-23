import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import TimetableBasedAttendance from "@/components/TimetableBasedAttendance";
import DateSelector from "@/components/DateSelector";

const TimetableAttendancePage = async ({
  searchParams,
}: {
  searchParams: { slotId?: string; date?: string };
}) => {
  const user = await getCurrentUser();
  const role = user?.role;
  const userId = user?.id;

  // Only admin and teachers can take attendance
  if (role !== "admin" && role !== "teacher") {
    redirect("/");
  }

  const selectedSlotId = searchParams.slotId
    ? parseInt(searchParams.slotId)
    : undefined;
  const selectedDate =
    searchParams.date || new Date().toISOString().split("T")[0];

  // Get current day of the week
  const currentDay = new Date(selectedDate)
    .toLocaleDateString("en-US", { weekday: "long" })
    .toUpperCase();

  // Check if it's a valid school day (Monday to Friday)
  const validSchoolDays = [
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
  ];
  const isSchoolDay = validSchoolDays.includes(currentDay);

  // Get teacher's timetable slots for the current day
  let currentSlots: any[] = [];
  let students: any[] = [];
  let existingAttendance: any[] = [];

  if (isSchoolDay && role === "teacher") {
    // Get teacher's slots for the selected date/day
    currentSlots = await prisma.timetableSlot.findMany({
      where: {
        teacherId: user?.id,
        day: currentDay as any,
        isBreak: false,
        timetable: {
          isActive: true,
        },
      },
      include: {
        subject: true,
        teacher: true,
        timetable: {
          include: {
            class: {
              include: {
                grade: true,
                students: {
                  orderBy: [{ surname: "asc" }, { name: "asc" }],
                },
              },
            },
          },
        },
      },
      orderBy: [{ period: "asc" }],
    });
  } else if (isSchoolDay && role === "admin") {
    // Admin can see all slots for the day
    currentSlots = await prisma.timetableSlot.findMany({
      where: {
        day: currentDay as any,
        isBreak: false,
        timetable: {
          isActive: true,
        },
      },
      include: {
        subject: true,
        teacher: true,
        timetable: {
          include: {
            class: {
              include: {
                grade: true,
                students: {
                  orderBy: [{ surname: "asc" }, { name: "asc" }],
                },
              },
            },
          },
        },
      },
      orderBy: [{ period: "asc" }],
    });
  }

  // If a specific slot is selected, get students and existing attendance
  if (selectedSlotId) {
    const selectedSlot = currentSlots.find(
      (slot) => slot.id === selectedSlotId
    );
    if (selectedSlot) {
      students = selectedSlot.timetable.class.students;

      // Find the lesson for this slot
      const lesson = await prisma.lesson.findFirst({
        where: {
          ...(selectedSlot.subjectId && { subjectId: selectedSlot.subjectId }),
          classId: selectedSlot.timetable.classId,
          ...(selectedSlot.teacherId && { teacherId: selectedSlot.teacherId }),
          day: selectedSlot.day,
          startTime: {
            equals: new Date(`1970-01-01T${selectedSlot.startTime}:00`),
          },
          endTime: {
            equals: new Date(`1970-01-01T${selectedSlot.endTime}:00`),
          },
        },
      });

      if (lesson) {
        // Get existing attendance for the selected date
        const attendanceDate = new Date(selectedDate);
        attendanceDate.setHours(0, 0, 0, 0);
        const nextDay = new Date(attendanceDate);
        nextDay.setDate(nextDay.getDate() + 1);

        existingAttendance = await prisma.attendance.findMany({
          where: {
            lessonId: lesson.id,
            date: {
              gte: attendanceDate,
              lt: nextDay,
            },
          },
        });
      }
    }
  }

  return (
    <div className="p-4">
      <div className="bg-white p-6 rounded-md">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Timetable-Based Attendance</h1>
            <p className="text-gray-500 mt-1">
              Take attendance according to your teaching schedule
            </p>
          </div>
          <div className="text-sm text-gray-500">
            {new Date(selectedDate).toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </div>
        </div>

        {/* Date Selection */}
        <DateSelector
          selectedDate={selectedDate}
          currentDay={currentDay}
          isSchoolDay={isSchoolDay}
        />

        {!isSchoolDay ? (
          <div className="bg-orange-50 border border-orange-200 p-6 rounded-md text-center">
            <div className="flex items-center justify-center gap-3 mb-3">
              <span className="text-2xl">📅</span>
              <h3 className="text-lg font-semibold text-orange-800">
                No School Activities
              </h3>
            </div>
            <p className="text-orange-700">
              {currentDay === "SATURDAY" || currentDay === "SUNDAY"
                ? "School attendance is not taken on weekends."
                : "No school activities scheduled for this day."}
            </p>
            <p className="text-sm text-orange-600 mt-2">
              Please select a weekday (Monday to Friday) to take attendance.
            </p>
          </div>
        ) : (
          <TimetableBasedAttendance
            currentSlots={currentSlots}
            students={students}
            selectedSlotId={selectedSlotId}
            selectedDate={selectedDate}
            existingAttendance={existingAttendance}
            teacherId={userId || ""}
          />
        )}
      </div>
    </div>
  );
};

export default TimetableAttendancePage;
