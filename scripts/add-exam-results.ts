/**
 * Add Sample Exam Results for Class 11-A
 * This will create realistic exam data for O/L predictions to work
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addExamResults() {
  try {
    console.log('🎯 Adding Sample Exam Results for Class 11-A...\n');

    // Get all students in class 11-A
    const students = await prisma.student.findMany({
      where: { classId: 11 },
      select: { id: true, name: true, surname: true },
    });

    console.log(`Found ${students.length} students\n`);

    // Get or create exams for Grade 11
    const grade11 = await prisma.grade.findFirst({
      where: { level: 11 },
    });

    if (!grade11) {
      console.log('❌ Grade 11 not found!');
      return;
    }

    // Create 3 term exams
    const exams = [];
    for (let term = 1; term <= 3; term++) {
      let exam = await prisma.exam.findFirst({
        where: {
          gradeId: grade11.id,
          term: term,
          year: 2025,
          examTypeEnum: 'TERM',
        },
      });

      if (!exam) {
        exam = await prisma.exam.create({
          data: {
            title: `Term ${term} Exam 2025`,
            gradeId: grade11.id,
            term: term,
            year: 2025,
            examTypeEnum: 'TERM',
            status: 'PUBLISHED',
          },
        });
        console.log(`✓ Created Term ${term} Exam`);
      }
      exams.push(exam);
    }

    // O/L Subjects
    const subjects = await prisma.subject.findMany({
      where: {
        name: {
          in: ['Mathematics', 'Science', 'English', 'Sinhala', 'History', 'Geography', 'Buddhism', 'ICT'],
        },
      },
    });

    if (subjects.length === 0) {
      console.log('❌ No subjects found!');
      return;
    }

    console.log(`\nFound ${subjects.length} subjects`);
    console.log();

    // Create exam subjects for each exam
    const examSubjects = [];
    for (const exam of exams) {
      for (const subject of subjects) {
        let examSubject = await prisma.examSubject.findFirst({
          where: {
            examId: exam.id,
            subjectId: subject.id,
          },
        });

        if (!examSubject) {
          examSubject = await prisma.examSubject.create({
            data: {
              examId: exam.id,
              subjectId: subject.id,
              maxMarks: 100,
            },
          });
        }
        examSubjects.push({ ...examSubject, subjectName: subject.name, term: exam.term });
      }
    }

    console.log(`✓ Created ${examSubjects.length} exam-subject combinations\n`);

    // Add results for each student
    let resultsAdded = 0;
    
    for (const student of students) {
      console.log(`Adding results for ${student.name} ${student.surname}...`);
      
      // Base mark for this student (varies per student for realism)
      const basePerformance = 50 + Math.random() * 40; // 50-90
      
      for (const examSubject of examSubjects) {
        // Check if result already exists
        const existing = await prisma.examResult.findFirst({
          where: {
            studentId: student.id,
            examSubjectId: examSubject.id,
          },
        });

        if (!existing) {
          // Subject variation
          const subjectBonus = {
            'Mathematics': 0,
            'Science': 5,
            'English': -5,
            'Sinhala': 3,
            'History': -3,
            'Geography': 2,
            'Buddhism': 8,
            'ICT': 10,
          }[examSubject.subjectName] || 0;

          // Term progression (students improve over terms)
          const termBonus = (examSubject.term - 1) * 3;

          // Random variation
          const randomVariation = (Math.random() - 0.5) * 10;

          // Calculate final mark
          const mark = Math.max(
            30,
            Math.min(
              100,
              Math.round(basePerformance + subjectBonus + termBonus + randomVariation)
            )
          );

          await prisma.examResult.create({
            data: {
              studentId: student.id,
              examSubjectId: examSubject.id,
              marks: mark,
            },
          });

          resultsAdded++;
        }
      }
      
      console.log(`  ✓ Added results`);
    }

    console.log();
    console.log('='.repeat(70));
    console.log('✅ SUCCESS!');
    console.log(`   Added ${resultsAdded} exam results`);
    console.log(`   ${students.length} students now have complete data`);
    console.log(`   ${subjects.length} subjects × 3 terms = ${subjects.length * 3} results per student`);
    console.log();
    console.log('🎉 O/L Predictions are now ready to use!');
    console.log('   Refresh your browser and try again.');
    console.log('='.repeat(70));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addExamResults();
