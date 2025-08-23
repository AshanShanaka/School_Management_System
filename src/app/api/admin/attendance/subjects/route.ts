import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    const role = user?.role;

    if (
      role !== "admin" &&
      role !== "teacher" &&
      role !== "student" &&
      role !== "parent"
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const subjects = await prisma.subject.findMany({
      orderBy: { name: "asc" },
    });

    return NextResponse.json(subjects);
  } catch (error) {
    console.error("Error fetching subjects:", error);
    return NextResponse.json(
      { error: "Failed to fetch subjects" },
      { status: 500 }
    );
  }
}
