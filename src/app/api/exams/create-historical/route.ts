import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

/**
 * POST /api/exams/create-historical
 * Creates a historical exam entry for previous grade marks
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);

    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, description, term, year, gradeId, subjectIds } = body;

    // Validation
    if (!title || !term || !year || !gradeId || !subjectIds || subjectIds.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create the exam
    const exam = await prisma.exam.create({
      data: {
        title: title,
        description: description || `Historical exam for ${term} ${year}`,
        term: `Historical - ${term}`,
        year: year,
        gradeId: gradeId,
        classId: null, // Historical exams are not tied to a specific class
        examTypeEnum: 'TERM',
      },
    });

    // Create exam subjects
    const examSubjects = await Promise.all(
      subjectIds.map((subjectId: number) =>
        prisma.examSubject.create({
          data: {
            examId: exam.id,
            subjectId: subjectId,
            maxMarks: 100,
            marksEntered: false,
          },
        })
      )
    );

    console.log(`[HistoricalExam] Created exam "${title}" with ${examSubjects.length} subjects`);

    return NextResponse.json({
      success: true,
      examId: exam.id,
      examTitle: exam.title,
      subjectsCount: examSubjects.length,
      message: 'Historical exam created successfully',
    });
  } catch (error) {
    console.error('[HistoricalExam] Error creating historical exam:', error);
    return NextResponse.json(
      { error: 'Failed to create historical exam' },
      { status: 500 }
    );
  }
}
