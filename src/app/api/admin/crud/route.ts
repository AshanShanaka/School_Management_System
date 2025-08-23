import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { hashPassword } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { type, data } = body;

    switch (type) {
      case "teacher": {
        const hashedPassword = await hashPassword(
          data.password || "teacher123"
        );
        const teacherId = `teacher_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`;

        const teacher = await prisma.teacher.create({
          data: {
            id: teacherId,
            username: data.username,
            password: hashedPassword,
            name: data.name,
            surname: data.surname,
            email: data.email || null,
            phone: data.phone || null,
            address: data.address,
            sex: data.sex,
            birthday: new Date(data.birthday),
            subjects: data.subjects
              ? {
                  connect: data.subjects.map((id: number) => ({ id })),
                }
              : undefined,
          },
          include: {
            subjects: true,
            classes: true,
          },
        });
        return NextResponse.json({ success: true, data: teacher });
      }

      case "student": {
        const hashedPassword = await hashPassword(
          data.password || "student123"
        );
        const studentId = `student_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`;

        const student = await prisma.student.create({
          data: {
            id: studentId,
            username: data.username,
            password: hashedPassword,
            name: data.name,
            surname: data.surname,
            email: data.email || null,
            phone: data.phone || null,
            address: data.address,
            sex: data.sex,
            birthday: new Date(data.birthday),
            classId: parseInt(data.classId),
            gradeId: parseInt(data.gradeId),
            parentId: data.parentId,
            bloodType: data.bloodType || null,
          },
          include: {
            class: { include: { grade: true } },
            parent: true,
          },
        });
        return NextResponse.json({ success: true, data: student });
      }

      case "parent": {
        const hashedPassword = await hashPassword(data.password || "parent123");
        const parentId = `parent_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`;

        const parent = await prisma.parent.create({
          data: {
            id: parentId,
            username: data.username,
            password: hashedPassword,
            name: data.name,
            surname: data.surname,
            email: data.email || null,
            phone: data.phone,
            address: data.address,
            sex: data.sex,
            birthday: new Date(data.birthday),
          },
          include: {
            students: true,
          },
        });
        return NextResponse.json({ success: true, data: parent });
      }

      case "class": {
        const classData = await prisma.class.create({
          data: {
            name: data.name,
            capacity: parseInt(data.capacity),
            gradeId: parseInt(data.gradeId),
            supervisorId: data.supervisorId || null,
          },
          include: {
            grade: true,
            supervisor: true,
          },
        });
        return NextResponse.json({ success: true, data: classData });
      }

      case "grade": {
        const grade = await prisma.grade.create({
          data: {
            level: parseInt(data.level),
          },
        });
        return NextResponse.json({ success: true, data: grade });
      }

      default:
        return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }
  } catch (error) {
    console.error("Create operation error:", error);
    return NextResponse.json(
      { error: "Failed to create record" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { type, id, data } = body;

    switch (type) {
      case "teacher": {
        const updateData: any = {
          username: data.username,
          name: data.name,
          surname: data.surname,
          email: data.email || null,
          phone: data.phone || null,
          address: data.address,
          sex: data.sex,
          birthday: new Date(data.birthday),
        };

        if (data.password) {
          updateData.password = await hashPassword(data.password);
        }

        const teacher = await prisma.teacher.update({
          where: { id },
          data: {
            ...updateData,
            subjects: data.subjects
              ? {
                  set: data.subjects.map((subjectId: number) => ({
                    id: subjectId,
                  })),
                }
              : undefined,
          },
          include: {
            subjects: true,
            classes: true,
          },
        });
        return NextResponse.json({ success: true, data: teacher });
      }

      case "student": {
        const updateData: any = {
          username: data.username,
          name: data.name,
          surname: data.surname,
          email: data.email || null,
          phone: data.phone || null,
          address: data.address,
          sex: data.sex,
          birthday: new Date(data.birthday),
          classId: parseInt(data.classId),
          gradeId: parseInt(data.gradeId),
          parentId: data.parentId,
          bloodType: data.bloodType || null,
        };

        if (data.password) {
          updateData.password = await hashPassword(data.password);
        }

        const student = await prisma.student.update({
          where: { id },
          data: updateData,
          include: {
            class: { include: { grade: true } },
            parent: true,
          },
        });
        return NextResponse.json({ success: true, data: student });
      }

      case "parent": {
        const updateData: any = {
          username: data.username,
          name: data.name,
          surname: data.surname,
          email: data.email || null,
          phone: data.phone,
          address: data.address,
          sex: data.sex,
          birthday: new Date(data.birthday),
        };

        if (data.password) {
          updateData.password = await hashPassword(data.password);
        }

        const parent = await prisma.parent.update({
          where: { id },
          data: updateData,
          include: {
            students: true,
          },
        });
        return NextResponse.json({ success: true, data: parent });
      }

      case "class": {
        const classData = await prisma.class.update({
          where: { id: parseInt(id) },
          data: {
            name: data.name,
            capacity: parseInt(data.capacity),
            gradeId: parseInt(data.gradeId),
            supervisorId: data.supervisorId || null,
          },
          include: {
            grade: true,
            supervisor: true,
          },
        });
        return NextResponse.json({ success: true, data: classData });
      }

      case "grade": {
        const grade = await prisma.grade.update({
          where: { id: parseInt(id) },
          data: {
            level: parseInt(data.level),
          },
        });
        return NextResponse.json({ success: true, data: grade });
      }

      default:
        return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }
  } catch (error) {
    console.error("Update operation error:", error);
    return NextResponse.json(
      { error: "Failed to update record" },
      { status: 500 }
    );
  }
}
