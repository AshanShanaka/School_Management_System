import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { notFound } from "next/navigation";
// import TimetableView from "@/components/TimetableView";
import Image from "next/image";

export default async function ParentTimetablePage() {
  const user = await getCurrentUser();
  const role = user?.role;

  if (role !== "parent") {
    return notFound();
  }

  // Get parent's children
  const children = await prisma.student.findMany({
    where: { parentId: user?.id },
    include: {
      class: {
        include: {
          grade: true,
        },
      },
    },
  });

  if (!children.length) {
    return (
      <div className="p-4">
        <div className="bg-white p-6 rounded-md text-center">
          <h1 className="text-xl font-semibold mb-4">
            My Children&apos;s Timetables
          </h1>
          <p className="text-gray-500">No children found in the system.</p>
        </div>
      </div>
    );
  }

  // Get timetables for all children's classes
  const classIds = children.map((child) => child.classId);
  const timetables = await prisma.timetable.findMany({
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

  return (
    <div className="p-4 flex flex-col gap-6">
      {/* HEADER */}
      <div className="bg-white p-6 rounded-md">
        <h1 className="text-2xl font-bold">My Children&apos;s Timetables</h1>
        <p className="text-gray-500">
          View the class schedules for all your children
        </p>
      </div>

      {/* CHILDREN'S TIMETABLES */}
      {children.map((child) => {
        const childTimetable = timetables.find(
          (t) => t.classId === child.classId
        );

        if (!childTimetable) {
          return (
            <div key={child.id} className="bg-white p-6 rounded-md">
              <h2 className="text-xl font-semibold mb-4">
                {child.name} {child.surname} - Grade {child.class.grade.level}-
                {child.class.name}
              </h2>
              <p className="text-gray-500">
                No active timetable found for this class.
              </p>
            </div>
          );
        }

        return (
          <div key={child.id} className="space-y-4">
            <div className="bg-lamaSky p-4 rounded-md">
              <div className="flex items-center gap-4">
                <Image
                  src={child.img || "/noAvatar.png"}
                  alt=""
                  width={60}
                  height={60}
                  className="w-15 h-15 rounded-full object-cover"
                />
                <div>
                  <h2 className="text-xl font-semibold text-white">
                    {child.name} {child.surname}
                  </h2>
                  <p className="text-lamaSkyLight">
                    Grade {child.class.grade.level}-{child.class.name} •{" "}
                    {childTimetable.academicYear}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-md">
              <p className="text-gray-500">
                Timetable view temporarily disabled for maintenance.
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
