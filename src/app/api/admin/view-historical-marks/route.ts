import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const classId = searchParams.get("classId");

    if (classId) {
      // Fetch data for a specific class
      const classData = await prisma.class.findUnique({
        where: { id: parseInt(classId) },
        include: {
          grade: true,
          students: {
            orderBy: {
              name: "asc",
            },
          },
        },
      });

      if (!classData) {
        return NextResponse.json({ error: "Class not found" }, { status: 404 });
      }

      // Fetch all historical exams (Grade 9 & 10) for this class's students
      const historicalGrades = await prisma.grade.findMany({
        where: {
          level: {
            in: [9, 10],
          },
        },
      });

      const historicalGradeIds = historicalGrades.map((g) => g.id);

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
                    classId: parseInt(classId),
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

      // Check if there's any historical data
      const hasHistoricalData = historicalExams.some(
        (exam) => exam.examSubjects.some(
          (es) => es.subjectResults.length > 0
        )
      );

      if (!hasHistoricalData) {
        return NextResponse.json(
          { error: "No historical marks found for this class" },
          { status: 404 }
        );
      }

      // Get unique terms and subjects
      const termsSet = new Set<string>();
      const subjectsSet = new Set<string>();

      historicalExams.forEach((exam) => {
        const termKey = exam.title;
        termsSet.add(termKey);
        
        exam.examSubjects.forEach((examSubject) => {
          subjectsSet.add(examSubject.subject.name);
        });
      });

      const terms = Array.from(termsSet).sort();
      const subjects = Array.from(subjectsSet).sort();

      // Organize data by student
      const studentDataMap = new Map();

      classData.students.forEach((student) => {
        studentDataMap.set(student.id, {
          id: student.id,
          name: student.name,
          surname: student.surname,
          indexNumber: student.indexNumber,
          subjects: {},
          averages: {},
          allMarks: [],
        });

        // Initialize subject structure
        subjects.forEach((subject) => {
          studentDataMap.get(student.id).subjects[subject] = {};
          terms.forEach((term) => {
            studentDataMap.get(student.id).subjects[subject][term] = null;
          });
        });
      });

      // Fill in marks from exam results
      historicalExams.forEach((exam) => {
        const termKey = exam.title;
        
        exam.examSubjects.forEach((examSubject) => {
          examSubject.subjectResults.forEach((result) => {
            const studentData = studentDataMap.get(result.student.id);
            if (studentData && result.marks !== null) {
              studentData.subjects[examSubject.subject.name][termKey] = result.marks;
              studentData.allMarks.push(result.marks);
            }
          });
        });
      });

      // Calculate averages for each student
      const students = Array.from(studentDataMap.values()).map((studentData) => {
        // Calculate term averages
        terms.forEach((term) => {
          const marksForTerm: number[] = [];
          subjects.forEach((subject) => {
            const marks = studentData.subjects[subject][term];
            if (marks !== null) {
              marksForTerm.push(marks);
            }
          });

          if (marksForTerm.length > 0) {
            const sum = marksForTerm.reduce((a, b) => a + b, 0);
            studentData.averages[term] = sum / marksForTerm.length;
          } else {
            studentData.averages[term] = null;
          }
        });

        // Calculate overall average
        const overallAverage =
          studentData.allMarks.length > 0
            ? studentData.allMarks.reduce((a, b) => a + b, 0) / studentData.allMarks.length
            : null;

        return {
          id: studentData.id,
          name: studentData.name,
          surname: studentData.surname,
          indexNumber: studentData.indexNumber,
          subjects: studentData.subjects,
          averages: studentData.averages,
          overallAverage,
        };
      });

      // Calculate statistics
      let totalMarksEntered = 0;
      students.forEach((student) => {
        subjects.forEach((subject) => {
          terms.forEach((term) => {
            if (student.subjects[subject][term] !== null) {
              totalMarksEntered++;
            }
          });
        });
      });

      const allAverages = students
        .map((s) => s.overallAverage)
        .filter((avg): avg is number => avg !== null);

      const classAverage =
        allAverages.length > 0
          ? allAverages.reduce((a, b) => a + b, 0) / allAverages.length
          : 0;

      const response = {
        class: {
          name: classData.name,
          gradeLevel: classData.grade.level,
        },
        terms,
        subjects,
        students,
        statistics: {
          totalStudents: classData.students.length,
          totalMarksEntered,
          termsImported: terms.length,
          subjectsCount: subjects.length,
          classAverage,
        },
      };

      return NextResponse.json(response);
    }

    return NextResponse.json({ error: "Class ID required" }, { status: 400 });
  } catch (error) {
    console.error("Error fetching historical marks:", error);
    return NextResponse.json(
      { error: "Failed to fetch historical marks" },
      { status: 500 }
    );
  }
}
