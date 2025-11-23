/**
 * Test script to verify student dashboard APIs
 * Tests: previous marks, assignments grouping
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testStudentAPIs() {
  try {
    console.log('\n=== TESTING STUDENT DASHBOARD APIs ===\n');

    // Get a sample student
    const student = await prisma.student.findFirst({
      include: {
        class: true,
        grade: true,
      },
    });

    if (!student) {
      console.log('❌ No students found in database');
      return;
    }

    console.log(`✓ Testing with student: ${student.name} ${student.surname} (${student.id})`);
    console.log(`  Class: ${student.class.name}, Grade: ${student.grade.level}\n`);

    // Test 1: Assignments Query
    console.log('--- TEST 1: ASSIGNMENTS QUERY ---');
    const assignments = await prisma.assignment.findMany({
      where: {
        lesson: {
          class: {
            students: { some: { id: student.id } },
          },
        },
        dueDate: { gte: new Date() },
      },
      include: {
        lesson: {
          include: {
            subject: true,
            class: true,
          },
        },
      },
      orderBy: { dueDate: 'asc' },
      take: 50,
    });

    console.log(`Total assignments found: ${assignments.length}`);
    
    // Group by subject
    const bySubject: Record<string, number> = {};
    assignments.forEach(a => {
      const subject = a.lesson.subject.name;
      bySubject[subject] = (bySubject[subject] || 0) + 1;
    });

    console.log(`\nGrouped by subject:`);
    Object.entries(bySubject).forEach(([subject, count]) => {
      console.log(`  ✓ ${subject}: ${count} assignments`);
    });

    if (Object.keys(bySubject).length === 0) {
      console.log('⚠️  NO ASSIGNMENTS GROUPED - This is the problem!');
    } else {
      console.log(`\n✅ Assignments are properly grouped into ${Object.keys(bySubject).length} subjects`);
    }

    // Test 2: Previous Marks Query  
    console.log('\n--- TEST 2: PREVIOUS MARKS QUERY ---');
    
    const examResults = await prisma.examResult.findMany({
      where: {
        studentId: student.id,
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
              include: {
                grade: true
              }
            }
          }
        }
      },
    });

    console.log(`Exam results found for Grade 9 & 10: ${examResults.length}`);

    if (examResults.length === 0) {
      console.log('⚠️  NO EXAM RESULTS - Student needs historical marks seeded!');
      console.log('   Run: npm run seed-historical-marks');
    } else {
      // Group by subject
      const resultsBySubject: Record<string, any[]> = {};
      examResults.forEach(result => {
        const subject = result.examSubject.subject.name;
        if (!resultsBySubject[subject]) resultsBySubject[subject] = [];
        resultsBySubject[subject].push({
          grade: result.examSubject.exam.grade.level,
          marks: result.marks,
          exam: result.examSubject.exam.name
        });
      });

      console.log(`\nResults by subject:`);
      Object.entries(resultsBySubject).forEach(([subject, results]) => {
        console.log(`  ✓ ${subject}: ${results.length} exam records`);
      });
      console.log(`\n✅ Previous marks data exists`);
    }

    // Test 3: Check OL Subjects
    console.log('\n--- TEST 3: O/L SUBJECTS ---');
    const olSubjects = await prisma.subject.findMany({
      where: { isOLSubject: true },
      orderBy: { name: 'asc' },
    });

    console.log(`O/L subjects found: ${olSubjects.length}`);
    olSubjects.forEach(s => console.log(`  - ${s.name}`));

    console.log('\n=== TEST COMPLETE ===\n');

  } catch (error) {
    console.error('❌ Error during testing:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testStudentAPIs();
