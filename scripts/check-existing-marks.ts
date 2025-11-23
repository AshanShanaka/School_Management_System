import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkExistingMarks() {
  try {
    console.log("🔍 Checking existing marks for Grade 11 exams...\n");

    // Get all Grade 11 exams
    const grade11 = await prisma.grade.findFirst({
      where: { level: 11 },
    });

    if (!grade11) {
      console.log("❌ Grade 11 not found");
      return;
    }

    // Get all exams for Grade 11
    const exams = await prisma.exam.findMany({
      where: {
        gradeId: grade11.id,
      },
      include: {
        grade: true,
        examSubjects: {
          include: {
            subject: true,
            _count: {
              select: {
                subjectResults: true,
              },
            },
          },
        },
      },
      orderBy: {
        title: "asc",
      },
    });

    console.log(`📚 Found ${exams.length} exams for Grade 11\n`);
    console.log("=".repeat(80));

    for (const exam of exams) {
      console.log(`\n📖 ${exam.title}`);
      console.log(`   Status: ${exam.status}`);
      console.log(`   Subjects: ${exam.examSubjects.length}`);

      if (exam.examSubjects.length === 0) {
        console.log(`   ⚠️  No subjects configured for this exam`);
      } else {
        console.log(`\n   📋 Subject Details:`);
        
        let totalMarksEntered = 0;
        let totalSubjects = exam.examSubjects.length;

        for (const examSubject of exam.examSubjects) {
          const hasMarks = examSubject._count.subjectResults > 0;
          const marksEnteredStatus = examSubject.marksEntered ? "✅" : "❌";
          
          console.log(
            `      ${marksEnteredStatus} ${examSubject.subject.name} - ` +
            `${examSubject._count.subjectResults} students have marks ` +
            `(Max: ${examSubject.maxMarks}) ` +
            `${examSubject.marksEntered ? `[Entered on ${examSubject.marksEnteredAt?.toLocaleDateString()}]` : "[Not Entered]"}`
          );

          if (examSubject.marksEntered) totalMarksEntered++;
        }

        const completionRate = ((totalMarksEntered / totalSubjects) * 100).toFixed(1);
        console.log(`\n   📊 Completion: ${totalMarksEntered}/${totalSubjects} subjects (${completionRate}%)`);
        
        if (totalMarksEntered === totalSubjects) {
          console.log(`   ✨ All marks entered for this exam!`);
        } else if (totalMarksEntered > 0) {
          console.log(`   ⚠️  Partially completed - ${totalSubjects - totalMarksEntered} subjects remaining`);
        } else {
          console.log(`   ❌ No marks entered yet`);
        }
      }

      console.log(`\n` + "-".repeat(80));
    }

    // Summary statistics
    console.log(`\n\n📊 SUMMARY:`);
    console.log(`=`.repeat(80));
    
    const totalExams = exams.length;
    const examsWithMarks = exams.filter(e => 
      e.examSubjects.some(es => es.marksEntered)
    ).length;
    const fullyCompleted = exams.filter(e => 
      e.examSubjects.length > 0 && e.examSubjects.every(es => es.marksEntered)
    ).length;

    console.log(`   Total Exams: ${totalExams}`);
    console.log(`   Exams with some marks: ${examsWithMarks}`);
    console.log(`   Fully completed exams: ${fullyCompleted}`);
    console.log(`   Exams without marks: ${totalExams - examsWithMarks}`);

    // Check specific term exams
    console.log(`\n\n🔍 CHECKING SPECIFIC TERMS:`);
    console.log(`=`.repeat(80));

    const terms = ["Term 1", "Term 2", "Term 3"];
    for (const termName of terms) {
      const termExam = exams.find(e => 
        e.title.toLowerCase().includes(termName.toLowerCase())
      );

      if (termExam) {
        const hasMarks = termExam.examSubjects.some(es => es.marksEntered);
        const allMarks = termExam.examSubjects.every(es => es.marksEntered);
        
        console.log(`\n   📅 ${termName}:`);
        console.log(`      Exam Title: ${termExam.title}`);
        console.log(`      Status: ${termExam.status}`);
        console.log(`      Subjects: ${termExam.examSubjects.length}`);
        console.log(`      Has Marks: ${hasMarks ? "✅ Yes" : "❌ No"}`);
        console.log(`      Complete: ${allMarks ? "✅ Yes" : "❌ No"}`);
        
        if (hasMarks) {
          const completedSubjects = termExam.examSubjects.filter(es => es.marksEntered).length;
          console.log(`      Progress: ${completedSubjects}/${termExam.examSubjects.length} subjects`);
        }
      } else {
        console.log(`\n   📅 ${termName}: ❌ Not found`);
      }
    }

    console.log(`\n\n✨ Done!`);
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkExistingMarks();
