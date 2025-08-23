import { getCurrentUser } from "@/lib/auth";
import { hashPassword } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();

    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parent = await prisma.parent.findUnique({
      where: { id: params.id },
      include: {
        students: {
          include: {
            class: {
              include: {
                grade: true,
              },
            },
          },
        },
      },
    });

    if (!parent) {
      return NextResponse.json({ error: "Parent not found" }, { status: 404 });
    }

    // Remove password from response
    const { password, ...parentData } = parent;

    return NextResponse.json({
      success: true,
      parent: parentData,
    });
  } catch (error) {
    console.error("Error fetching parent:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();

    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins can edit parents
    if (user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const {
      username,
      email,
      name,
      surname,
      phone,
      address,
      sex,
      birthday,
      password,
      occupation,
      workPhone,
    } = body;

    // Validate required fields
    if (!username || !email || !name || !surname || !birthday || !sex) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if parent exists
    const existingParent = await prisma.parent.findUnique({
      where: { id: params.id },
    });

    if (!existingParent) {
      return NextResponse.json({ error: "Parent not found" }, { status: 404 });
    }

    // Check for duplicate username or email (excluding current parent)
    const duplicateCheck = await prisma.parent.findFirst({
      where: {
        AND: [
          { id: { not: params.id } },
          {
            OR: [{ username }, { email }],
          },
        ],
      },
    });

    if (duplicateCheck) {
      const field = duplicateCheck.username === username ? "username" : "email";
      return NextResponse.json(
        { error: `A parent with this ${field} already exists` },
        { status: 409 }
      );
    }

    // Prepare update data
    const updateData: any = {
      username,
      email,
      name,
      surname,
      phone: phone || null,
      address: address || null,
      sex,
      birthday: new Date(birthday),
      occupation: occupation || null,
      workPhone: workPhone || null,
    };

    // Hash password if provided
    if (password && password.trim()) {
      updateData.password = await hashPassword(password);
    }

    const updatedParent = await prisma.parent.update({
      where: { id: params.id },
      data: updateData,
      include: {
        students: {
          include: {
            class: {
              include: {
                grade: true,
              },
            },
          },
        },
      },
    });

    // Remove password from response
    const { password: _, ...parentData } = updatedParent;

    return NextResponse.json({
      success: true,
      message: "Parent updated successfully",
      parent: parentData,
    });
  } catch (error) {
    console.error("Error updating parent:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();

    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins can delete parents
    if (user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if parent exists
    const existingParent = await prisma.parent.findUnique({
      where: { id: params.id },
      include: {
        students: true,
      },
    });

    if (!existingParent) {
      return NextResponse.json({ error: "Parent not found" }, { status: 404 });
    }

    // Check if parent has children (students)
    if (existingParent.students && existingParent.students.length > 0) {
      return NextResponse.json(
        {
          error:
            "Cannot delete parent with existing children. Please remove or reassign children first.",
        },
        { status: 409 }
      );
    }

    // Delete the parent
    await prisma.parent.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: "Parent deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting parent:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
