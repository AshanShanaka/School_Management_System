"use server";

import { revalidatePath } from "next/cache";
import {
  ClassSchema,
  ExamSchema,
  StudentSchema,
  SubjectSchema,
  TeacherSchema,
  ParentSchema,
  AssignmentSchema,
  LessonSchema,
} from "./formValidationSchemas";
import prisma from "./prisma";
import { clerkClient } from "@clerk/nextjs/server";
import { auth } from "@clerk/nextjs/server";
import { Prisma } from "@prisma/client";

export type CurrentState = { success: boolean; error: boolean | string };

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
        bloodType: data.bloodType,
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
        bloodType: data.bloodType,
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
    await clerkClient.users.deleteUser(id);

    await prisma.teacher.delete({
      where: {
        id: id,
      },
    });

    // revalidatePath("/list/teachers");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
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
        bloodType: data.bloodType,
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
        bloodType: data.bloodType,
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
    await clerkClient.users.deleteUser(id);

    await prisma.student.delete({
      where: {
        id: id,
      },
    });

    // revalidatePath("/list/students");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const createExam = async (
  currentState: CurrentState,
  data: ExamSchema
) => {
  const { userId, sessionClaims } = auth();

  if (!userId) {
    return { success: false, error: "User not authenticated" };
  }

  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (role !== "teacher") {
    return { success: false, error: "Only teachers can create exams" };
  }

  try {
    // Verify that the teacher is assigned to this subject
    const subject = await prisma.subject.findFirst({
      where: {
        id: data.subjectId,
        teachers: {
          some: {
            id: userId,
          },
        },
      },
    });

    if (!subject) {
      return {
        success: false,
        error: "Not authorized to create exam for this subject",
      };
    }

    const startDateTime = new Date(`${data.examDate}T${data.startTime}`);
    const endDateTime = new Date(`${data.examDate}T${data.endTime}`);
    const duration = Math.round(
      (endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60)
    ).toString();

    await prisma.exam.create({
      data: {
        title: data.title,
        startTime: startDateTime,
        endTime: endDateTime,
        duration,
        venue: data.venue,
        examType: {
          connect: { id: data.examTypeId },
        },
        Subject: {
          connect: { id: data.subjectId },
        },
        Teacher: {
          connect: data.teacherId ? { id: data.teacherId } : undefined,
        },
      },
    });

    revalidatePath("/list/exams");
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
  const { userId, sessionClaims } = auth();

  if (!userId) {
    return { success: false, error: "User not authenticated" };
  }

  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (role !== "teacher") {
    return { success: false, error: "Only teachers can update exams" };
  }

  if (!data.id) {
    return { success: false, error: true };
  }

  try {
    // Verify that the teacher is assigned to this exam
    const exam = await prisma.exam.findFirst({
      where: {
        id: data.id,
        Subject: {
          teachers: {
            some: {
              id: userId,
            },
          },
        },
      },
    });

    if (!exam) {
      return {
        success: false,
        error: "Not authorized to update this exam",
      };
    }

    const startDateTime = new Date(`${data.examDate}T${data.startTime}`);
    const endDateTime = new Date(`${data.examDate}T${data.endTime}`);
    const duration = Math.round(
      (endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60)
    ).toString();

    await prisma.exam.update({
      where: {
        id: data.id,
      },
      data: {
        title: data.title,
        startTime: startDateTime,
        endTime: endDateTime,
        duration,
        venue: data.venue,
        examType: {
          connect: { id: data.examTypeId },
        },
        Subject: {
          connect: { id: data.subjectId },
        },
        Teacher: {
          connect: data.teacherId ? { id: data.teacherId } : undefined,
        },
      },
    });

    revalidatePath("/list/exams");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteExam = async (
  currentState: CurrentState,
  id: string // Changed parameter type to string
) => {
  const { userId, sessionClaims } = auth();

  if (!userId) {
    return { success: false, error: "User not authenticated" };
  }

  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (role !== "teacher") {
    return { success: false, error: "Only teachers can delete exams" };
  }

  try {
    // Verify that the teacher is assigned to this exam
    const exam = await prisma.exam.findFirst({
      where: {
        id: parseInt(id),
        Subject: {
          teachers: {
            some: {
              id: userId,
            },
          },
        },
      },
    });

    if (!exam) {
      return {
        success: false,
        error: "Not authorized to delete this exam",
      };
    }

    await prisma.exam.delete({
      where: {
        id: parseInt(id),
      },
    });

    revalidatePath("/list/exams");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const createParent = async (
  currentState: CurrentState,
  data: ParentSchema
) => {
  try {
    const user = await clerkClient.users.createUser({
      username: data.username,
      password: data.password,
      firstName: data.name,
      lastName: data.surname,
      publicMetadata: { role: "parent" },
    });

    await prisma.parent.create({
      data: {
        id: user.id,
        username: data.username,
        name: data.name,
        surname: data.surname,
        email: data.email || null,
        phone: data.phone,
        address: data.address,
      },
    });

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    // Handle Clerk's password breach error specifically
    if ((err as any).errors?.[0]?.code === "form_password_pwned") {
      return {
        success: false,
        error: true,
        message:
          "This password has been found in a data breach. Please choose a different password for security.",
      };
    }
    return {
      success: false,
      error: true,
      message:
        ((err as any).errors?.[0]?.message as string) || "Something went wrong",
    };
  }
};

export const updateParent = async (
  currentState: CurrentState,
  data: ParentSchema
) => {
  if (!data.id) return { success: false, error: true };

  try {
    await clerkClient.users.updateUser(data.id, {
      username: data.username,
      ...(data.password !== "" && { password: data.password }),
      firstName: data.name,
      lastName: data.surname,
    });

    await prisma.parent.update({
      where: {
        id: data.id,
      },
      data: {
        username: data.username,
        name: data.name,
        surname: data.surname,
        email: data.email || null,
        phone: data.phone,
        address: data.address,
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
    // First, delete the user from Clerk
    await clerkClient.users.deleteUser(id);

    // Then, delete the parent from the database
    await prisma.parent.delete({
      where: {
        id: id, // Ensure this is the correct ID for the parent
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
  data: AssignmentSchema
) => {
  const { userId, sessionClaims } = auth();

  if (!userId) {
    return { success: false, error: "User not authenticated" };
  }

  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (role !== "teacher") {
    return { success: false, error: "Only teachers can create assignments" };
  }

  try {
    // Verify that the teacher is assigned to this lesson
    const lesson = await prisma.lesson.findFirst({
      where: {
        id: data.lessonId,
        teacherId: userId,
      },
    });

    if (!lesson) {
      return {
        success: false,
        error: "Not authorized to create assignment for this lesson",
      };
    }

    await prisma.assignment.create({
      data: {
        title: data.title,
        startDate: data.startDate,
        dueDate: data.dueDate,
        lessonId: data.lessonId,
      },
    });

    revalidatePath("/list/assignments");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateAssignment = async (
  currentState: CurrentState,
  data: AssignmentSchema
) => {
  const { userId, sessionClaims } = auth();

  if (!userId) {
    return { success: false, error: "User not authenticated" };
  }

  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (role !== "teacher") {
    return { success: false, error: "Only teachers can update assignments" };
  }

  if (!data.id) {
    return { success: false, error: true };
  }

  try {
    // Verify that the teacher is assigned to this lesson
    const assignment = await prisma.assignment.findFirst({
      where: {
        id: data.id,
        lesson: {
          teacherId: userId,
        },
      },
    });

    if (!assignment) {
      return {
        success: false,
        error: "Not authorized to update this assignment",
      };
    }

    await prisma.assignment.update({
      where: {
        id: data.id,
      },
      data: {
        title: data.title,
        startDate: data.startDate,
        dueDate: data.dueDate,
        lessonId: data.lessonId,
      },
    });

    revalidatePath("/list/assignments");
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
  const { userId, sessionClaims } = auth();
  const id = data.get("id") as string;

  if (!userId) {
    return { success: false, error: "User not authenticated" };
  }

  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (role !== "teacher") {
    return { success: false, error: "Only teachers can delete assignments" };
  }

  try {
    // Verify that the teacher is assigned to this lesson
    const assignment = await prisma.assignment.findFirst({
      where: {
        id: parseInt(id),
        lesson: {
          teacherId: userId,
        },
      },
    });

    if (!assignment) {
      return {
        success: false,
        error: "Not authorized to delete this assignment",
      };
    }

    await prisma.assignment.delete({
      where: {
        id: parseInt(id),
      },
    });

    revalidatePath("/list/assignments");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const createLesson = async (
  currentState: CurrentState,
  data: LessonSchema
) => {
  const { userId, sessionClaims } = auth();

  if (!userId) {
    console.error("No user ID found");
    return { success: false, error: "User not authenticated" };
  }

  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (role !== "teacher") {
    console.error("User is not a teacher");
    return { success: false, error: "Only teachers can create lessons" };
  }

  try {
    console.log("Creating lesson with data:", data);

    // Verify that the teacher is assigned to this subject
    const subject = await prisma.subject.findFirst({
      where: {
        id: data.subjectId,
        teachers: {
          some: {
            id: userId,
          },
        },
      },
    });

    if (!subject) {
      console.error("Teacher not assigned to subject");
      return { success: false, error: "You are not assigned to this subject" };
    }

    // Create the lesson
    const lesson = await prisma.lesson.create({
      data: {
        name: data.name,
        day: data.day,
        startTime: new Date(data.startTime),
        endTime: new Date(data.endTime),
        subjectId: data.subjectId,
        classId: data.classId,
        teacherId: userId,
      },
    });

    console.log("Lesson created successfully:", lesson);
    revalidatePath("/list/lessons");
    return { success: true, error: false };
  } catch (err) {
    console.error("Error creating lesson:", err);
    return {
      success: false,
      error: "Failed to create lesson. Please try again.",
    };
  }
};

export const updateLesson = async (
  currentState: CurrentState,
  data: LessonSchema
) => {
  const { userId, sessionClaims } = auth();

  if (!userId) {
    return { success: false, error: "User not authenticated" };
  }

  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (role !== "teacher") {
    return { success: false, error: "Only teachers can update lessons" };
  }

  if (!data.id) {
    return { success: false, error: "Lesson ID is required for update" };
  }

  try {
    // Verify that the teacher is assigned to this lesson
    const lesson = await prisma.lesson.findFirst({
      where: {
        id: data.id,
        teacherId: userId,
      },
    });

    if (!lesson) {
      return { success: false, error: "Not authorized to update this lesson" };
    }

    // Verify that the teacher is assigned to the new subject
    const subject = await prisma.subject.findFirst({
      where: {
        id: data.subjectId,
        teachers: {
          some: {
            id: userId,
          },
        },
      },
    });

    if (!subject) {
      return { success: false, error: "You are not assigned to this subject" };
    }

    await prisma.lesson.update({
      where: {
        id: data.id,
      },
      data: {
        name: data.name,
        day: data.day,
        startTime: new Date(data.startTime),
        endTime: new Date(data.endTime),
        subjectId: data.subjectId,
        classId: data.classId,
        teacherId: userId,
      },
    });

    revalidatePath("/list/lessons");
    return { success: true, error: false };
  } catch (err) {
    console.error("Error updating lesson:", err);
    return {
      success: false,
      error: "Failed to update lesson. Please try again.",
    };
  }
};

export const deleteLesson = async (
  currentState: CurrentState,
  data: FormData
) => {
  const { userId, sessionClaims } = auth();
  const id = data.get("id") as string;

  if (!userId) {
    return { success: false, error: "User not authenticated" };
  }

  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (role !== "teacher") {
    return { success: false, error: "Only teachers can delete lessons" };
  }

  try {
    // Verify that the teacher is assigned to this lesson
    const lesson = await prisma.lesson.findFirst({
      where: {
        id: parseInt(id),
        teacherId: userId,
      },
    });

    if (!lesson) {
      return { success: false, error: "Not authorized to delete this lesson" };
    }

    await prisma.lesson.delete({
      where: {
        id: parseInt(id),
      },
    });

    revalidatePath("/list/lessons");
    return { success: true, error: false };
  } catch (err) {
    console.error("Error deleting lesson:", err);
    return {
      success: false,
      error: "Failed to delete lesson. Please try again.",
    };
  }
};
