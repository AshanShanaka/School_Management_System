import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// POST new lesson
export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Check if a lesson already exists for this subject and teacher
    const existingLesson = await prisma.lesson.findFirst({
      where: {
        subjectId: parseInt(data.subjectId),
        teacherId: data.teacherId,
        classId: parseInt(data.classId),
      },
    });

    if (existingLesson) {
      return NextResponse.json(existingLesson);
    }

    // Create new lesson if it doesn't exist
    const lesson = await prisma.lesson.create({
      data: {
        name: `Lesson for ${data.subjectId}`,
        day: "MONDAY", // Default day
        startTime: "08:00", // Default start time
        endTime: "09:00", // Default end time
        subject: {
          connect: { id: parseInt(data.subjectId) }
        },
        teacher: {
          connect: { id: data.teacherId }
        },
        class: {
          connect: { id: parseInt(data.classId) }
        }
      },
      include: {
        subject: true,
        teacher: true,
        class: true,
      },
    });

    return NextResponse.json(lesson);
  } catch (error) {
    console.error('Error creating lesson:', error);
    return NextResponse.json(
      { error: 'Failed to create lesson' },
      { status: 500 }
    );
  }
} 