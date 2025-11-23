import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    // Verify authentication
    const authResult = await requireAuth(req);
    if (!authResult.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = authResult.user;

    // Verify the user is a student
    if (user.role !== "student") {
      return NextResponse.json(
        { error: "Forbidden: Only students can access this endpoint" },
        { status: 403 }
      );
    }

    // Fetch student profile
    const student = await prisma.student.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        username: true,
        name: true,
        surname: true,
        email: true,
        phone: true,
        address: true,
        img: true,
        bloodType: true,
        sex: true,
        birthday: true,
        class: {
          select: {
            name: true,
            grade: {
              select: {
                level: true,
              },
            },
          },
        },
      },
    });

    if (!student) {
      return NextResponse.json(
        { error: "Student profile not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: student.id,
      username: student.username,
      name: student.name,
      surname: student.surname,
      email: student.email,
      phone: student.phone,
      address: student.address,
      img: student.img,
      bloodType: student.bloodType,
      sex: student.sex,
      birthday: student.birthday,
      class: student.class?.name || "",
      grade: student.class?.grade?.level?.toString() || "11",
    });
  } catch (error) {
    console.error("[Student Profile API] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch student profile",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
