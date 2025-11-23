import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function testMarksEntry() {
  try {
    console.log("🧪 Testing Marks Entry System...\n");

    // Step 1: Login as a teacher (Ravi Perera - Mathematics)
    console.log("Step 1: Simulating login as Ravi Perera (Mathematics Teacher)");
    const teacher = await prisma.teacher.findUnique({
      where: { username: "raviperera" },
      include: {
        subjects: true,
        assignedClass: true,
      },
    });

    if (!teacher) {
      console.error("❌ Teacher not found!");
      return;
    }

    console.log(`✅ Logged in as: ${teacher.name} ${teacher.surname}`);
    console.log(`   Subjects: ${teacher.subjects.map(s => s.name).join(", ")}`);
    console.log(`   Class: ${teacher.assignedClass?.name || "None"}\n`);

    // Step 2: Get assigned exams (simulating /api/teacher/assigned-exams)
    console.log("Step 2: Fetching assigned exams...");
    const subjectIds = teacher.subjects.map(s => s.id);

    const examSubjects = await prisma.examSubject.findMany({
      where: {
        subjectId: { in: subjectIds },
        exam: {
          status: { in: ["PUBLISHED", "MARKS_ENTRY", "CLASS_REVIEW"] },
          grade: { level: 11 },
        },
      },
      include: {
        exam: {
          include: {
            grade: true,
          },
        },
        subject: true,
      },
      orderBy: [
        { exam: { year: "desc" } },
        { exam: { term: "desc" } },
      ],
    });

    console.log(`✅ Found ${examSubjects.length} exam-subject assignments\n`);
    
    if (examSubjects.length === 0) {
      console.error("❌ No exams found! Teacher has no exam assignments.");
      return;
    }

    examSubjects.forEach((es, idx) => {
      console.log(`   ${idx + 1}. ${es.exam.title} → ${es.subject.name}`);
      console.log(`      Status: ${es.marksEntered ? "✅ Entered" : "❌ Pending"}`);
    });

    // Step 3: Test GET request for marks entry (simulating /api/marks-entry/[examId])
    console.log("\n" + "=".repeat(70));
    console.log("Step 3: Testing marks entry page data...");
    console.log("=".repeat(70) + "\n");

    const firstExamSubject = examSubjects[0];
    const examId = firstExamSubject.exam.id;
    const subjectId = firstExamSubject.subject.id;

    console.log(`📖 Exam: ${firstExamSubject.exam.title}`);
    console.log(`📚 Subject: ${firstExamSubject.subject.name}`);
    console.log(`🎓 Grade: ${firstExamSubject.exam.grade.level}\n`);

    // Get students for this exam
    const students = await prisma.student.findMany({
      where: {
        class: {
          grade: {
            level: firstExamSubject.exam.grade.level,
          },
        },
      },
      include: {
        class: true,
      },
      orderBy: [
        { name: "asc" },
        { surname: "asc" },
      ],
    });

    console.log(`👥 Students found: ${students.length}\n`);

    // Get existing results
    const existingResults = await prisma.examResult.findMany({
      where: {
        examSubjectId: firstExamSubject.id,
      },
    });

    console.log(`📝 Existing results: ${existingResults.length}`);
    
    if (existingResults.length > 0) {
      const withMarks = existingResults.filter(r => r.marks !== null).length;
      console.log(`   Results with marks: ${withMarks}/${existingResults.length}`);
    }

    // Step 4: Add sample marks for first 5 students
    console.log("\n" + "=".repeat(70));
    console.log("Step 4: Adding sample marks for first 5 students...");
    console.log("=".repeat(70) + "\n");

    const sampleMarks = [85, 92, 78, 88, 95];
    const studentsToUpdate = students.slice(0, 5);

    for (let i = 0; i < studentsToUpdate.length; i++) {
      const student = studentsToUpdate[i];
      const marks = sampleMarks[i];

      console.log(`${i + 1}. ${student.name} ${student.surname} (${student.class.name}) → ${marks}/100`);

      // Upsert the result
      const result = await prisma.examResult.upsert({
        where: {
          examSubjectId_studentId: {
            examSubjectId: firstExamSubject.id,
            studentId: student.id,
          },
        },
        update: {
          marks: marks,
        },
        create: {
          examId: examId,
          examSubjectId: firstExamSubject.id,
          studentId: student.id,
          marks: marks,
        },
      });

      console.log(`   ✅ Saved: Result ID ${result.id}`);
    }

    // Step 5: Update ExamSubject to mark as entered
    console.log("\n" + "=".repeat(70));
    console.log("Step 5: Marking exam subject as 'Marks Entered'...");
    console.log("=".repeat(70) + "\n");

    const updatedExamSubject = await prisma.examSubject.update({
      where: {
        id: firstExamSubject.id,
      },
      data: {
        marksEntered: true,
        marksEnteredAt: new Date(),
      },
    });

    console.log(`✅ ExamSubject updated!`);
    console.log(`   Marks Entered: ${updatedExamSubject.marksEntered}`);
    console.log(`   Entered At: ${updatedExamSubject.marksEnteredAt}\n`);

    // Step 6: Verify the results
    console.log("=".repeat(70));
    console.log("Step 6: Verifying saved marks...");
    console.log("=".repeat(70) + "\n");

    const verifyResults = await prisma.examResult.findMany({
      where: {
        examSubjectId: firstExamSubject.id,
        // marks is required field, so no need to filter
      },
      include: {
        student: {
          include: {
            class: true,
          },
        },
      },
      orderBy: {
        marks: "desc",
      },
      take: 10,
    });

    console.log(`📊 Top 10 Students with Marks:\n`);
    verifyResults.forEach((result, idx) => {
      console.log(
        `   ${idx + 1}. ${result.student.name} ${result.student.surname} (${result.student.class.name}) → ${result.marks}/100`
      );
    });

    // Final Summary
    console.log("\n" + "=".repeat(70));
    console.log("✅ TEST COMPLETED SUCCESSFULLY!");
    console.log("=".repeat(70));
    console.log(`\n📋 Summary:`);
    console.log(`   • Teacher: ${teacher.name} ${teacher.surname}`);
    console.log(`   • Subject: ${firstExamSubject.subject.name}`);
    console.log(`   • Exam: ${firstExamSubject.exam.title}`);
    console.log(`   • Students with marks: ${verifyResults.length}`);
    console.log(`   • Marks Entry Status: ✅ ENTERED`);
    console.log(`\n💡 You can now:`);
    console.log(`   1. Login as '${teacher.username}' (password: password)`);
    console.log(`   2. Go to /teacher/marks-entry`);
    console.log(`   3. See the exam marked as "Marks Entered" ✅`);
    console.log(`   4. Click "Update Marks" to edit or add more marks`);
    console.log(``);

  } catch (error) {
    console.error("❌ Error during test:", error);
    if (error instanceof Error) {
      console.error("   Message:", error.message);
      console.error("   Stack:", error.stack);
    }
  } finally {
    await prisma.$disconnect();
  }
}

testMarksEntry();
