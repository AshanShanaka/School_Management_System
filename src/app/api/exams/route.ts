import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";

const prisma = new PrismaClient();

// GET /api/exams - Get all exams with filtering
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const gradeId = searchParams.get("gradeId");
    const year = searchParams.get("year");
    const term = searchParams.get("term");
    const status = searchParams.get("status");
    const examTypeId = searchParams.get("examTypeId");
    const examType = searchParams.get("examType");

    const where: any = {};

    if (gradeId) where.gradeId = parseInt(gradeId);
    if (year) where.year = parseInt(year);
    if (term) where.term = parseInt(term);
    if (status) where.status = status;
    if (examTypeId) where.examTypeId = parseInt(examTypeId);
    if (examType) where.examTypeEnum = examType;

    // For non-admin users, only show published exams
    if (user.role !== "admin") {
      where.status = "PUBLISHED";
    }

    const exams = await prisma.exam.findMany({
      where,
      include: {
        grade: true,
        examType: true,
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
        },
        _count: {
          select: {
            results: true,
            examSummaries: true
          }
        }
      },
      orderBy: [
        { year: "desc" },
        { term: "desc" },
        { createdAt: "desc" }
      ]
    });

    return NextResponse.json(exams);
  } catch (error) {
    console.error("Error fetching exams:", error);
    return NextResponse.json(
      { error: "Failed to fetch exams", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// POST /api/exams - Create new exam (Admin only)
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    console.log("📥 Received exam data:", JSON.stringify(body, null, 2));
    
    const {
      name,
      year,
      gradeId,
      term,
      examType,
      status,
      subjects,
      supervisors
    } = body;

    // Validate required fields
    if (!name || !year || !gradeId || !term || !examType) {
      console.log("❌ Missing required fields:", { name, year, gradeId, term, examType });
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check for duplicate exam - database has unique constraint on (year, term, gradeId, examTypeEnum)
    const existingExamByConstraint = await prisma.exam.findFirst({
      where: {
        gradeId: parseInt(gradeId),
        year: parseInt(year),
        term: parseInt(term),
        examTypeEnum: examType,
      }
    });

    if (existingExamByConstraint) {
      console.log("❌ Duplicate exam found by unique constraint:", existingExamByConstraint);
      
      // Get grade name for better error message
      const grade = await prisma.grade.findUnique({
        where: { id: parseInt(gradeId) }
      });
      
      const gradeName = grade ? grade.level : `Grade ${gradeId}`;
      
      return NextResponse.json({ 
        error: `An exam of type "${examType}" already exists for ${gradeName}, Year ${year}, Term ${term}. Only one exam per type is allowed per grade/year/term.`,
        suggestion: `Try one of these options:
        1. Use a different exam type (e.g., UNIT, TERM2, TERM3)
        2. Change the term number
        3. Modify the existing exam: "${existingExamByConstraint.title}"`,
        existingExam: {
          title: existingExamByConstraint.title,
          id: existingExamByConstraint.id
        }
      }, { status: 400 });
    }

    // Additional check for duplicate exam names (optional, for better UX)
    const existingExamByName = await prisma.exam.findFirst({
      where: {
        gradeId: parseInt(gradeId),
        year: parseInt(year),
        term: parseInt(term),
        title: name
      }
    });

    if (existingExamByName) {
      console.log("❌ Duplicate exam found by name:", existingExamByName);
      
      // Get grade name for better error message
      const grade = await prisma.grade.findUnique({
        where: { id: parseInt(gradeId) }
      });
      
      const gradeName = grade ? grade.level : `Grade ${gradeId}`;
      
      return NextResponse.json({ 
        error: `An exam named "${name}" already exists for ${gradeName}, Year ${year}, Term ${term}. Please use a different exam name.` 
      }, { status: 400 });
    }

    // Validate subjects have required fields
    if (subjects && Array.isArray(subjects)) {
      for (const subject of subjects) {
        if (!subject.examDate || !subject.startTime || !subject.endTime) {
          return NextResponse.json({ 
            error: `Subject ${subject.name} is missing exam date, start time, or end time` 
          }, { status: 400 });
        }
      }
    }

    // Validate supervisors
    if (supervisors && Array.isArray(supervisors)) {
      for (const supervisor of supervisors) {
        if (!supervisor.teacherIds || supervisor.teacherIds.length === 0) {
          return NextResponse.json({ 
            error: `Class ${supervisor.className} must have at least one supervisor` 
          }, { status: 400 });
        }
      }
    }

    // Create exam first
    const exam = await prisma.exam.create({
      data: {
        title: name,
        year: parseInt(year),
        gradeId: parseInt(gradeId),
        term: parseInt(term),
        examTypeEnum: examType,
        examTypeId: null, // Set to null since examTypeId is optional
        status: status || "DRAFT",
      }
    });

    // Create exam subjects with scheduling info if the fields exist
    if (subjects && Array.isArray(subjects)) {
      console.log("📚 Creating exam subjects:", subjects.length);
      
      await Promise.all(
        subjects.map(async (subject: any, index: number) => {
          console.log(`📝 Processing subject ${index + 1}:`, subject);
          
          const examSubjectData: any = {
            examId: exam.id,
            subjectId: subject.id,
            maxMarks: 100
          };

          console.log("📊 Exam subject data:", examSubjectData);

          const examSubject = await prisma.examSubject.create({
            data: examSubjectData
          });

          console.log("✅ Created exam subject:", examSubject.id);

          // Update with scheduling info using raw query if needed
          if (subject.examDate && subject.startTime && subject.endTime) {
            await prisma.$executeRaw`
              UPDATE "ExamSubject" 
              SET "examDate" = ${new Date(subject.examDate)}, 
                  "startTime" = ${subject.startTime}, 
                  "endTime" = ${subject.endTime}
              WHERE id = ${examSubject.id}
            `;
          }
        })
      );
    }

    // Create exam supervisors using raw SQL for now
    if (supervisors && Array.isArray(supervisors)) {
      console.log("👥 Creating exam supervisors:", supervisors.length);
      
      for (const supervisor of supervisors) {
        console.log("🏫 Processing supervisor for class:", supervisor.className, "with teachers:", supervisor.teacherIds);
        
        for (const teacherId of supervisor.teacherIds) {
          console.log(`👨‍🏫 Assigning teacher ${teacherId} to class ${supervisor.classId} for exam ${exam.id}`);
          
          await prisma.$executeRaw`
            INSERT INTO "ExamSupervisor" ("examId", "classId", "teacherId")
            VALUES (${exam.id}, ${supervisor.classId}, ${teacherId})
            ON CONFLICT ("examId", "classId", "teacherId") DO NOTHING
          `;
        }
      }
      console.log("✅ All supervisors assigned");
    }

    // Get the created exam with all related data
    const createdExam = await prisma.exam.findUnique({
      where: { id: exam.id },
      include: {
        grade: true,
        examType: true,
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

    return NextResponse.json({ exam: createdExam }, { status: 201 });

  } catch (error) {
    console.error("Error creating exam:", error);
    return NextResponse.json(
      { error: "Failed to create exam", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
