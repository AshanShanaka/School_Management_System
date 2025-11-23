import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import ParentTimetableClient from "@/components/ParentTimetableClient";

export default async function ParentTimetablePage() {
  const user = await getCurrentUser();

  if (!user || user.role !== "parent") {
    redirect("/login");
  }

  // Get parent's children
  const children = await prisma.student.findMany({
    where: { parentId: user.id },
    include: {
      class: {
        include: {
          grade: true,
        },
      },
    },
  });

  // Get timetables for all children's classes
  const classIds = children.map((child) => child.classId);
  const timetables = await prisma.schoolTimetable.findMany({
    where: {
      classId: { in: classIds },
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

  // Serialize data
  const serializedChildren = JSON.parse(JSON.stringify(children));
  const serializedTimetables = JSON.parse(JSON.stringify(timetables));

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      <ParentTimetableClient
        children={serializedChildren}
        timetables={serializedTimetables}
      />
    </div>
  );
}
