import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET all exam types
export async function GET() {
  try {
    const examTypes = await prisma.examType.findMany({
      select: {
        id: true,
        name: true,
      },
    });
    return NextResponse.json(examTypes);
  } catch (error) {
    console.error('Error fetching exam types:', error);
    return NextResponse.json(
      { error: 'Failed to fetch exam types' },
      { status: 500 }
    );
  }
}

// POST new exam type
export async function POST(request: Request) {
  try {
    const data = await request.json();
    const examType = await prisma.examType.create({
      data: {
        name: data.name,
      },
    });
    return NextResponse.json(examType);
  } catch (error) {
    console.error('Error creating exam type:', error);
    return NextResponse.json(
      { error: 'Failed to create exam type' },
      { status: 500 }
    );
  }
} 