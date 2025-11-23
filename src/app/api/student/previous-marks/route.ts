import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAuth(req);
    if (!authResult.user) {
      console.log("[Previous Marks API] Unauthorized access attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = authResult.user;
    console.log("[Previous Marks API] User authenticated:", { id: user.id, role: user.role, username: user.username });
    
    if (user.role !== "student") {
      console.log("[Previous Marks API] Non-student user attempted access");
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const student = await prisma.student.findUnique({
      where: { id: user.id },
      include: { grade: true },
    });

    if (!student) {
      console.log("[Previous Marks API] Student not found:", user.id);
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    console.log("[Previous Marks API] Student found:", { id: student.id, currentGrade: student.grade.level });

    // Get exam results for Grade 9 & 10
    const examResults = await prisma.examResult.findMany({
      where: {
        studentId: user.id,
        examSubject: {
          exam: {
            grade: {
              level: { in: [9, 10] }
            }
          }
        }
      },
      include: {
        examSubject: {
          include: {
            subject: true,
            exam: {
              include: { grade: true }
            }
          }
        }
      },
      orderBy: {
        examSubject: {
          exam: {
            year: "desc"
          }
        }
      }
    });

    console.log("[Previous Marks API] Exam results found:", examResults.length);

    // Build subjects map from actual exam results instead of pre-filtering by isOLSubject
    const subjectsMap = new Map();

    // First, create entries for all subjects found in exam results
    examResults.forEach((result) => {
      const subjectName = result.examSubject.subject.name;
      if (!subjectsMap.has(subjectName)) {
        subjectsMap.set(subjectName, {
          subjectName: subjectName,
          grade9Term1: null,
          grade9Term2: null,
          grade9Term3: null,
          grade9Average: null,
          grade10Term1: null,
          grade10Term2: null,
          grade10Term3: null,
          grade10Average: null,
          overallAverage: null,
        });
      }
    });

    console.log("[Previous Marks API] Subjects found in results:", Array.from(subjectsMap.keys()));

    examResults.forEach((result) => {
      const subjectName = result.examSubject.subject.name;
      const subjectData = subjectsMap.get(subjectName);
      
      if (subjectData && result.marks !== null) {
        const gradeLevel = result.examSubject.exam.grade.level;
        const examTitle = result.examSubject.exam.title.toLowerCase();
        const examTerm = result.examSubject.exam.term; // Use the term field directly
        
        console.log("[Previous Marks API] Processing:", {
          subject: subjectName,
          grade: gradeLevel,
          term: examTerm,
          title: result.examSubject.exam.title,
          marks: result.marks
        });
        
        // Use the term field from the exam, or try to parse from title as fallback
        let term: number | null = examTerm;
        if (!term) {
          if (examTitle.includes('term 1') || examTitle.includes('1st term')) {
            term = 1;
          } else if (examTitle.includes('term 2') || examTitle.includes('2nd term')) {
            term = 2;
          } else if (examTitle.includes('term 3') || examTitle.includes('3rd term')) {
            term = 3;
          }
        }

        if (gradeLevel === 9 && term) {
          console.log(`[Previous Marks API] Storing Grade 9 Term ${term} for ${subjectName}: ${result.marks}`);
          if (term === 1) subjectData.grade9Term1 = result.marks;
          else if (term === 2) subjectData.grade9Term2 = result.marks;
          else if (term === 3) subjectData.grade9Term3 = result.marks;
        } else if (gradeLevel === 10 && term) {
          console.log(`[Previous Marks API] Storing Grade 10 Term ${term} for ${subjectName}: ${result.marks}`);
          if (term === 1) subjectData.grade10Term1 = result.marks;
          else if (term === 2) subjectData.grade10Term2 = result.marks;
          else if (term === 3) subjectData.grade10Term3 = result.marks;
        } else {
          console.log(`[Previous Marks API] Skipping - Grade: ${gradeLevel}, Term: ${term}, Subject: ${subjectName}`);
        }
      }
    });

    const subjects = Array.from(subjectsMap.values());
    console.log("[Previous Marks API] Subjects array length:", subjects.length);
    console.log("[Previous Marks API] First few subjects:", subjects.slice(0, 3));
    
    subjects.forEach((subject: any) => {
      const grade9Marks = [
        subject.grade9Term1,
        subject.grade9Term2,
        subject.grade9Term3,
      ].filter((m) => m !== null) as number[];
      
      if (grade9Marks.length > 0) {
        subject.grade9Average = grade9Marks.reduce((sum, m) => sum + m, 0) / grade9Marks.length;
      }

      const grade10Marks = [
        subject.grade10Term1,
        subject.grade10Term2,
        subject.grade10Term3,
      ].filter((m) => m !== null) as number[];
      
      if (grade10Marks.length > 0) {
        subject.grade10Average = grade10Marks.reduce((sum, m) => sum + m, 0) / grade10Marks.length;
      }

      const allMarks = [...grade9Marks, ...grade10Marks];
      if (allMarks.length > 0) {
        subject.overallAverage = allMarks.reduce((sum, m) => sum + m, 0) / allMarks.length;
      }
    });

    const allGrade9Averages = subjects
      .map((s: any) => s.grade9Average)
      .filter((avg): avg is number => avg !== null);
    
    const allGrade10Averages = subjects
      .map((s: any) => s.grade10Average)
      .filter((avg): avg is number => avg !== null);

    const overallGrade9Average = allGrade9Averages.length > 0
      ? allGrade9Averages.reduce((sum, avg) => sum + avg, 0) / allGrade9Averages.length
      : 0;

    const overallGrade10Average = allGrade10Averages.length > 0
      ? allGrade10Averages.reduce((sum, avg) => sum + avg, 0) / allGrade10Averages.length
      : 0;

    const allSubjectAverages = subjects
      .map((s: any) => s.overallAverage)
      .filter((avg): avg is number => avg !== null);
    
    const overallAverage = allSubjectAverages.length > 0
      ? allSubjectAverages.reduce((sum, avg) => sum + avg, 0) / allSubjectAverages.length
      : 0;

    console.log("[Previous Marks API] Returning data:", {
      subjects: subjects.length,
      grade9Average: overallGrade9Average,
      grade10Average: overallGrade10Average,
      overallAverage,
      hasData: examResults.length > 0
    });

    return NextResponse.json({
      student: {
        name: student.name,
        surname: student.surname,
        username: student.username,
        currentGrade: student.grade.level,
      },
      subjects,
      statistics: {
        grade9Average: overallGrade9Average,
        grade10Average: overallGrade10Average,
        overallAverage,
        totalSubjects: subjects.length,
      },
      hasData: examResults.length > 0
    });
  } catch (error) {
    console.error("[Previous Marks API] Error:", error);
    console.error("[Previous Marks API] Error details:", error instanceof Error ? error.message : String(error));
    console.error("[Previous Marks API] Error stack:", error instanceof Error ? error.stack : "No stack trace");
    return NextResponse.json(
      { error: "Failed to fetch previous marks" },
      { status: 500 }
    );
  }
}
