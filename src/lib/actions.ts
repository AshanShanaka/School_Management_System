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
import { hashPassword } from "./auth";

export type CurrentState = {
  success: boolean;
  error: boolean;
  message?: string;
  hasDependencies?: boolean;
  dependencyCount?: number;
  dependencyDetails?: string;
  gradeLevel?: number;
};

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

    revalidatePath("/list/subjects");
    return { success: true, error: false };
  } catch (err: any) {
    console.log(err);
    
    // Handle unique constraint violation
    if (err.code === 'P2002') {
      return { 
        success: false, 
        error: true, 
        message: `A subject with the name "${data.name}" already exists. Please use a different name.` 
      };
    }
    
    return { success: false, error: true };
  }
};

export const updateSubject = async (
  currentState: CurrentState,
  data: SubjectSchema
) => {
  try {
    // Ensure we have an ID for updates
    if (!data.id) {
      console.error("No ID provided for subject update");
      return { 
        success: false, 
        error: true, 
        message: "Subject ID is required for update" 
      };
    }

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

    revalidatePath("/list/subjects");
    return { success: true, error: false };
  } catch (err: any) {
    console.log("Error updating subject:", err);
    
    // Handle unique constraint violation
    if (err.code === 'P2002') {
      return { 
        success: false, 
        error: true, 
        message: `A subject with the name "${data.name}" already exists. Please use a different name.` 
      };
    }
    
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

    revalidatePath("/list/subjects");
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
    // Convert empty string supervisorId to null
    const classData = {
      ...data,
      supervisorId: data.supervisorId && data.supervisorId.trim() !== "" 
        ? data.supervisorId 
        : null,
    };

    await prisma.class.create({
      data: classData,
    });

    revalidatePath("/list/classlist");
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
    console.log("Updating class with data:", data);
    
    // Convert empty string supervisorId to null
    const supervisorId = data.supervisorId && data.supervisorId.trim() !== "" 
      ? data.supervisorId 
      : null;

    await prisma.class.update({
      where: {
        id: data.id,
      },
      data: {
        name: data.name,
        capacity: data.capacity,
        gradeId: data.gradeId,
        supervisorId: supervisorId,
      },
    });

    revalidatePath("/list/classlist");
    return { success: true, error: false };
  } catch (err) {
    console.log("Update class error:", err);
    return { success: false, error: true };
  }
};

export const deleteClass = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    // Check if class has any dependencies
    const classData = await prisma.class.findUnique({
      where: { id: parseInt(id) },
      include: {
        students: true,
        lessons: true,
        events: true,
        announcements: true,
      },
    });

    if (!classData) {
      throw new Error("Class not found");
    }

    // Check if class has students or other dependencies
    const totalDependencies =
      classData.students.length +
      classData.lessons.length +
      classData.events.length +
      classData.announcements.length;

    if (totalDependencies > 0) {
      throw new Error(
        `Cannot delete class ${classData.name}. It has ${classData.students.length} students, ${classData.lessons.length} lessons, ${classData.events.length} events, and ${classData.announcements.length} announcements. Please reassign or delete them first.`
      );
    }

    await prisma.class.delete({
      where: { id: parseInt(id) },
    });

    revalidatePath("/list/classes");
    return { success: true, error: false };
  } catch (err: any) {
    console.log(err);
    // Return the specific error message for foreign key constraints
    if (err.message.includes("Cannot delete")) {
      return { success: false, error: true, message: err.message };
    }
    return { success: false, error: true };
  }
};

