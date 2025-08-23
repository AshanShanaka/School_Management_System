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

    const classes = await prisma.class.findMany({
      include: {
        grade: true,
      },
      orderBy: [{ grade: { level: "asc" } }, { name: "asc" }],
    });

    return NextResponse.json(classes);
  } catch (error) {
    console.error("Error fetching classes:", error);
    return NextResponse.json(
      { error: "Failed to fetch classes" },
      { status: 500 }
    );
  }
}
