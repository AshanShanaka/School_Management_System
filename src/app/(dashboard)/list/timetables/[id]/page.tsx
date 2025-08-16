import FormContainer from "@/components/FormContainer";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TIMETABLE_CONFIG } from "@/lib/timetableConfig";

const TimetableDetailPage = async ({
  params: { id },
}: {
  params: { id: string };
}) => {
  const { sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  // Get timetable with all related data
  const timetable = await prisma.timetable.findUnique({
    where: { id: parseInt(id) },
  });

  if (!timetable) {
    return notFound();
  }

  // Get class and grade info separately
  const classInfo = await prisma.class.findUnique({
    where: { id: timetable.classId },
    include: {
      grade: true,
    },
  });

  // Get timetable slots
  const slots = await prisma.timetableSlot.findMany({
    where: { timetableId: timetable.id },
    include: {
      subject: true,
      teacher: true,
    },
    orderBy: [{ day: "asc" }, { period: "asc" }],
  });

  const getSlotForDayAndPeriod = (day: string, period: number) => {
    return slots.find((slot) => slot.day === day && slot.period === period);
  };

  const days = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"];

  return (
    <div className="p-4 flex flex-col gap-6">
      {/* HEADER */}
      <div className="bg-white p-6 rounded-md">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{timetable.name}</h1>
            <p className="text-gray-500">
              Grade {classInfo?.grade.level}-{classInfo?.name} •{" "}
              {timetable.academicYear}
            </p>
            <div className="mt-2">
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  timetable.isActive
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {timetable.isActive ? "Active" : "Inactive"}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            {role === "admin" && (
              <>
                <FormContainer
                  table="timetable"
                  type="update"
                  data={timetable}
                />
                <Link href="/admin/timetable/create">
                  <button className="bg-lamaPurple text-white px-4 py-2 rounded-md hover:bg-lamaPurpleLight">
                    Create New
                  </button>
                </Link>
              </>
            )}
            <Link href="/list/timetables">
              <button className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600">
                Back to List
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* TIMETABLE VIEW */}
      <div className="bg-white p-6 rounded-md overflow-x-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Weekly Timetable</h2>
        </div>

        <div className="min-w-[800px]">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-300 p-3 text-left font-semibold">
                  Time
                </th>
                {days.map((day) => (
                  <th
                    key={day}
                    className="border border-gray-300 p-3 text-center font-semibold"
                  >
                    {day.charAt(0) + day.slice(1).toLowerCase()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TIMETABLE_CONFIG.timeSlots.map((timeSlot, index) => {
                const period = timeSlot.period;
                const isBreak = timeSlot.isBreak;

                return (
                  <tr key={period} className={isBreak ? "bg-yellow-50" : ""}>
                    <td className="border border-gray-300 p-3 font-medium text-sm">
                      <div>
                        {timeSlot.startTime} - {timeSlot.endTime}
                      </div>
                      <div className="text-xs text-gray-500">
                        {isBreak ? "Break Time" : `Period ${period}`}
                      </div>
                    </td>
                    {days.map((day) => {
                      if (isBreak) {
                        return (
                          <td
                            key={day}
                            className="border border-gray-300 p-3 text-center bg-yellow-100"
                          >
                            <div className="text-sm font-medium text-yellow-800">
                              Break Time
                            </div>
                          </td>
                        );
                      }

                      const slot = getSlotForDayAndPeriod(day, period);

                      return (
                        <td
                          key={day}
                          className="border border-gray-300 p-2 text-center"
                        >
                          {slot?.subject ? (
                            <div className="bg-lamaSkyLight p-2 rounded text-xs">
                              <div className="font-semibold">
                                {slot.subject.name}
                              </div>
                              {slot.teacher && (
                                <div className="text-gray-600">
                                  {slot.teacher.name} {slot.teacher.surname}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-gray-400 text-xs">-</div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* SUBJECTS LIST */}
      <div className="bg-white p-6 rounded-md">
        <h2 className="text-xl font-semibold mb-4">
          Subjects in this Timetable
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from(
            new Set(
              slots
                .filter((slot) => slot.subject)
                .map((slot) => slot.subject!.name)
            )
          ).map((subjectName) => {
            const subjectSlots = slots.filter(
              (slot) => slot.subject?.name === subjectName
            );
            const firstSlot = subjectSlots[0];

            return (
              <div
                key={subjectName}
                className="border border-gray-200 p-4 rounded-md"
              >
                <h3 className="font-semibold">{subjectName}</h3>
                {firstSlot?.teacher && (
                  <p className="text-sm text-gray-600">
                    Teacher: {firstSlot.teacher.name}{" "}
                    {firstSlot.teacher.surname}
                  </p>
                )}
                <p className="text-xs text-gray-500">
                  {subjectSlots.length} lesson
                  {subjectSlots.length !== 1 ? "s" : ""} per week
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TimetableDetailPage;
