'use server';

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createExam(state: { success: boolean; error: boolean }, formData: FormData) {
  try {
    const examTypeId = parseInt(formData.get('examType') as string);
    const title = formData.get('title') as string;
    const startTime = new Date(formData.get('startTime') as string);
    const endTime = new Date(formData.get('endTime') as string);
    const duration = formData.get('duration') as string;
    const venue = formData.get('venue') as string;
    const supervisor = formData.get('supervisor') as string;
    const subjectId = parseInt(formData.get('subjectId') as string);
    const teacherId = formData.get('teacherId') as string;

    await prisma.exam.create({
      data: {
        examTypeId,
        title,
        startTime,
        endTime,
        duration,
        venue,
        supervisor,
        subjectId,
        teacherId
      }
    });

    revalidatePath('/exams');
    return { success: true, error: false };
  } catch (error) {
    console.error('Error creating exam:', error);
    return { success: false, error: true };
  }
}

export async function updateExam(state: { success: boolean; error: boolean }, formData: FormData) {
  try {
    const id = parseInt(formData.get('id') as string);
    const examTypeId = parseInt(formData.get('examType') as string);
    const title = formData.get('title') as string;
    const startTime = new Date(formData.get('startTime') as string);
    const endTime = new Date(formData.get('endTime') as string);
    const duration = formData.get('duration') as string;
    const venue = formData.get('venue') as string;
    const supervisor = formData.get('supervisor') as string;
    const subjectId = parseInt(formData.get('subjectId') as string);
    const teacherId = formData.get('teacherId') as string;

    await prisma.exam.update({
      where: { id },
      data: {
        examTypeId,
        title,
        startTime,
        endTime,
        duration,
        venue,
        supervisor,
        subjectId,
        teacherId
      }
    });

    revalidatePath('/exams');
    return { success: true, error: false };
  } catch (error) {
    console.error('Error updating exam:', error);
    return { success: false, error: true };
  }
}

export async function deleteExam(state: { success: boolean; error: boolean }, formData: FormData) {
  try {
    const id = parseInt(formData.get('id') as string);
    await prisma.exam.delete({
      where: { id }
    });

    revalidatePath('/exams');
    return { success: true, error: false };
  } catch (error) {
    console.error('Error deleting exam:', error);
    return { success: false, error: true };
  }
} 