import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Generate realistic marks with some variation
function generateRealisticMarks(baseScore: number, variance: number = 15): number {
  const marks = baseScore + Math.floor(Math.random() * variance * 2) - variance;
  return Math.max(0, Math.min(100, marks)); // Ensure 0-100 range
}

async function enterAllMarks() {
  try {
    console.log("📚 Entering marks for ALL subjects, ALL terms...\n");
    console.log("=" .repeat(70));

    // Get all Grade 11 exams
    const exams = await prisma.exam.findMany({
      where: {
        grade: {
          level: 11,
        },
      },
      include: {
        grade: true,
      },
      orderBy: {
        term: "asc",
      },
    });

    console.log(`\n✅ Found ${exams.length} Grade 11 exams\n`);

    // Get all students
    const students = await prisma.student.findMany({
      where: {
        class: {
          grade: {
            level: 11,
          },
        },
      },
      include: {
        class: true,
      },
      orderBy: [{ name: "asc" }, { surname: "asc" }],
    });

    console.log(`✅ Found ${students.length} Grade 11 students\n`);

    // Subject teachers and their base performance levels
    const subjectTeachers = {
      Mathematics: { teacher: "Ravi Perera", avgScore: 65 },
      Science: { teacher: "Kamala Senanayake", avgScore: 70 },
      English: { teacher: "Nirmala Jayawardena", avgScore: 68 },
      Sinhala: { teacher: "Suresh Bandara", avgScore: 72 },
      History: { teacher: "Dilan Fernando", avgScore: 66 },
      Buddhism: { teacher: "Sumudu Weerasinghe", avgScore: 75 },
    };

    let totalMarksEntered = 0;
    let totalSubjectsUpdated = 0;

    // Process each exam
    for (const exam of exams) {
      console.log("=" .repeat(70));
      console.log(`📖 ${exam.title} (Term ${exam.term})`);
      console.log("=" .repeat(70));

      // Get all exam subjects for this exam
      const examSubjects = await prisma.examSubject.findMany({
        where: {
          examId: exam.id,
        },
        include: {
          subject: true,
        },
      });

      console.log(`\n   Found ${examSubjects.length} subjects\n`);

      // Process each subject
      for (const examSubject of examSubjects) {
        const subjectName = examSubject.subject.name;
        const teacherInfo = subjectTeachers[subjectName as keyof typeof subjectTeachers];

        console.log(`   📚 ${subjectName} (${teacherInfo?.teacher || "Unknown"})`);

        let marksEntered = 0;

        // Enter marks for each student
        for (const student of students) {
          // Generate marks based on subject's average with some variance
          const baseScore = teacherInfo?.avgScore || 65;
          const marks = generateRealisticMarks(baseScore, 20);

          // Upsert the result
          await prisma.examResult.upsert({
            where: {
              examSubjectId_studentId: {
                examSubjectId: examSubject.id,
                studentId: student.id,
              },
            },
            update: {
              marks: marks,
            },
            create: {
              examId: exam.id,
              examSubjectId: examSubject.id,
              studentId: student.id,
              marks: marks,
            },
          });

          marksEntered++;
        }

        // Update ExamSubject to mark as entered
        await prisma.examSubject.update({
          where: {
            id: examSubject.id,
          },
          data: {
            marksEntered: true,
            marksEnteredAt: new Date(),
          },
        });

        console.log(`      ✅ Entered ${marksEntered} marks`);
        totalMarksEntered += marksEntered;
        totalSubjectsUpdated++;
      }

      console.log("");
    }

    // Final summary
    console.log("\n" + "=" .repeat(70));
    console.log("🎉 MARKS ENTRY COMPLETE!");
    console.log("=" .repeat(70));
    console.log(`\n📊 Summary:`);
    console.log(`   • Total Exams: ${exams.length}`);
    console.log(`   • Total Subjects Updated: ${totalSubjectsUpdated}`);
    console.log(`   • Total Student Records: ${totalMarksEntered}`);
    console.log(`   • Students per Subject: ${students.length}`);
    console.log("");

    // Verify completion
    console.log("=" .repeat(70));
    console.log("🔍 VERIFICATION:");
    console.log("=" .repeat(70));
    console.log("");

    for (const exam of exams) {
      const examSubjects = await prisma.examSubject.findMany({
        where: {
          examId: exam.id,
        },
        include: {
          subject: true,
        },
      });

      const enteredCount = examSubjects.filter(es => es.marksEntered).length;
      const totalCount = examSubjects.length;

      console.log(
        `📖 ${exam.title.padEnd(25)} → ${enteredCount}/${totalCount} subjects ${
          enteredCount === totalCount ? "✅" : "❌"
        }`
      );
    }

    console.log("");

    // Show grade distribution for Term 1 Mathematics as example
    console.log("=" .repeat(70));
    console.log("📊 SAMPLE: Grade Distribution for Term 1 Mathematics");
    console.log("=" .repeat(70));
    console.log("");

    const term1Exam = exams.find(e => e.term === 1);
    if (term1Exam) {
      const mathsExamSubject = await prisma.examSubject.findFirst({
        where: {
          examId: term1Exam.id,
          subject: {
            name: "Mathematics",
          },
        },
      });

      if (mathsExamSubject) {
        const mathsResults = await prisma.examResult.findMany({
          where: {
            examSubjectId: mathsExamSubject.id,
          },
          orderBy: {
            marks: "desc",
          },
        });

        // Calculate grade distribution
        const gradeDistribution = {
          A: mathsResults.filter(r => r.marks >= 75).length,
          B: mathsResults.filter(r => r.marks >= 65 && r.marks < 75).length,
          C: mathsResults.filter(r => r.marks >= 50 && r.marks < 65).length,
          S: mathsResults.filter(r => r.marks >= 35 && r.marks < 50).length,
          F: mathsResults.filter(r => r.marks < 35).length,
        };

        const average =
          mathsResults.reduce((sum, r) => sum + r.marks, 0) / mathsResults.length;

        console.log(`   Total Students: ${mathsResults.length}`);
        console.log(`   Average Marks: ${average.toFixed(2)}`);
        console.log(`   Highest: ${Math.max(...mathsResults.map(r => r.marks))}`);
        console.log(`   Lowest: ${Math.min(...mathsResults.map(r => r.marks))}`);
        console.log("");
        console.log(`   Grade Distribution:`);
        console.log(`      A (75-100%): ${gradeDistribution.A} students`);
        console.log(`      B (65-74%):  ${gradeDistribution.B} students`);
        console.log(`      C (50-64%):  ${gradeDistribution.C} students`);
        console.log(`      S (35-49%):  ${gradeDistribution.S} students`);
        console.log(`      F (0-34%):   ${gradeDistribution.F} students`);
        console.log("");

        // Show top 10
        console.log(`   🏆 Top 10 Students:`);
        mathsResults.slice(0, 10).forEach((result, idx) => {
          const student = students.find(s => s.id === result.studentId);
          if (student) {
            let grade = "F";
            if (result.marks >= 75) grade = "A";
            else if (result.marks >= 65) grade = "B";
            else if (result.marks >= 50) grade = "C";
            else if (result.marks >= 35) grade = "S";

            console.log(
              `      ${(idx + 1).toString().padStart(2)}. ${(
                student.name +
                " " +
                student.surname
              ).padEnd(30)} → ${result.marks}/100 (Grade ${grade})`
            );
          }
        });
      }
    }

    console.log("\n" + "=" .repeat(70));
    console.log("✅ ALL DONE! Marks entered for all subjects in all terms!");
    console.log("=" .repeat(70));
    console.log("\n💡 You can now:");
    console.log("   • Login as any subject teacher");
    console.log("   • View marks in /teacher/marks-entry");
    console.log("   • See all terms marked as 'Marks Entered' ✅");
    console.log("   • Generate report cards for students");
    console.log("   • View class reports and analytics");
    console.log("");

  } catch (error) {
    console.error("❌ Error entering marks:", error);
    if (error instanceof Error) {
      console.error("   Message:", error.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}

enterAllMarks();
