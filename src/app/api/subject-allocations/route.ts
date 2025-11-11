import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// GET /api/subject-allocations - Get all subject allocations
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const gradeId = searchParams.get("gradeId");
    const classId = searchParams.get("classId");

    const whereClause: any = {};
    if (gradeId) whereClause.gradeId = parseInt(gradeId);
    if (classId) whereClause.classId = parseInt(classId);

    const allocations = await prisma.subjectAllocation.findMany({
      where: whereClause,
      include: {
        subject: true,
        grade: true,
        class: true,
      },
      orderBy: [
        { grade: { level: "asc" } },
        { class: { name: "asc" } },
        { subject: { name: "asc" } },
      ],
    });

    return NextResponse.json(allocations);
  } catch (error) {
    console.error("Error fetching subject allocations:", error);
    return NextResponse.json(
      { error: "Failed to fetch subject allocations" },
      { status: 500 }
    );
  }
}

// POST /api/subject-allocations - Create or update subject allocation
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { gradeId, classId, subjectId, periodsPerWeek } = body;

    // Validate required fields
    if (!gradeId || !classId || !subjectId || periodsPerWeek === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if allocation already exists
    const existingAllocation = await prisma.subjectAllocation.findUnique({
      where: {
        gradeId_classId_subjectId: {
          gradeId: parseInt(gradeId),
          classId: parseInt(classId),
          subjectId: parseInt(subjectId),
        },
      },
    });

    let allocation;
    if (existingAllocation) {
      // Update existing allocation
      allocation = await prisma.subjectAllocation.update({
        where: { id: existingAllocation.id },
        data: { periodsPerWeek: parseInt(periodsPerWeek) },
        include: {
          subject: true,
          grade: true,
          class: true,
        },
      });
    } else {
      // Create new allocation
      allocation = await prisma.subjectAllocation.create({
        data: {
          gradeId: parseInt(gradeId),
          classId: parseInt(classId),
          subjectId: parseInt(subjectId),
          periodsPerWeek: parseInt(periodsPerWeek),
        },
        include: {
          subject: true,
          grade: true,
          class: true,
        },
      });
    }

    return NextResponse.json(allocation);
  } catch (error) {
    console.error("Error creating/updating subject allocation:", error);
    return NextResponse.json(
      { error: "Failed to create/update subject allocation" },
      { status: 500 }
    );
  }
}

// PUT /api/subject-allocations - Bulk update subject allocations
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { allocations } = body;

    if (!Array.isArray(allocations)) {
      return NextResponse.json(
        { error: "Allocations must be an array" },
        { status: 400 }
      );
    }

    // Use transaction for bulk updates
    const result = await prisma.$transaction(async (tx) => {
      const updatedAllocations = [];

      for (const allocation of allocations) {
        const { gradeId, classId, subjectId, periodsPerWeek } = allocation;

        const existingAllocation = await tx.subjectAllocation.findUnique({
          where: {
            gradeId_classId_subjectId: {
              gradeId: parseInt(gradeId),
              classId: parseInt(classId),
              subjectId: parseInt(subjectId),
            },
          },
        });

        let updated;
        if (existingAllocation) {
          updated = await tx.subjectAllocation.update({
            where: { id: existingAllocation.id },
            data: { periodsPerWeek: parseInt(periodsPerWeek) },
            include: {
              subject: true,
              grade: true,
              class: true,
            },
          });
        } else {
          updated = await tx.subjectAllocation.create({
            data: {
              gradeId: parseInt(gradeId),
              classId: parseInt(classId),
              subjectId: parseInt(subjectId),
              periodsPerWeek: parseInt(periodsPerWeek),
            },
            include: {
              subject: true,
              grade: true,
              class: true,
            },
          });
        }

        updatedAllocations.push(updated);
      }

      return updatedAllocations;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error bulk updating subject allocations:", error);
    return NextResponse.json(
      { error: "Failed to bulk update subject allocations" },
      { status: 500 }
    );
  }
}
