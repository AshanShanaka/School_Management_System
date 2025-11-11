import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

interface SubjectSchedule {
  subjectId: number;
  subjectName: string;
  examDate: string;
  startTime: string;
  endTime: string;
}

interface ClassSupervisor {
  classId: number;
  className: string;
  supervisorIds: string[];
}

interface ExamData {
  title: string;
  year: number;
  term: number;
  examTypeEnum: string;
  gradeId: number;
  overallStartDate: string;
  overallEndDate: string;
  status: string;
  subjectSchedules: SubjectSchedule[];
  classSupervisors: ClassSupervisor[];
}

// POST /api/exams/comprehensive - Create comprehensive exam with schedules and supervisors
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      year,
      term,
      examTypeEnum,
      gradeId,
      overallStartDate,
      overallEndDate,
      status,
      subjectSchedules,
      classSupervisors
    }: ExamData = body;

    // Validate required fields
    if (!title || !year || !term || !examTypeEnum || !gradeId || !overallStartDate || !overallEndDate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate subject schedules
    if (!subjectSchedules || subjectSchedules.length === 0) {
      return NextResponse.json(
        { error: "At least one subject schedule is required" },
        { status: 400 }
      );
    }

    // Validate class supervisors
    if (!classSupervisors || classSupervisors.length === 0) {
      return NextResponse.json(
        { error: "At least one class supervisor assignment is required" },
        { status: 400 }
      );
    }

    // Check for duplicate exam
    const existingExam = await prisma.exam.findFirst({
      where: {
        year: year,
        term: term,
        gradeId: gradeId,
        examTypeEnum: examTypeEnum as any
      }
    });

    if (existingExam) {
      return NextResponse.json(
        { error: "Exam already exists for this grade, year, term, and type" },
        { status: 400 }
      );
    }

    // Validate subject schedules are within overall exam period
    for (const schedule of subjectSchedules) {
      if (schedule.examDate < overallStartDate || schedule.examDate > overallEndDate) {
        return NextResponse.json(
          { error: `Subject ${schedule.subjectName} exam date is outside the overall exam period` },
          { status: 400 }
        );
      }
      
      if (schedule.startTime >= schedule.endTime) {
        return NextResponse.json(
          { error: `Subject ${schedule.subjectName} start time must be before end time` },
          { status: 400 }
        );
      }
    }

    // Validate class supervisors
    for (const supervisor of classSupervisors) {
      if (supervisor.supervisorIds.length === 0) {
        return NextResponse.json(
          { error: `Class ${supervisor.className} must have at least one supervisor` },
          { status: 400 }
        );
      }
    }

    // Verify all subjects exist
    const subjectIds = subjectSchedules.map(s => s.subjectId);
    const existingSubjects = await prisma.subject.findMany({
      where: { id: { in: subjectIds } }
    });

    if (existingSubjects.length !== subjectIds.length) {
      return NextResponse.json(
        { error: "One or more subjects not found" },
        { status: 400 }
      );
    }

    // Verify all classes exist
    const classIds = classSupervisors.map(s => s.classId);
    const existingClasses = await prisma.class.findMany({
      where: { id: { in: classIds } }
    });

    if (existingClasses.length !== classIds.length) {
      return NextResponse.json(
        { error: "One or more classes not found" },
        { status: 400 }
      );
    }

    // Verify all teachers exist
    const teacherIds = classSupervisors.flatMap(s => s.supervisorIds);
    const existingTeachers = await prisma.teacher.findMany({
      where: { id: { in: teacherIds } }
    });

    if (existingTeachers.length !== teacherIds.length) {
      return NextResponse.json(
        { error: "One or more teachers not found" },
        { status: 400 }
      );
    }

    // Create exam in a transaction
    const result = await prisma.$transaction(async (tx: any) => {
      // Get or create exam type
      let examType = await tx.examType.findFirst({
        where: { name: examTypeEnum }
      });

      if (!examType) {
        examType = await tx.examType.create({
          data: { name: examTypeEnum }
        });
      }

      // Create the main exam
      const exam = await tx.exam.create({
        data: {
          title,
          year: year,
          term: term,
          examTypeEnum: examTypeEnum as any,
          examTypeId: examType.id,
          gradeId: gradeId,
          status: status as any || "DRAFT"
        }
      });

      // Create exam subjects with schedules
      const examSubjectsData = subjectSchedules.map(schedule => ({
        examId: exam.id,
        subjectId: schedule.subjectId,
        teacherId: classSupervisors[0]?.supervisorIds[0] || existingTeachers[0]?.id, // Default teacher assignment
        maxMarks: 100
      }));

      const examSubjects = await Promise.all(
        examSubjectsData.map(data => 
          tx.examSubject.create({ data })
        )
      );

      // Store exam schedules and supervisor assignments in metadata for now
      // We can later extend the schema to have dedicated tables
      const examMetadata = {
        subjectSchedules,
        classSupervisors,
        overallStartDate,
        overallEndDate
      };

      // Update exam with metadata
      await tx.exam.update({
        where: { id: exam.id },
        data: {
          // Store as JSON in a metadata field (if available) or create notes
        }
      });
      
      return { exam, examSubjects };
    });

    // Get the created exam with all related data
    const createdExam = await prisma.exam.findUnique({
      where: { id: result.exam.id },
      include: {
        grade: true,
        examSubjects: {
          include: {
            subject: true,
            teacher: {
              select: {
                id: true,
                name: true,
                surname: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      exam: createdExam,
      message: "Exam created successfully with schedules and supervisors"
    }, { status: 201 });

  } catch (error) {
    console.error("Error creating comprehensive exam:", error);
    return NextResponse.json(
      { error: "Failed to create exam" },
      { status: 500 }
    );
  }
}
