import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get existing data
    const subjects = await prisma.subject.findMany();
    const teachers = await prisma.teacher.findMany();
    const classes = await prisma.class.findMany();

    if (subjects.length === 0 || teachers.length === 0 || classes.length === 0) {
      return NextResponse.json(
        { error: "Need subjects, teachers, and classes in the database first" },
        { status: 400 }
      );
    }

    // Create some sample assignments
    const assignments = [];
    let assignmentCount = 0;

    for (const cls of classes.slice(0, 5)) { // Limit to first 5 classes
      for (const subject of subjects.slice(0, Math.min(5, subjects.length))) {
        const randomTeacher = teachers[Math.floor(Math.random() * teachers.length)];
        
        try {
          const assignment = await prisma.subjectAssignment.create({
            data: {
              subjectId: subject.id,
              teacherId: randomTeacher.id,
              classId: cls.id,
            },
            include: {
              subject: true,
              teacher: {
                select: {
                  id: true,
                  name: true,
                  surname: true,
                },
              },
              class: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          });
          assignments.push(assignment);
          assignmentCount++;
        } catch (error) {
          // Skip if assignment already exists
          console.log(`Assignment already exists for ${subject.name} in ${cls.name}`);
        }
      }
    }

    return NextResponse.json({
      message: `Created ${assignmentCount} subject assignments`,
      assignments: assignments,
    });
  } catch (error) {
    console.error("Error creating sample assignments:", error);
    return NextResponse.json(
      { error: "Failed to create sample assignments" },
      { status: 500 }
    );
  }
}
