import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addDummyMarks() {
  try {
    console.log('🔍 Finding Grade 11 Term 2 exam...');

    // Find Grade 11
    const grade11 = await prisma.grade.findFirst({
      where: { level: 11 }
    });

    if (!grade11) {
      console.error('❌ Grade 11 not found!');
      return;
    }

    // Find Grade 11 Term 2 exam
    const exam = await prisma.exam.findFirst({
      where: {
        gradeId: grade11.id,
        term: 2,
        year: new Date().getFullYear(),
      },
      include: {
        examSubjects: {
          include: {
            subject: true,
          }
        }
      }
    });

    if (!exam) {
      console.error('❌ Grade 11 Term 2 exam not found!');
      console.log('Available exams:');
      const allExams = await prisma.exam.findMany({
        where: { gradeId: grade11.id },
        include: { grade: true }
      });
      allExams.forEach(e => {
        console.log(`  - ${e.title} (Year: ${e.year}, Term: ${e.term})`);
      });
      return;
    }

    console.log(`✅ Found exam: ${exam.title}`);
    console.log(`   Subjects: ${exam.examSubjects.length}`);

    // Find all Grade 11 students
    const students = await prisma.student.findMany({
      where: { gradeId: grade11.id },
      include: { class: true }
    });

    if (students.length === 0) {
      console.error('❌ No Grade 11 students found!');
      return;
    }

    console.log(`✅ Found ${students.length} Grade 11 students`);

    // Generate dummy marks for each student and each subject
    let totalAdded = 0;
    let totalUpdated = 0;

    for (const examSubject of exam.examSubjects) {
      console.log(`\n📝 Processing subject: ${examSubject.subject.name}`);
      
      for (const student of students) {
        // Generate random mark between 35 and 95 (realistic range)
        const mark = Math.floor(Math.random() * (95 - 35 + 1)) + 35;

        try {
          // Check if result already exists
          const existing = await prisma.examResult.findUnique({
            where: {
              examSubjectId_studentId: {
                examSubjectId: examSubject.id,
                studentId: student.id,
              }
            }
          });

          if (existing) {
            // Update existing
            await prisma.examResult.update({
              where: {
                examSubjectId_studentId: {
                  examSubjectId: examSubject.id,
                  studentId: student.id,
                }
              },
              data: {
                marks: mark,
              }
            });
            totalUpdated++;
          } else {
            // Create new
            await prisma.examResult.create({
              data: {
                examId: exam.id,
                examSubjectId: examSubject.id,
                studentId: student.id,
                marks: mark,
              }
            });
            totalAdded++;
          }
        } catch (error) {
          console.error(`   ⚠️  Error for student ${student.name}: ${error.message}`);
        }
      }
    }

    // Update examSubject to mark as entered
    for (const examSubject of exam.examSubjects) {
      await prisma.examSubject.update({
        where: { id: examSubject.id },
        data: {
          marksEntered: true,
          marksEnteredAt: new Date(),
        }
      });
    }

    console.log('\n✅ Dummy marks added successfully!');
    console.log(`   📊 New results: ${totalAdded}`);
    console.log(`   📊 Updated results: ${totalUpdated}`);
    console.log(`   📊 Total: ${totalAdded + totalUpdated}`);

    // Generate exam summaries
    console.log('\n📊 Generating exam summaries...');
    
    // First, calculate all student totals to determine ranks
    const studentTotals: { studentId: string; totalMarks: number }[] = [];
    
    for (const student of students) {
      const studentResults = await prisma.examResult.findMany({
        where: {
          examId: exam.id,
          studentId: student.id,
        }
      });

      if (studentResults.length > 0) {
        const totalMarks = studentResults.reduce((sum, r) => sum + r.marks, 0);
        studentTotals.push({ studentId: student.id, totalMarks });
      }
    }

    // Sort by total marks descending to calculate ranks
    studentTotals.sort((a, b) => b.totalMarks - a.totalMarks);
    
    const getGrade = (percentage: number): string => {
      if (percentage >= 75) return 'A';
      if (percentage >= 65) return 'B';
      if (percentage >= 50) return 'C';
      if (percentage >= 35) return 'S';
      return 'F';
    };
    
    // Now create summaries with ranks
    for (const student of students) {
      const studentResults = await prisma.examResult.findMany({
        where: {
          examId: exam.id,
          studentId: student.id,
        }
      });

      if (studentResults.length > 0) {
        const totalMarks = studentResults.reduce((sum, r) => sum + r.marks, 0);
        const averageMark = totalMarks / studentResults.length;
        const maxMarks = studentResults.length * 100;
        const percentage = (totalMarks / maxMarks) * 100;
        const overallGrade = getGrade(percentage);
        
        // Find rank
        const rankIndex = studentTotals.findIndex(st => st.studentId === student.id);
        const classRank = rankIndex + 1;

        // Create or update exam summary
        await prisma.examSummary.upsert({
          where: {
            examId_studentId: {
              examId: exam.id,
              studentId: student.id,
            }
          },
          create: {
            examId: exam.id,
            studentId: student.id,
            totalMarks: Math.round(totalMarks),
            totalMaxMarks: maxMarks,
            percentage: Math.round(percentage * 100) / 100,
            average: Math.round(averageMark * 100) / 100,
            overallGrade: overallGrade,
            classRank: classRank,
            classSize: students.length,
          },
          update: {
            totalMarks: Math.round(totalMarks),
            totalMaxMarks: maxMarks,
            percentage: Math.round(percentage * 100) / 100,
            average: Math.round(averageMark * 100) / 100,
            overallGrade: overallGrade,
            classRank: classRank,
            classSize: students.length,
          }
        });
      }
    }

    console.log('✅ Exam summaries generated!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addDummyMarks();
