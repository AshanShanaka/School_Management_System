// API Route: /api/timetable/parent/[id] (GET)
// Get parent's children's timetables
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: parentId } = params;

    // Get parent with children
    const parent = await prisma.parent.findUnique({
      where: { id: parentId },
      include: {
        students: {
          include: {
            class: {
              include: {
                grade: true,
                classTeacher: {
                  select: {
                    id: true,
                    name: true,
                    surname: true,
                    phone: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!parent) {
      return NextResponse.json({ error: "Parent not found" }, { status: 404 });
    }

    if (parent.students.length === 0) {
      return NextResponse.json({
        parent: {
          id: parent.id,
          name: parent.name,
          surname: parent.surname,
        },
        children: [],
        message: "No children found for this parent",
      });
    }

    // Get timetables for all children
    const childrenTimetables = await Promise.all(
      parent.students.map(async (student) => {
        const timetable = await prisma.schoolTimetable.findFirst({
          where: {
            classId: student.classId,
            isActive: true,
          },
          include: {
            slots: {
              include: {
                subject: true,
                teacher: {
                  select: {
                    id: true,
                    name: true,
                    surname: true,
                  },
                },
              },
              orderBy: [{ day: "asc" }, { period: "asc" }],
            },
          },
        });

        return {
          student: {
            id: student.id,
            name: student.name,
            surname: student.surname,
            class: {
              id: student.class.id,
              name: student.class.name,
              gradeLevel: student.class.grade.level,
              classTeacher: student.class.classTeacher,
            },
          },
          timetable: timetable
            ? {
                id: timetable.id,
                academicYear: timetable.academicYear,
                term: timetable.term,
                slots: timetable.slots,
              }
            : null,
        };
      })
    );

    return NextResponse.json({
      parent: {
        id: parent.id,
        name: parent.name,
        surname: parent.surname,
      },
      children: childrenTimetables,
    });
  } catch (error) {
    console.error("Error fetching parent timetables:", error);
    return NextResponse.json(
      { error: "Failed to fetch parent timetables" },
      { status: 500 }
    );
  }
}
