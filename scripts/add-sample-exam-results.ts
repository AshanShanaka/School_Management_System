import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔍 Looking for Class 11-A and existing exams...");

  // Find Class 11-A
  const class11A = await prisma.class.findFirst({
    where: {
      name: "11-A",
    },
    include: {
      grade: true,
      students: true,
    },
  });

  if (!class11A) {
    console.error("❌ Class 11-A not found!");
    return;
  }

  console.log(`✅ Found Class ${class11A.name} with ${class11A.students.length} students`);

  // Get the O/L subjects
  const olSubjects = await prisma.subject.findMany({
    where: {
      name: {
        in: [
          "Sinhala",
          "English",
          "Mathematics",
          "Science",
          "History",
          "Buddhism",
          "Geography",
          "ICT",
        ],
      },
    },
  });

  console.log(`✅ Found ${olSubjects.length} O/L subjects`);

  // Get or create Grade 11 exam type (any available type)
  const examTypes = await prisma.examType.findMany({
    take: 1,
  });

  if (examTypes.length === 0) {
    console.error("❌ No exam types found in database!");
    return;
  }

  const examType = examTypes[0];
  console.log(`✅ Using exam type: ${examType.name}`);

  // Create or find First Term exam for 2025
  const existingExam = await prisma.exam.findFirst({
    where: {
      title: "First Term Examination 2025 - Grade 11",
      gradeId: class11A.gradeId,
    },
  });

  let exam;
  if (existingExam) {
    console.log("✅ Found existing exam:", existingExam.title);
    exam = existingExam;
  } else {
    // Create new exam
    exam = await prisma.exam.create({
      data: {
        title: "First Term Examination 2025 - Grade 11",
        gradeId: class11A.gradeId,
        examTypeId: termTestType.id,
        term: "FIRST",
        year: 2025,
        status: "COMPLETED",
      },
    });
    console.log("✅ Created new exam:", exam.title);
  }

  // Check if exam subjects exist
  const existingExamSubjects = await prisma.examSubject.findMany({
    where: {
      examId: exam.id,
    },
  });

  let examSubjects;
  if (existingExamSubjects.length > 0) {
    console.log(`✅ Found ${existingExamSubjects.length} existing exam subjects`);
    examSubjects = existingExamSubjects;
  } else {
    // Get teachers to assign (we'll just use the first available teacher for each subject)
    const teachers = await prisma.teacher.findMany({
      take: olSubjects.length,
    });

    if (teachers.length === 0) {
      console.error("❌ No teachers found to assign to exam subjects!");
      return;
    }

    // Create exam subjects
    examSubjects = await Promise.all(
      olSubjects.map(async (subject, index) => {
        const teacher = teachers[index % teachers.length]; // Round-robin assignment
        return prisma.examSubject.create({
          data: {
            examId: exam.id,
            subjectId: subject.id,
            teacherId: teacher.id,
            maxMarks: 100,
          },
        });
      })
    );

    console.log(`✅ Created ${examSubjects.length} exam subjects`);
  }

  // Now add exam results for each student
  console.log("\n📝 Adding exam results for students...");

  let resultsAdded = 0;
  let resultsSkipped = 0;

  for (const student of class11A.students) {
    for (const examSubject of examSubjects) {
      // Check if result already exists
      const existingResult = await prisma.examResult.findFirst({
        where: {
          examId: exam.id,
          examSubjectId: examSubject.id,
          studentId: student.id,
        },
      });

      if (existingResult) {
        resultsSkipped++;
        continue;
      }

      // Generate realistic marks (50-95 range with some variation)
      const baseMarks = Math.floor(Math.random() * 45) + 50; // 50-95
      const marks = Math.min(100, baseMarks);

      // Calculate grade based on marks
      let grade: string;
      if (marks >= 75) grade = "A";
      else if (marks >= 65) grade = "B";
      else if (marks >= 50) grade = "C";
      else if (marks >= 35) grade = "S";
      else grade = "W";

      // Create exam result
      await prisma.examResult.create({
        data: {
          examId: exam.id,
          examSubjectId: examSubject.id,
          studentId: student.id,
          marks: marks,
          grade: grade,
        },
      });

      resultsAdded++;
    }

    // Create exam summary for the student
    const studentResults = await prisma.examResult.findMany({
      where: {
        examId: exam.id,
        studentId: student.id,
      },
      include: {
        examSubject: true,
      },
    });

    const totalMarks = studentResults.reduce((sum, result) => sum + result.marks, 0);
    const totalMaxMarks = studentResults.reduce((sum, result) => sum + result.examSubject.maxMarks, 0);
    const percentage = (totalMarks / totalMaxMarks) * 100;
    const average = totalMarks / studentResults.length;

    let overallGrade: string;
    if (percentage >= 75) overallGrade = "A";
    else if (percentage >= 65) overallGrade = "B";
    else if (percentage >= 50) overallGrade = "C";
    else if (percentage >= 35) overallGrade = "S";
    else overallGrade = "W";

    // Check if summary exists
    const existingSummary = await prisma.examSummary.findFirst({
      where: {
        examId: exam.id,
        studentId: student.id,
      },
    });

    if (!existingSummary) {
      await prisma.examSummary.create({
        data: {
          examId: exam.id,
          studentId: student.id,
          totalMarks: totalMarks,
          totalMaxMarks: totalMaxMarks,
          percentage: percentage,
          average: average,
          overallGrade: overallGrade,
          classRank: 0, // Will be updated after all summaries are created
          classSize: class11A.students.length,
        },
      });
    }

    console.log(`✅ Added results for ${student.name} (${studentResults.length} subjects, avg: ${average.toFixed(1)})`);
  }

  // Update class ranks
  const allSummaries = await prisma.examSummary.findMany({
    where: {
      examId: exam.id,
    },
    orderBy: {
      percentage: "desc",
    },
  });

  for (let i = 0; i < allSummaries.length; i++) {
    await prisma.examSummary.update({
      where: {
        id: allSummaries[i].id,
      },
      data: {
        classRank: i + 1,
      },
    });
  }

  console.log("\n✅ COMPLETED!");
  console.log(`📊 Summary:`);
  console.log(`   - Exam: ${exam.title}`);
  console.log(`   - Students: ${class11A.students.length}`);
  console.log(`   - Subjects: ${examSubjects.length}`);
  console.log(`   - Results Added: ${resultsAdded}`);
  console.log(`   - Results Skipped (already exists): ${resultsSkipped}`);
  console.log(`   - Total Results: ${resultsAdded + resultsSkipped}`);
  console.log(`\n🔗 View exam results at: http://localhost:3000/list/exam-results?examId=${exam.id}`);
}

main()
  .catch((error) => {
    console.error("❌ Error:", error);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
