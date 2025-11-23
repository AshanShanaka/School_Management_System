/**
 * Check Student Data Script
 * Verifies if a student has the necessary data for predictions and historical marks
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkStudentData(studentId: string) {
  console.log(`\n=== Checking data for student: ${studentId} ===\n`);

  try {
    // 1. Check if student exists
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        grade: true,
      },
    });

    if (!student) {
      console.error('❌ Student not found!');
      return;
    }

    console.log(`✅ Student found: ${student.name} ${student.surname}`);
    console.log(`   Username: ${student.username}`);
    console.log(`   Grade: ${student.grade.level}\n`);

    // 2. Check exam results
    const examResults = await prisma.examResult.findMany({
      where: { studentId },
      include: {
        exam: {
          select: {
            title: true,
            term: true,
            year: true,
            createdAt: true,
          },
        },
        examSubject: {
          select: {
            subject: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    console.log(`📊 Exam Results: ${examResults.length} records`);
    if (examResults.length > 0) {
      const subjectCounts = new Map<string, number>();
      examResults.forEach((result) => {
        const subjectName = result.examSubject.subject.name;
        subjectCounts.set(subjectName, (subjectCounts.get(subjectName) || 0) + 1);
      });

      console.log('   Subject breakdown:');
      subjectCounts.forEach((count, subject) => {
        const status = count >= 3 ? '✅' : '⚠️';
        console.log(`   ${status} ${subject}: ${count} results`);
      });
    } else {
      console.log('   ⚠️ No exam results found!');
    }
    console.log('');

    // 3. Check attendance
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        studentId,
        date: { gte: thirtyDaysAgo },
      },
    });

    console.log(`📅 Attendance (last 30 days): ${attendanceRecords.length} records`);
    if (attendanceRecords.length > 0) {
      const presentCount = attendanceRecords.filter((r) => r.present).length;
      const rate = ((presentCount / attendanceRecords.length) * 100).toFixed(1);
      console.log(`   ✅ Present: ${presentCount}/${attendanceRecords.length} (${rate}%)`);
    } else {
      console.log('   ⚠️ No attendance records in the last 30 days!');
    }
    console.log('');

    // 4. Check historical marks (Grade 9 & 10)
    const historicalMarks = await prisma.historicalMark.findMany({
      where: {
        studentId,
        grade: { in: [9, 10] },
      },
      include: {
        subject: true,
      },
    });

    console.log(`📚 Historical Marks (Grade 9 & 10): ${historicalMarks.length} records`);
    if (historicalMarks.length > 0) {
      const byGrade = { 9: new Set(), 10: new Set() };
      historicalMarks.forEach((mark) => {
        byGrade[mark.grade as 9 | 10].add(mark.subject.name);
      });

      console.log(`   Grade 9: ${byGrade[9].size} subjects, ${historicalMarks.filter(m => m.grade === 9).length} marks`);
      console.log(`   Grade 10: ${byGrade[10].size} subjects, ${historicalMarks.filter(m => m.grade === 10).length} marks`);
    } else {
      console.log('   ⚠️ No historical marks found!');
    }
    console.log('');

    // 5. Summary
    console.log('=== SUMMARY ===');
    const canPredict = examResults.length >= 10 && attendanceRecords.length > 0;
    const hasHistorical = historicalMarks.length > 0;

    console.log(`Prediction Ready: ${canPredict ? '✅ YES' : '❌ NO'}`);
    console.log(`Historical Marks Available: ${hasHistorical ? '✅ YES' : '❌ NO'}`);

    if (!canPredict) {
      console.log('\n⚠️ To enable predictions:');
      if (examResults.length < 10) {
        console.log(`   - Add more exam results (need at least 10, have ${examResults.length})`);
      }
      if (attendanceRecords.length === 0) {
        console.log('   - Add attendance records (last 30 days)');
      }
    }

    if (!hasHistorical) {
      console.log('\n⚠️ To show historical marks:');
      console.log('   - Add historical marks for Grade 9 & 10');
      console.log('   - Use the import script: npm run import-historical-marks');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Get student ID from command line or use default
const studentId = process.argv[2] || 'student-temp-id';

checkStudentData(studentId);
