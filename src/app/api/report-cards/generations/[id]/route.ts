import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log("[DELETE GENERATION] Starting request for ID:", params.id);
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only teachers and admins can delete
    if (user.role !== "teacher" && user.role !== "admin") {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    // Find the generation
    const generation = await prisma.reportCardGeneration.findUnique({
      where: { id: params.id },
      include: {
        reportCards: true,
      },
    });

    if (!generation) {
      return NextResponse.json(
        { error: "Generation not found" },
        { status: 404 }
      );
    }

    // If teacher, verify they own this generation
    if (user.role === "teacher" && generation.teacherId !== user.id) {
      return NextResponse.json(
        { error: "You can only delete your own generations" },
        { status: 403 }
      );
    }

    // Delete associated report cards first
    await prisma.reportCard.deleteMany({
      where: {
        generationId: params.id,
      },
    });

    // Delete the generation
    await prisma.reportCardGeneration.delete({
      where: { id: params.id },
    });

    console.log(
      "[DELETE GENERATION] Deleted generation:",
      params.id,
      "and",
      generation.reportCards.length,
      "report cards"
    );

    return NextResponse.json(
      {
        message: "Generation deleted successfully",
        deletedReportCards: generation.reportCards.length,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[DELETE GENERATION] Error:", error);
    return NextResponse.json(
      {
        error: error.message || "Failed to delete generation",
      },
      { status: 500 }
    );
  }
}
