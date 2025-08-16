"use server";

import { revalidatePath } from "next/cache";
import { Day } from "@prisma/client";
import {
  ClassSchema,
  ExamSchema,
  StudentSchema,
  SubjectSchema,
  TeacherSchema,
  GradeSchema,
} from "./formValidationSchemas";
import prisma from "./prisma";
import { clerkClient } from "@clerk/nextjs/server";

export type CurrentState = { success: boolean; error: boolean };

export const createSubject = async (
  currentState: CurrentState,
  data: SubjectSchema
) => {
  try {
    await prisma.subject.create({
      data: {
        name: data.name,
        teachers: {
          connect: data.teachers.map((teacherId) => ({ id: teacherId })),
        },
      },
    });

    // revalidatePath("/list/subjects");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateSubject = async (
  currentState: CurrentState,
  data: SubjectSchema
) => {
  try {
    await prisma.subject.update({
      where: {
        id: data.id,
      },
      data: {
        name: data.name,
        teachers: {
          set: data.teachers.map((teacherId) => ({ id: teacherId })),
        },
      },
    });

    // revalidatePath("/list/subjects");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteSubject = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    await prisma.subject.delete({
      where: {
        id: parseInt(id),
      },
    });

    // revalidatePath("/list/subjects");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const createClass = async (
  currentState: CurrentState,
  data: ClassSchema
) => {
  try {
    await prisma.class.create({
      data,
    });

    // revalidatePath("/list/class");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateClass = async (
  currentState: CurrentState,
  data: ClassSchema
) => {
  try {
    await prisma.class.update({
      where: {
        id: data.id,
      },
      data,
    });

    // revalidatePath("/list/class");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteClass = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    await prisma.class.delete({
      where: {
        id: parseInt(id),
      },
    });

    // revalidatePath("/list/class");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const createTeacher = async (
  currentState: CurrentState,
  data: TeacherSchema
) => {
  try {
    const user = await clerkClient.users.createUser({
      username: data.username,
      password: data.password,
      firstName: data.name,
      lastName: data.surname,
      publicMetadata: { role: "teacher" },
    });

    await prisma.teacher.create({
      data: {
        id: user.id,
        username: data.username,
        name: data.name,
        surname: data.surname,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address,
        img: data.img || null,
        sex: data.sex,
        birthday: data.birthday,
        subjects: {
          connect: data.subjects?.map((subjectId: string) => ({
            id: parseInt(subjectId),
          })),
        },
      },
    });

    // revalidatePath("/list/teachers");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateTeacher = async (
  currentState: CurrentState,
  data: TeacherSchema
) => {
  if (!data.id) {
    return { success: false, error: true };
  }
  try {
    const user = await clerkClient.users.updateUser(data.id, {
      username: data.username,
      ...(data.password !== "" && { password: data.password }),
      firstName: data.name,
      lastName: data.surname,
    });

    await prisma.teacher.update({
      where: {
        id: data.id,
      },
      data: {
        ...(data.password !== "" && { password: data.password }),
        username: data.username,
        name: data.name,
        surname: data.surname,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address,
        img: data.img || null,
        sex: data.sex,
        birthday: data.birthday,
        subjects: {
          set: data.subjects?.map((subjectId: string) => ({
            id: parseInt(subjectId),
          })),
        },
      },
    });
    // revalidatePath("/list/teachers");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteTeacher = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    console.log("Attempting to delete teacher with ID:", id);

    // First check if the teacher exists in the database
    const teacher = await prisma.teacher.findUnique({
      where: { id },
    });

    if (!teacher) {
      console.log("Teacher not found in database, checking Clerk...");
      // Try to delete the Clerk user if it exists
      try {
        await clerkClient.users.deleteUser(id);
      } catch (clerkErr) {
        console.log("Clerk user may not exist:", clerkErr);
      }
      return { success: true, error: false };
    }

    // Delete from Clerk first
    try {
      await clerkClient.users.deleteUser(id);
      console.log("Successfully deleted user from Clerk");
    } catch (clerkErr) {
      console.log("Error deleting from Clerk (continuing anyway):", clerkErr);
      // Continue with database deletion even if Clerk deletion fails
    }

    // Delete from database
    await prisma.teacher.delete({
      where: {
        id: id,
      },
    });

    console.log("Successfully deleted teacher from database");
    return { success: true, error: false };
  } catch (err) {
    console.error("Error deleting teacher:", err);
    return { success: false, error: true };
  }
};

export const createStudent = async (
  currentState: CurrentState,
  data: StudentSchema
) => {
  console.log(data);
  try {
    const classItem = await prisma.class.findUnique({
      where: { id: data.classId },
      include: { _count: { select: { students: true } } },
    });

    if (classItem && classItem.capacity === classItem._count.students) {
      return { success: false, error: true };
    }

    const user = await clerkClient.users.createUser({
      username: data.username,
      password: data.password,
      firstName: data.name,
      lastName: data.surname,
      publicMetadata: { role: "student" },
    });

    await prisma.student.create({
      data: {
        id: user.id,
        username: data.username,
        name: data.name,
        surname: data.surname,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address,
        img: data.img || null,
        sex: data.sex,
        birthday: data.birthday,
        gradeId: data.gradeId,
        classId: data.classId,
        parentId: data.parentId,
      },
    });

    // revalidatePath("/list/students");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateStudent = async (
  currentState: CurrentState,
  data: StudentSchema
) => {
  if (!data.id) {
    return { success: false, error: true };
  }
  try {
    const user = await clerkClient.users.updateUser(data.id, {
      username: data.username,
      ...(data.password !== "" && { password: data.password }),
      firstName: data.name,
      lastName: data.surname,
    });

    await prisma.student.update({
      where: {
        id: data.id,
      },
      data: {
        ...(data.password !== "" && { password: data.password }),
        username: data.username,
        name: data.name,
        surname: data.surname,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address,
        img: data.img || null,
        sex: data.sex,
        birthday: data.birthday,
        gradeId: data.gradeId,
        classId: data.classId,
        parentId: data.parentId,
      },
    });
    // revalidatePath("/list/students");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteStudent = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    console.log("Attempting to delete student with ID:", id);

    // First check if the student exists in the database
    const student = await prisma.student.findUnique({
      where: { id },
    });

    if (!student) {
      console.log("Student not found in database, checking Clerk...");
      // Try to delete the Clerk user if it exists
      try {
        await clerkClient.users.deleteUser(id);
      } catch (clerkErr) {
        console.log("Clerk user may not exist:", clerkErr);
      }
      return { success: true, error: false };
    }

    // Delete from Clerk first
    try {
      await clerkClient.users.deleteUser(id);
      console.log("Successfully deleted user from Clerk");
    } catch (clerkErr) {
      console.log("Error deleting from Clerk (continuing anyway):", clerkErr);
      // Continue with database deletion even if Clerk deletion fails
    }

    // Delete from database
    await prisma.student.delete({
      where: {
        id: id,
      },
    });

    console.log("Successfully deleted student from database");
    return { success: true, error: false };
  } catch (err) {
    console.error("Error deleting student:", err);
    return { success: false, error: true };
  }
};

export const createExam = async (
  currentState: CurrentState,
  data: ExamSchema
) => {
  try {
    const startDateTime = new Date(`${data.startDate}T${data.startTime}`);
    const endDateTime = new Date(`${data.endDate}T${data.endTime}`);

    await prisma.exam.create({
      data: {
        title: data.title,
        examTypeId: data.examTypeId,
        subjectId: data.subjectId,
        teacherId: data.teacherId,
        startTime: startDateTime,
        endTime: endDateTime,
        duration: data.duration,
        venue: data.venue,
        day: data.day,
        subjectCode: data.subjectCode,
      },
    });

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateExam = async (
  currentState: CurrentState,
  data: ExamSchema
) => {
  try {
    const startDateTime = new Date(`${data.startDate}T${data.startTime}`);
    const endDateTime = new Date(`${data.endDate}T${data.endTime}`);

    await prisma.exam.update({
      where: {
        id: data.id,
      },
      data: {
        title: data.title,
        examTypeId: data.examTypeId,
        subjectId: data.subjectId,
        teacherId: data.teacherId,
        startTime: startDateTime,
        endTime: endDateTime,
        duration: data.duration,
        venue: data.venue,
        day: data.day,
        subjectCode: data.subjectCode,
      },
    });

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteExam = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    await prisma.exam.delete({
      where: {
        id: parseInt(id),
      },
    });

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteParent = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    // First check if the parent has any associated students
    const parent = await prisma.parent.findUnique({
      where: { id },
      include: { students: true },
    });

    // If parent doesn't exist, consider it already deleted
    if (!parent) {
      // Try to delete the Clerk user if it exists
      try {
        await clerkClient.users.deleteUser(id);
      } catch (clerkErr) {
        // Ignore errors if Clerk user doesn't exist
        console.log("Clerk user may not exist:", clerkErr);
      }
      return {
        success: true,
        error: false,
        message: "Parent already deleted or doesn't exist",
      };
    }

    // Check if parent has students
    if (parent.students.length > 0) {
      return {
        success: false,
        error: true,
        message:
          "Cannot delete parent with associated students. Please reassign or remove the students first.",
      };
    }

    // No students associated, proceed with deletion
    try {
      await clerkClient.users.deleteUser(id);
    } catch (clerkErr) {
      console.log("Could not delete Clerk user:", clerkErr);
      // Continue with database deletion even if Clerk deletion fails
    }

    await prisma.parent.delete({
      where: { id },
    });

    revalidatePath("/list/parents");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    // Handle specific Prisma error for record not found
    if ((err as any).code === "P2025") {
      return { success: true, error: false, message: "Parent already deleted" };
    }
    return {
      success: false,
      error: true,
      message:
        "Failed to delete parent: " + ((err as any).message || "Unknown error"),
    };
  }
};

export const createLesson = async (
  currentState: CurrentState,
  data: FormData
) => {
  try {
    const { name, day, startTime, endTime, subjectId, classId, teacherId } =
      Object.fromEntries(data);

    await prisma.lesson.create({
      data: {
        name: name as string,
        day: day as Day,
        startTime: new Date(`1970-01-01T${startTime}:00`),
        endTime: new Date(`1970-01-01T${endTime}:00`),
        subjectId: parseInt(subjectId as string),
        classId: parseInt(classId as string),
        teacherId: teacherId as string,
      },
    });

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateLesson = async (
  currentState: CurrentState,
  data: FormData
) => {
  try {
    const { id, name, day, startTime, endTime, subjectId, classId, teacherId } =
      Object.fromEntries(data);

    await prisma.lesson.update({
      where: {
        id: parseInt(id as string),
      },
      data: {
        name: name as string,
        day: day as Day,
        startTime: new Date(`1970-01-01T${startTime}:00`),
        endTime: new Date(`1970-01-01T${endTime}:00`),
        subjectId: parseInt(subjectId as string),
        classId: parseInt(classId as string),
        teacherId: teacherId as string,
      },
    });

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteLesson = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    await prisma.lesson.delete({
      where: {
        id: parseInt(id),
      },
    });

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const createAssignment = async (
  currentState: CurrentState,
  data: FormData
) => {
  try {
    const { title, startDate, dueDate, lessonId } = Object.fromEntries(data);

    await prisma.assignment.create({
      data: {
        title: title as string,
        startDate: new Date(startDate as string),
        dueDate: new Date(dueDate as string),
        lessonId: parseInt(lessonId as string),
      },
    });

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateAssignment = async (
  currentState: CurrentState,
  data: FormData
) => {
  try {
    const { id, title, startDate, dueDate, lessonId } =
      Object.fromEntries(data);

    await prisma.assignment.update({
      where: {
        id: parseInt(id as string),
      },
      data: {
        title: title as string,
        startDate: new Date(startDate as string),
        dueDate: new Date(dueDate as string),
        lessonId: parseInt(lessonId as string),
      },
    });

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteAssignment = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    await prisma.assignment.delete({
      where: {
        id: parseInt(id),
      },
    });

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const createGrade = async (
  currentState: CurrentState,
  data: GradeSchema
) => {
  try {
    await prisma.grade.create({
      data,
    });
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateGrade = async (
  currentState: CurrentState,
  data: GradeSchema
) => {
  try {
    await prisma.grade.update({
      where: { id: data.id },
      data,
    });
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteGrade = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    await prisma.grade.delete({
      where: { id: parseInt(id) },
    });
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const createParent = async (currentState: CurrentState, data: any) => {
  try {
    // Check for required fields
    if (!data.username || !data.password || !data.name || !data.surname) {
      return {
        success: false,
        error: true,
        message:
          "Missing required fields. Please fill in all required information.",
      };
    }

    // Check if username already exists in Prisma before creating in Clerk
    const existingParent = await prisma.parent.findUnique({
      where: { username: data.username },
    });

    if (existingParent) {
      return {
        success: false,
        error: true,
        message: "Username already exists. Please choose a different username.",
      };
    }

    let clerkUser;
    try {
      // Create user in Clerk first - don't destructure to maintain the proper context
      clerkUser = await clerkClient.users.createUser({
        username: data.username,
        password: data.password,
        firstName: data.name,
        lastName: data.surname,
        publicMetadata: { role: "parent" },
      });
    } catch (clerkError: any) {
      // Handle specific Clerk errors
      if (clerkError.status === 422) {
        return {
          success: false,
          error: true,
          message:
            "Username already exists in authentication system. Please choose a different username.",
        };
      }
      throw clerkError; // Re-throw to be caught by the outer catch
    }

    // If Clerk user creation was successful, create the database record
    try {
      await prisma.parent.create({
        data: {
          id: clerkUser.id,
          username: data.username,
          name: data.name,
          surname: data.surname,
          email: data.email || null,
          phone: data.phone || null,
          address: data.address,
          sex: data.sex,
          birthday: data.birthday,
          // img field will be omitted if it doesn't exist in the schema
        },
      });
    } catch (prismaError: any) {
      // If database creation fails, clean up by deleting the Clerk user
      try {
        await clerkClient.users.deleteUser(clerkUser.id);
      } catch (deleteError) {
        console.log(
          "Failed to clean up Clerk user after database error:",
          deleteError
        );
      }

      // Handle specific Prisma errors
      if (prismaError.code === "P2002") {
        const field = prismaError.meta?.target?.[0] || "field";
        return {
          success: false,
          error: true,
          message: `A parent with this ${field} already exists. Please use a different value.`,
        };
      }

      throw prismaError; // Re-throw to be caught by the outer catch
    }

    revalidatePath("/list/parents");
    return {
      success: true,
      error: false,
      message: "Parent created successfully!",
    };
  } catch (err: any) {
    console.log(err);
    return {
      success: false,
      error: true,
      message: `Failed to create parent: ${err.message || "Unknown error"}`,
    };
  }
};

export const updateParent = async (currentState: CurrentState, data: any) => {
  if (!data.id) {
    return { success: false, error: true, message: "No parent ID provided" };
  }

  try {
    // Check if the parent exists in the database
    const existingParent = await prisma.parent.findUnique({
      where: { id: data.id },
    });

    if (!existingParent) {
      return {
        success: false,
        error: true,
        message: "Parent not found. The record may have been deleted.",
      };
    }

    // Check if the username change would conflict with existing users
    if (data.username !== existingParent.username) {
      const usernameCheck = await prisma.parent.findUnique({
        where: { username: data.username },
      });

      if (usernameCheck && usernameCheck.id !== data.id) {
        return {
          success: false,
          error: true,
          message:
            "Username already exists. Please choose a different username.",
        };
      }
    }

    // Update the Clerk user
    try {
      // Call the updateUser method directly without destructuring
      await clerkClient.users.updateUser(data.id, {
        username: data.username,
        firstName: data.name,
        lastName: data.surname,
        ...(data.password &&
          data.password !== "" && { password: data.password }),
      });
    } catch (clerkError: any) {
      // Handle Clerk-specific errors
      if (clerkError.status === 422) {
        return {
          success: false,
          error: true,
          message:
            "Username already exists in authentication system. Please choose a different username.",
        };
      }
      throw clerkError; // Re-throw to be caught by the outer catch
    }

    // Update the database record
    try {
      await prisma.parent.update({
        where: { id: data.id },
        data: {
          username: data.username,
          name: data.name,
          surname: data.surname,
          email: data.email || null,
          phone: data.phone || null,
          address: data.address,
          sex: data.sex,
          birthday: data.birthday,
        },
      });
    } catch (prismaError: any) {
      // Handle specific Prisma errors
      if (prismaError.code === "P2002") {
        const field = prismaError.meta?.target?.[0] || "field";
        return {
          success: false,
          error: true,
          message: `A parent with this ${field} already exists. Please use a different value.`,
        };
      }
      throw prismaError; // Re-throw to be caught by the outer catch
    }

    revalidatePath("/list/parents");
    return {
      success: true,
      error: false,
      message: "Parent updated successfully!",
    };
  } catch (err: any) {
    console.log(err);
    return {
      success: false,
      error: true,
      message: `Failed to update parent: ${err.message || "Unknown error"}`,
    };
  }
};

// TIMETABLE ACTIONS

export const createTimetable = async (
  currentState: CurrentState,
  data: any
) => {
  try {
    await prisma.timetable.create({
      data: {
        name: data.name,
        academicYear: data.academicYear,
        classId: parseInt(data.classId),
        isActive: data.isActive || false,
      },
    });

    revalidatePath("/list/timetables");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateTimetable = async (
  currentState: CurrentState,
  data: any
) => {
  try {
    await prisma.timetable.update({
      where: {
        id: data.id,
      },
      data: {
        name: data.name,
        academicYear: data.academicYear,
        classId: parseInt(data.classId),
        isActive: data.isActive || false,
      },
    });

    revalidatePath("/list/timetables");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteTimetable = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    await prisma.timetable.delete({
      where: {
        id: parseInt(id),
      },
    });

    revalidatePath("/list/timetables");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};
