import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user || (user.role !== "admin" && user.role !== "teacher")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const subject = await prisma.subject.findUnique({
      where: { id: parseInt(params.id) },
      include: {
        teachers: {
          select: {
            id: true,
            name: true,
            surname: true,
            email: true,
          },
        },
        lessons: true,
        subjectAssignments: true,
        examSubjects: true,
        _count: {
          select: {
            teachers: true,
            lessons: true,
            subjectAssignments: true,
            examSubjects: true,
          },
        },
      },
    });

    if (!subject) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 });
    }

    return NextResponse.json({ subject });
  } catch (error) {
    console.error("Subject GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch subject" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, code, teachers } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Subject name is required" },
        { status: 400 }
      );
    }

    // Check if subject exists
    const existingSubject = await prisma.subject.findUnique({
      where: { id: parseInt(params.id) },
    });

    if (!existingSubject) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 });
    }

    // Check for duplicate name or code (excluding current subject)
    const duplicateCheck = await prisma.subject.findFirst({
      where: {
        AND: [
          { id: { not: parseInt(params.id) } },
          {
            OR: [
              { name: name },
              ...(code ? [{ code: code }] : []),
            ],
          },
        ],
      },
    });

    if (duplicateCheck) {
      return NextResponse.json(
        { error: "Subject name or code already exists" },
        { status: 400 }
      );
    }

    // Update subject
    const updatedSubject = await prisma.subject.update({
      where: { id: parseInt(params.id) },
      data: {
        name,
        code: code || null,
        ...(teachers && {
          teachers: {
            set: teachers.map((teacherId: string) => ({ id: teacherId })),
          },
        }),
      },
      include: {
        teachers: true,
      },
    });

    return NextResponse.json({
      message: "Subject updated successfully",
      subject: updatedSubject,
    });
  } catch (error) {
    console.error("Subject UPDATE error:", error);
    return NextResponse.json(
      { error: "Failed to update subject" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const subjectId = parseInt(params.id);

    // Check if subject exists
    const existingSubject = await prisma.subject.findUnique({
      where: { id: subjectId },
      include: {
        lessons: true,
        subjectAssignments: true,
        examSubjects: true,
        subjectAllocations: true,
        _count: {
          select: {
            lessons: true,
            subjectAssignments: true,
            examSubjects: true,
            subjectAllocations: true,
          },
        },
      },
    });

    if (!existingSubject) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 });
    }

    // Check if subject has associated data
    const totalDependencies = 
      existingSubject._count.lessons +
      existingSubject._count.subjectAssignments +
      existingSubject._count.examSubjects +
      existingSubject._count.subjectAllocations;

    if (totalDependencies > 0) {
      const dependencyDetails = [];
      if (existingSubject._count.lessons > 0) {
        dependencyDetails.push(`${existingSubject._count.lessons} lesson(s)`);
      }
      if (existingSubject._count.subjectAssignments > 0) {
        dependencyDetails.push(`${existingSubject._count.subjectAssignments} assignment(s)`);
      }
      if (existingSubject._count.examSubjects > 0) {
        dependencyDetails.push(`${existingSubject._count.examSubjects} exam(s)`);
      }
      if (existingSubject._count.subjectAllocations > 0) {
        dependencyDetails.push(`${existingSubject._count.subjectAllocations} allocation(s)`);
      }

      return NextResponse.json(
        {
          error: "Cannot delete subject with associated data",
          hasDependencies: true,
          dependencyCount: totalDependencies,
          dependencyDetails: dependencyDetails.join(", "),
          message: `This subject has ${dependencyDetails.join(", ")}. Please remove or reassign them first.`,
        },
        { status: 400 }
      );
    }

    // Delete subject (teacher associations will be removed automatically due to many-to-many)
    await prisma.subject.delete({
      where: { id: subjectId },
    });

    return NextResponse.json({
      message: "Subject deleted successfully",
    });
  } catch (error) {
    console.error("Subject DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete subject" },
      { status: 500 }
    );
  }
}
