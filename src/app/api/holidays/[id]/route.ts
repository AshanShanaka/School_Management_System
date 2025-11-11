import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// DELETE - Delete a holiday
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await prisma.holiday.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting holiday:", error);
    return NextResponse.json(
      { error: "Failed to delete holiday" },
      { status: 500 }
    );
  }
}

// PUT - Update a holiday
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const {
      date,
      name,
      description,
      type,
      isRecurring,
      recurYearly,
      affectsAllClasses,
      classId,
      gradeLevel,
      blocksScheduling,
    } = body;

    const holiday = await prisma.holiday.update({
      where: { id: params.id },
      data: {
        ...(date && { date: new Date(date) }),
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(type && { type }),
        ...(isRecurring !== undefined && { isRecurring }),
        ...(recurYearly !== undefined && { recurYearly }),
        ...(affectsAllClasses !== undefined && { affectsAllClasses }),
        ...(classId !== undefined && { classId }),
        ...(gradeLevel !== undefined && { gradeLevel }),
        ...(blocksScheduling !== undefined && { blocksScheduling }),
      },
    });

    return NextResponse.json({ holiday });
  } catch (error) {
    console.error("Error updating holiday:", error);
    return NextResponse.json(
      { error: "Failed to update holiday" },
      { status: 500 }
    );
  }
}
