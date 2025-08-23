import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function PUT(request: NextRequest) {
  try {
    // Check authentication
    const authResult = await requireAuth(request);

    if (!authResult.user) {
      return NextResponse.json(
        { error: authResult.error || "Authentication required" },
        { status: 401 }
      );
    }

    const user = authResult.user;
    const body = await request.json();

    const { name, surname, email, phone, address, birthday, sex } = body;

    // Prepare update data
    const updateData: any = {
      name,
      surname,
      email,
      ...(phone && { phone }),
      ...(address && { address }),
      ...(birthday && { birthday: new Date(birthday) }),
      ...(sex && { sex }),
    };

    // Update based on user role
    let updatedUser: any;

    switch (user.role) {
      case "admin":
        updatedUser = await prisma.admin.update({
          where: { id: user.id },
          data: updateData,
        });
        break;

      case "teacher":
        updatedUser = await prisma.teacher.update({
          where: { id: user.id },
          data: updateData,
        });
        break;

      case "student":
        updatedUser = await prisma.student.update({
          where: { id: user.id },
          data: updateData,
        });
        break;

      case "parent":
        updatedUser = await prisma.parent.update({
          where: { id: user.id },
          data: updateData,
        });
        break;

      default:
        return NextResponse.json(
          { error: "Invalid user role" },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        name: updatedUser.name,
        surname: updatedUser.surname,
        role: user.role,
        phone: updatedUser.phone || null,
        address: updatedUser.address || null,
        birthday: updatedUser.birthday || null,
        sex: updatedUser.sex || null,
      },
    });
  } catch (error: any) {
    console.error("Profile update error:", error);

    // Handle unique constraint violations
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Email address already exists" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const authResult = await requireAuth(request);

    if (!authResult.user) {
      return NextResponse.json(
        { error: authResult.error || "Authentication required" },
        { status: 401 }
      );
    }

    const user = authResult.user;

    // Get full user data based on role
    let userData: any;

    switch (user.role) {
      case "admin":
        userData = await prisma.admin.findUnique({
          where: { id: user.id },
        });
        break;

      case "teacher":
        userData = await prisma.teacher.findUnique({
          where: { id: user.id },
        });
        break;

      case "student":
        userData = await prisma.student.findUnique({
          where: { id: user.id },
          include: {
            class: true,
            grade: true,
            parent: true,
          },
        });
        break;

      case "parent":
        userData = await prisma.parent.findUnique({
          where: { id: user.id },
          include: {
            students: {
              include: {
                class: true,
                grade: true,
              },
            },
          },
        });
        break;

      default:
        return NextResponse.json(
          { error: "Invalid user role" },
          { status: 400 }
        );
    }

    if (!userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: userData.id,
        username: userData.username,
        email: userData.email,
        name: userData.name,
        surname: userData.surname,
        role: user.role,
        phone: userData.phone || null,
        address: userData.address || null,
        birthday: userData.birthday || null,
        sex: userData.sex || null,
        ...(user.role === "student" &&
          userData.class && {
            class: userData.class,
            grade: userData.grade,
            parent: userData.parent,
          }),
        ...(user.role === "parent" &&
          userData.students && {
            students: userData.students,
          }),
      },
    });
  } catch (error: any) {
    console.error("Profile fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}