export const createTeacher = async (
  currentState: CurrentState,
  data: TeacherSchema
) => {
  try {
    // Hash password for custom auth system
    const hashedPassword = await hashPassword(
      data.password || "defaultPassword123"
    );

    // Generate a unique ID for the teacher
    const teacherId = `teacher_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    await prisma.teacher.create({
      data: {
        id: teacherId,
        username: data.username,
        password: hashedPassword,
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

    revalidatePath("/list/teachers");
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
    // Prepare update data for the teacher
    const updateData: any = {
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
    };

    // Only hash and update password if a new one is provided
    if (data.password && data.password !== "") {
      updateData.password = await hashPassword(data.password);
    }

    await prisma.teacher.update({
      where: {
        id: data.id,
      },
      data: updateData,
    });
    revalidatePath("/list/teachers");
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
      console.log("Teacher not found in database");
      return { success: true, error: false };
    }

    // Delete from database only (no Clerk dependency)
    await prisma.teacher.delete({
      where: {
        id: id,
      },
    });

    console.log("Successfully deleted teacher from database");
    revalidatePath("/list/teachers");
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

    // Hash password for custom auth system
    const hashedPassword = await hashPassword(
      data.password || "defaultPassword123"
    );

    // Generate a unique ID for the student
    const studentId = `student_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    await prisma.student.create({
      data: {
        id: studentId,
        username: data.username,
        password: hashedPassword,
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

    revalidatePath("/list/students");
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
    // Prepare update data for the student
    const updateData: any = {
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
    };

    // Only hash and update password if a new one is provided
    if (data.password && data.password !== "") {
      updateData.password = await hashPassword(data.password);
    }

    await prisma.student.update({
      where: {
        id: data.id,
      },
      data: updateData,
    });
    revalidatePath("/list/students");
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
      console.log("Student not found in database");
      return { success: true, error: false };
    }

    // Delete from database only (no Clerk dependency)
    await prisma.student.delete({
      where: {
        id: id,
      },
    });

    console.log("Successfully deleted student from database");
    revalidatePath("/list/students");
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

    revalidatePath("/list/exams");
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

    revalidatePath("/list/exams");
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

    // No students associated, proceed with deletion (database only)
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

    revalidatePath("/list/lessons");
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

    revalidatePath("/list/lessons");
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

    revalidatePath("/list/lessons");
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

    revalidatePath("/list/assignments");
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
  const id = data.get("id") as string;
  try {
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

export const createGrade = async (
  currentState: CurrentState,
  data: GradeSchema
) => {
  try {
    await prisma.grade.create({
      data,
    });
    revalidatePath("/list/grades");
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
    revalidatePath("/list/grades");
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
  const force = data.get("force") === "true";

  try {
    // Check if grade has any dependencies
    const grade = await prisma.grade.findUnique({
      where: { id: parseInt(id) },
      include: {
        classess: {
          include: {
            students: true,
          },
        },
        students: true,
      },
    });

    if (!grade) {
      throw new Error("Grade not found");
    }

    // Count total dependencies
    const totalClasses = grade.classess.length;
    const totalStudents = grade.students.length;
    const studentsInClasses = grade.classess.reduce(
      (sum, cls) => sum + cls.students.length,
      0
    );

    // Check if grade has classes or students and if not forcing delete
    if (
      (totalClasses > 0 || totalStudents > 0 || studentsInClasses > 0) &&
      !force
    ) {
      const dependencyDetails = [];
      if (totalClasses > 0) dependencyDetails.push(`${totalClasses} classes`);
      if (totalStudents > 0)
        dependencyDetails.push(`${totalStudents} direct students`);
      if (studentsInClasses > 0)
        dependencyDetails.push(`${studentsInClasses} students in classes`);

      // Return special state to indicate dependencies found
      return {
        success: false,
        error: false,
        hasDependencies: true,
        dependencyCount: totalClasses + totalStudents + studentsInClasses,
        dependencyDetails: dependencyDetails.join(", "),
        gradeLevel: grade.level,
      };
    }

    // If force delete or no dependencies, proceed with deletion
    if (force) {
      // Use transaction to delete everything in order
      await prisma.$transaction(async (tx) => {
        // First, delete all students in classes under this grade
        for (const cls of grade.classess) {
          await tx.student.deleteMany({
            where: { classId: cls.id },
          });
        }

        // Delete all direct students under this grade
        await tx.student.deleteMany({
          where: { gradeId: parseInt(id) },
        });

        // Delete all classes under this grade
        await tx.class.deleteMany({
          where: { gradeId: parseInt(id) },
        });

        // Finally delete the grade
        await tx.grade.delete({
          where: { id: parseInt(id) },
        });
      });
    } else {
      // No dependencies, safe to delete
      await prisma.grade.delete({
        where: { id: parseInt(id) },
      });
    }

    revalidatePath("/list/grades");
    return { success: true, error: false };
  } catch (err: any) {
    console.log("Grade deletion error:", err);
    // Return the specific error message for foreign key constraints
    if (
      err.message.includes("Cannot delete") ||
      err.message.includes("Foreign key constraint")
    ) {
      return {
        success: false,
        error: true,
        message: err.message.includes("Cannot delete")
          ? err.message
          : "Cannot delete this grade because it has associated classes or students. Please remove all dependencies first.",
      };
    }
    return {
      success: false,
      error: true,
      message: "Failed to delete grade. Please try again.",
    };
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

    // Check if username already exists in database
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

    // Hash password for custom auth system
    const hashedPassword = await hashPassword(data.password);

    // Generate a unique ID for the parent
    const parentId = `parent_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    // Create parent in database
    await prisma.parent.create({
      data: {
        id: parentId,
        username: data.username,
        password: hashedPassword,
        name: data.name,
        surname: data.surname,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address,
        sex: data.sex,
        birthday: data.birthday,
      },
    });

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

    // Prepare update data for the parent
    const updateData: any = {
      username: data.username,
      name: data.name,
      surname: data.surname,
      email: data.email || null,
      phone: data.phone || null,
      address: data.address,
      sex: data.sex,
      birthday: data.birthday,
    };

    // Only hash and update password if a new one is provided
    if (data.password && data.password !== "") {
      updateData.password = await hashPassword(data.password);
    }

    // Update the database record
    await prisma.parent.update({
      where: { id: data.id },
      data: updateData,
    });

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

    revalidatePath("/admin/timetable");
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

    revalidatePath("/admin/timetable");
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
    // Use transaction to ensure data consistency
    await prisma.$transaction(async (tx) => {
      // First, delete all timetable slots that reference this timetable
      await tx.timetableSlot.deleteMany({
        where: {
          timetableId: parseInt(id),
        },
      });

      // Then delete the timetable itself
      await tx.timetable.delete({
        where: {
          id: parseInt(id),
        },
      });
    });

    revalidatePath("/admin/timetable");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteEvent = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;

  try {
    await prisma.event.delete({
      where: {
        id: parseInt(id),
      },
    });

    revalidatePath("/admin/events");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteAnnouncement = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;

  try {
    await prisma.announcement.delete({
      where: {
        id: parseInt(id),
      },
    });

    revalidatePath("/admin/announcements");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};
