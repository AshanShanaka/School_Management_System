/**
 * Update Student Attendance to Realistic Patterns
 * Creates varied attendance rates based on student performance levels
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Realistic attendance patterns based on student performance
const ATTENDANCE_PATTERNS = {
  EXCELLENT: { min: 92, max: 98 }, // Top performers: 92-98%
  GOOD: { min: 85, max: 94 },      // Good students: 85-94%
  AVERAGE: { min: 75, max: 87 },   // Average students: 75-87%
  WEAK: { min: 60, max: 78 },      // Struggling students: 60-78%
  POOR: { min: 45, max: 65 }       // At-risk students: 45-65%
};

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getAttendancePattern(averageMarks: number): { min: number; max: number } {
  if (averageMarks >= 75) return ATTENDANCE_PATTERNS.EXCELLENT;
  if (averageMarks >= 65) return ATTENDANCE_PATTERNS.GOOD;
  if (averageMarks >= 50) return ATTENDANCE_PATTERNS.AVERAGE;
  if (averageMarks >= 40) return ATTENDANCE_PATTERNS.WEAK;
  return ATTENDANCE_PATTERNS.POOR;
}

async function updateRealisticAttendance() {
  console.log('\n' + '='.repeat(70));
  console.log('📊 UPDATING STUDENT ATTENDANCE TO REALISTIC PATTERNS');
  console.log('='.repeat(70) + '\n');

  try {
    // Get all students with their exam results
    const students = await prisma.student.findMany({
      include: {
        examResults: {
          select: {
            marks: true
          }
        },
        attendances: {
          orderBy: {
            date: 'desc'
          }
        }
      }
    });

    console.log(`Found ${students.length} students\n`);

    let updatedCount = 0;
    const attendanceStats: Record<string, number> = {
      'EXCELLENT (92-98%)': 0,
      'GOOD (85-94%)': 0,
      'AVERAGE (75-87%)': 0,
      'WEAK (60-78%)': 0,
      'POOR (45-65%)': 0
    };

    for (const student of students) {
      // Calculate student's average performance
      const marks = student.examResults.map(r => r.marks);
      const averageMarks = marks.length > 0 
        ? marks.reduce((sum, mark) => sum + mark, 0) / marks.length 
        : 50; // Default to average if no marks

      // Get appropriate attendance pattern
      const pattern = getAttendancePattern(averageMarks);
      const targetAttendanceRate = getRandomInt(pattern.min, pattern.max);

      // Update attendance records (last 45 days)
      if (student.attendances.length > 0) {
        const totalDays = student.attendances.length;
        const targetPresentDays = Math.round((targetAttendanceRate / 100) * totalDays);
        
        // Calculate how many should be absent
        const targetAbsentDays = totalDays - targetPresentDays;

        // Get random attendance records to mark as absent
        const shuffledAttendances = [...student.attendances].sort(() => Math.random() - 0.5);
        
        for (let i = 0; i < Math.min(targetAbsentDays, shuffledAttendances.length); i++) {
          await prisma.attendance.update({
            where: { id: shuffledAttendances[i].id },
            data: { 
              present: false,
              status: 'ABSENT'
            }
          });
        }

        // Mark the rest as present
        for (let i = targetAbsentDays; i < shuffledAttendances.length; i++) {
          await prisma.attendance.update({
            where: { id: shuffledAttendances[i].id },
            data: { 
              present: true,
              status: 'PRESENT'
            }
          });
        }

        updatedCount++;

        // Track statistics
        if (targetAttendanceRate >= 92) attendanceStats['EXCELLENT (92-98%)']++;
        else if (targetAttendanceRate >= 85) attendanceStats['GOOD (85-94%)']++;
        else if (targetAttendanceRate >= 75) attendanceStats['AVERAGE (75-87%)']++;
        else if (targetAttendanceRate >= 60) attendanceStats['WEAK (60-78%)']++;
        else attendanceStats['POOR (45-65%)']++;

        // Show progress
        if (updatedCount % 10 === 0) {
          console.log(`✅ Processed ${updatedCount} students...`);
        }
      }
    }

    console.log('\n' + '='.repeat(70));
    console.log('✅ ATTENDANCE UPDATE COMPLETE!');
    console.log('='.repeat(70) + '\n');

    console.log(`📊 Updated ${updatedCount} students\n`);

    console.log('📈 Attendance Distribution:\n');
    Object.entries(attendanceStats).forEach(([range, count]) => {
      const percentage = ((count / updatedCount) * 100).toFixed(1);
      const bar = '█'.repeat(Math.round(count / 5));
      console.log(`   ${range.padEnd(25)} ${count.toString().padStart(3)} students (${percentage.padStart(5)}%) ${bar}`);
    });

    console.log('\n' + '='.repeat(70));
    console.log('💡 ATTENDANCE PATTERNS APPLIED:');
    console.log('='.repeat(70));
    console.log('   • Excellent performers (75%+ avg):  92-98% attendance');
    console.log('   • Good students (65-74% avg):       85-94% attendance');
    console.log('   • Average students (50-64% avg):    75-87% attendance');
    console.log('   • Weak students (40-49% avg):       60-78% attendance');
    console.log('   • Poor performers (<40% avg):       45-65% attendance');
    console.log('='.repeat(70) + '\n');

    console.log('✅ Students now have realistic attendance rates based on performance!');
    console.log('✅ This creates a more accurate correlation for ML predictions.\n');

  } catch (error) {
    console.error('\n❌ Error updating attendance:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the update
updateRealisticAttendance()
  .then(() => {
    console.log('🎉 Done!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Failed:', error);
    process.exit(1);
  });
