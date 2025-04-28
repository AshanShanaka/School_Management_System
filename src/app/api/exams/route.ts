import { NextResponse } from 'next/server';
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

// GET all exams
export async function GET() {
  try {
    const exams = await prisma.exam.findMany({
      include: {
        examType: true,
        Subject: true,
        Teacher: true,
        Lesson: true
      },
    });
    return NextResponse.json(exams);
  } catch (error) {
    console.error('Error fetching exams:', error);
    return NextResponse.json(
      { error: 'Failed to fetch exams' },
      { status: 500 }
    );
  }
}

// POST new exam
export async function POST(request: Request) {
  try {
    const data = await request.json();
    const examData: Prisma.ExamCreateInput = {
      title: data.title,
      startTime: new Date(data.startTime),
      endTime: new Date(data.endTime),
      duration: Math.round((new Date(data.endTime).getTime() - new Date(data.startTime).getTime()) / (1000 * 60)).toString(), // Calculate duration in minutes and convert to string
      venue: data.venue,
      examType: {
        connect: { id: parseInt(data.examTypeId) }
      },
      Subject: {
        connect: data.subjectId ? { id: parseInt(data.subjectId) } : undefined
      },
      Teacher: {
        connect: data.teacherId ? { id: data.teacherId } : undefined
      },
      Lesson: {
        connect: data.lessonId ? { id: parseInt(data.lessonId) } : undefined
      }
    };
    
    const exam = await prisma.exam.create({
      data: examData,
      include: {
        examType: true,
        Subject: true,
        Teacher: true,
        Lesson: true
      },
    });
    return NextResponse.json(exam);
  } catch (error) {
    console.error('Error creating exam:', error);
    return NextResponse.json(
      { error: 'Failed to create exam' },
      { status: 500 }
    );
  }
}

// PUT update exam
export async function PUT(request: Request) {
  try {
    const data = await request.json();
    const examData: Prisma.ExamUpdateInput = {
      title: data.title,
      startTime: new Date(data.startTime),
      endTime: new Date(data.endTime),
      duration: Math.round((new Date(data.endTime).getTime() - new Date(data.startTime).getTime()) / (1000 * 60)).toString(), // Calculate duration in minutes and convert to string
      venue: data.venue,
      examType: {
        connect: { id: parseInt(data.examTypeId) }
      },
      Subject: {
        connect: data.subjectId ? { id: parseInt(data.subjectId) } : undefined
      },
      Teacher: {
        connect: data.teacherId ? { id: data.teacherId } : undefined
      },
      Lesson: {
        connect: data.lessonId ? { id: parseInt(data.lessonId) } : undefined
      }
    };
    
    const exam = await prisma.exam.update({
      where: {
        id: parseInt(data.id),
      },
      data: examData,
      include: {
        examType: true,
        Subject: true,
        Teacher: true,
        Lesson: true
      },
    });
    return NextResponse.json(exam);
  } catch (error) {
    console.error('Error updating exam:', error);
    return NextResponse.json(
      { error: 'Failed to update exam' },
      { status: 500 }
    );
  }
} 