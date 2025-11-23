import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    console.log("=== VIEW HISTORICAL MARKS API CALLED ===");
    
    const user = await getCurrentUser();
    if (!user) {
      console.log("ERROR: No user found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.log("User found:", user.id);

    // Find the teacher
    const teacher = await prisma.teacher.findUnique({
      where: { id: user.id },
      include: {
        classes: {
          include: {
            grade: true,
            students: {
              orderBy: {
                name: "asc",
              },
            },
          },
        },
      },
    });

    if (!teacher) {
      console.log("ERROR: Teacher not found");
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }
    console.log("Teacher found:", teacher.id, "Classes:", teacher.classes.length);

    // Get the class the teacher is teaching (class teacher)
    const classData = teacher.classes[0];

    if (!classData) {
      console.log("ERROR: No class assigned");
      return NextResponse.json(
        { error: "You are not assigned as a class teacher" },
        { status: 403 }
      );
    }
    console.log("Class found:", classData.id, classData.name);

    // Fetch Grade 9 and Grade 10 (historical O/L marks) - Teachers can see both for their class
    const historicalGrades = await prisma.grade.findMany({
      where: {
        level: {
          in: [9, 10], // Grade 9 and 10 for teachers
        },
      },
    });
    console.log("Historical grades found:", historicalGrades.length, historicalGrades.map(g => `Grade ${g.level}`));

    const historicalGradeIds = historicalGrades.map((g) => g.id);

    // Fetch all historical exams (exams for Grade 9 or 10)
    const historicalExams = await prisma.exam.findMany({
      where: {
        gradeId: {
          in: historicalGradeIds,
        },
      },
      include: {
        grade: true,
        examSubjects: {
          include: {
            subject: true,
            subjectResults: {
              where: {
                student: {
                  classId: classData.id, // Only students in this teacher's class
                },
              },
              include: {
                student: {
                  select: {
                    id: true,
                    name: true,
                    surname: true,
                    indexNumber: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: [
        { year: "asc" },
        { term: "asc" },
      ],
    });
    console.log("Historical exams found:", historicalExams.length);
    historicalExams.forEach(exam => {
      console.log(`  - Exam: ${exam.title}, Grade ${exam.grade.level}, Subjects: ${exam.examSubjects.length}`);
      exam.examSubjects.forEach(es => {
        console.log(`    - Subject: ${es.subject.name}, Results: ${es.subjectResults.length}`);
      });
    });

    // Get unique terms and subjects
    const termsSet = new Set<string>();
    const subjectsSet = new Set<string>();

    historicalExams.forEach((exam) => {
      const termKey = `${exam.title}`; // Use exam title as term key
      termsSet.add(termKey);
      
      exam.examSubjects.forEach((examSubject) => {
        subjectsSet.add(examSubject.subject.name);
      });
    });

    const terms = Array.from(termsSet).sort();
    const subjects = Array.from(subjectsSet).sort();

    // Organize data by student
    const studentsMap = new Map<string, any>();

    classData.students.forEach((student) => {
      studentsMap.set(student.id, {
        id: student.id,
        name: student.name,
        surname: student.surname,
        indexNumber: student.indexNumber,
        subjects: {},
        averages: {},
        overallAverage: null,
        totalMarks: 0,
        marksCount: 0,
      });
    });

    // Fill in the marks from exam results
    historicalExams.forEach((exam) => {
      const termKey = exam.title;

      exam.examSubjects.forEach((examSubject) => {
        const subjectName = examSubject.subject.name;

        examSubject.subjectResults.forEach((result) => {
          const studentData = studentsMap.get(result.studentId);
          if (studentData) {
            if (!studentData.subjects[subjectName]) {
              studentData.subjects[subjectName] = {};
            }

            studentData.subjects[subjectName][termKey] = result.marks;

            // Calculate totals for overall average
            if (result.marks !== null) {
              studentData.totalMarks += result.marks;
              studentData.marksCount += 1;
            }
          }
        });
      });
    });

    // Calculate averages for each term and overall
    studentsMap.forEach((studentData) => {
      // Term averages
      terms.forEach((term) => {
        let termTotal = 0;
        let termCount = 0;

        subjects.forEach((subject) => {
          const marks = studentData.subjects[subject]?.[term];
          if (marks !== undefined && marks !== null) {
            termTotal += marks;
            termCount += 1;
          }
        });

        if (termCount > 0) {
          studentData.averages[term] = termTotal / termCount;
        } else {
          studentData.averages[term] = null;
        }
      });

      // Overall average
      if (studentData.marksCount > 0) {
        studentData.overallAverage = studentData.totalMarks / studentData.marksCount;
      }
    });

    // Calculate class statistics
    let totalMarksEntered = 0;
    let classTotal = 0;
    let classCount = 0;

    studentsMap.forEach((studentData) => {
      totalMarksEntered += studentData.marksCount;
      if (studentData.overallAverage !== null) {
        classTotal += studentData.overallAverage;
        classCount += 1;
      }
    });

    const classAverage = classCount > 0 ? classTotal / classCount : 0;

    // Convert map to array
    const students = Array.from(studentsMap.values());

    console.log("=== FINAL RESULT ===");
    console.log("Students:", students.length);
    console.log("Terms:", terms.length, terms);
    console.log("Subjects:", subjects.length, subjects);
    console.log("Total marks entered:", totalMarksEntered);

    return NextResponse.json({
      class: {
        name: classData.name,
        gradeLevel: classData.grade?.level || 11,
      },
      terms,
      students,
      subjects,
      statistics: {
        totalStudents: students.length,
        totalMarksEntered,
        termsImported: terms.length,
        subjectsCount: subjects.length,
        classAverage,
      },
    });
  } catch (error) {
    console.error("=== ERROR IN VIEW HISTORICAL MARKS API ===");
    console.error("Error fetching historical marks:", error);
    return NextResponse.json(
      { error: "Failed to fetch historical marks" },
      { status: 500 }
    );
  }
}
