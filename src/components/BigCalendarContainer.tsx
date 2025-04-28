import prisma from "@/lib/prisma";
import BigCalendar from "./BigCalender";
import { adjustScheduleToCurrentWeek } from "@/lib/utils";

const BigCalendarContainer = async ({
  type,
  id,
}: {
  type: "teacherId" | "classId";
  id: string | number;
}) => {
  const dataRes = await prisma.lesson.findMany({
    where: {
      ...(type === "teacherId"
        ? { teacherId: id as string }
        : { classId: id as number }),
    },
    include: {
      subject: true,
      class: true,
    },
  });

  const data = dataRes.map((lesson) => ({
    title: `${lesson.name} (${lesson.subject.name} - ${lesson.class.name})`,
    start: new Date(lesson.startTime),
    end: new Date(lesson.endTime),
  }));

  const schedule = adjustScheduleToCurrentWeek(data);

  return (
    <div className="h-[600px]">
      <BigCalendar data={schedule} />
    </div>
  );
};

export default BigCalendarContainer;
