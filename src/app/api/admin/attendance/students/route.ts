import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    const role = user?.role;

    if (role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const students = await prisma.student.findMany({
      select: {
        id: true,
        name: true,
        surname: true,
      },
      orderBy: [{ surname: "asc" }, { name: "asc" }],
    });

    return NextResponse.json(students);
  } catch (error) {
    console.error("Error fetching students:", error);
    return NextResponse.json(
      { error: "Failed to fetch students" },
      { status: 500 }
    );
  }
}
