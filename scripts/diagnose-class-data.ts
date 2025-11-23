/**
 * Diagnostic Script - Check Class 11-A Data
 * Run: npx tsx scripts/diagnose-class-data.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function diagnoseClassData() {
  try {
    console.log('='.repeat(70));
    console.log('DIAGNOSING CLASS 11-A DATA');
    console.log('='.repeat(70));
    console.log();

    // Get class info
    const classInfo = await prisma.class.findUnique({
      where: { id: 11 },
      include: {
        grade: true,
        _count: {
          select: {
            students: true,
          },
        },
      },
    });

    if (!classInfo) {
      console.log('❌ Class 11 not found!');
      return;
    }

    console.log('📚 Class Information:');
    console.log(`   Name: ${classInfo.name}`);
    console.log(`   Grade: ${classInfo.grade.level}`);
    console.log(`   Students: ${classInfo._count.students}`);
    console.log();

    // Get students with exam results
    const students = await prisma.student.findMany({
      where: { classId: 11 },
      select: {
        id: true,
        name: true,
        surname: true,
        _count: {
          select: {
            results: true,
            attendances: true,
          },
        },
      },
    });

    console.log('👥 Students in Class:');
    console.log('-'.repeat(70));
    
    let studentsWithData = 0;
    
    for (const student of students) {
      const hasData = student._count.results > 0;
      if (hasData) studentsWithData++;
      
      const status = hasData ? '✓' : '✗';
      const color = hasData ? '\x1b[32m' : '\x1b[31m'; // Green or Red
      const reset = '\x1b[0m';
      
      console.log(`${color}${status}${reset} ${student.name} ${student.surname}`);
      console.log(`   - Exam Results: ${student._count.results}`);
      console.log(`   - Attendance Records: ${student._count.attendances}`);
      
      if (student._count.results > 0) {
        // Get subject breakdown
        const results = await prisma.examResult.findMany({
          where: { studentId: student.id },
          include: {
            examSubject: {
              include: {
                subject: true,
              },
            },
          },
        });
        
        const subjectCounts = new Map<string, number>();
        results.forEach(r => {
          const subject = r.examSubject.subject.name;
          subjectCounts.set(subject, (subjectCounts.get(subject) || 0) + 1);
        });
        
        console.log(`   - Subjects: ${Array.from(subjectCounts.entries()).map(([s, c]) => `${s}(${c})`).join(', ')}`);
      }
      
      console.log();
    }

    console.log('='.repeat(70));
    console.log('SUMMARY:');
    console.log(`   Total Students: ${students.length}`);
    console.log(`   Students with Exam Data: ${studentsWithData}`);
    console.log(`   Students without Data: ${students.length - studentsWithData}`);
    console.log();

    if (studentsWithData === 0) {
      console.log('❌ NO STUDENTS HAVE EXAM DATA!');
      console.log('   To fix this:');
      console.log('   1. Make sure exams exist for Grade 11');
      console.log('   2. Add exam results for students');
      console.log('   3. Use the seed script or admin panel to add data');
    } else if (studentsWithData < students.length) {
      console.log('⚠️  SOME STUDENTS MISSING EXAM DATA');
      console.log('   Predictions will only work for students with data');
    } else {
      console.log('✅ ALL STUDENTS HAVE EXAM DATA');
      console.log('   Ready for predictions!');
    }

    console.log('='.repeat(70));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

diagnoseClassData();
