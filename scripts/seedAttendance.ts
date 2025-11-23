import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Configuration
const ATTENDANCE_CONFIG = {
  // Attendance patterns (percentage distribution)
  EXCELLENT_ATTENDANCE: { rate: 0.95, percentage: 30 }, // 95%+ attendance, 30% of students
  GOOD_ATTENDANCE: { rate: 0.85, percentage: 50 },      // 85-95% attendance, 50% of students
  AVERAGE_ATTENDANCE: { rate: 0.75, percentage: 15 },   // 75-85% attendance, 15% of students
  POOR_ATTENDANCE: { rate: 0.65, percentage: 5 },       // 65-75% attendance, 5% of students

  // Date range (last 90 days)
  DAYS_TO_GENERATE: 90,

  // Absence patterns
  SICK_LEAVE_PROBABILITY: 0.05,        // 5% chance of sick leave
  CONSECUTIVE_ABSENCE_PROBABILITY: 0.3, // 30% chance absence continues next day
  MAX_CONSECUTIVE_ABSENCES: 3,          // Maximum consecutive sick days
  LATE_ARRIVAL_PROBABILITY: 0.1,       // 10% chance of being late when present
};

type AttendancePattern = "EXCELLENT" | "AVERAGE" | "GOOD" | "POOR";

// Helper: Assign attendance pattern to student
function assignAttendancePattern(): AttendancePattern {
  const rand = Math.random() * 100;
  if (rand < ATTENDANCE_CONFIG.EXCELLENT_ATTENDANCE.percentage) return "EXCELLENT";
  if (rand < ATTENDANCE_CONFIG.EXCELLENT_ATTENDANCE.percentage + ATTENDANCE_CONFIG.GOOD_ATTENDANCE.percentage) return "GOOD";
  if (rand < ATTENDANCE_CONFIG.EXCELLENT_ATTENDANCE.percentage + ATTENDANCE_CONFIG.GOOD_ATTENDANCE.percentage + ATTENDANCE_CONFIG.AVERAGE_ATTENDANCE.percentage) return "AVERAGE";
  return "POOR";
}

// Helper: Get target attendance rate for pattern
function getTargetRate(pattern: AttendancePattern): number {
  switch (pattern) {
    case "EXCELLENT": return ATTENDANCE_CONFIG.EXCELLENT_ATTENDANCE.rate;
    case "GOOD": return ATTENDANCE_CONFIG.GOOD_ATTENDANCE.rate;
    case "AVERAGE": return ATTENDANCE_CONFIG.AVERAGE_ATTENDANCE.rate;
    case "POOR": return ATTENDANCE_CONFIG.POOR_ATTENDANCE.rate;
  }
}

// Helper: Generate attendance for a date
function generateAttendance(
  targetRate: number,
  currentRate: number,
  isConsecutiveAbsence: boolean,
  consecutiveDays: number
): { present: boolean; onTime: boolean } {
  // If in consecutive absence pattern
  if (isConsecutiveAbsence && consecutiveDays < ATTENDANCE_CONFIG.MAX_CONSECUTIVE_ABSENCES) {
    if (Math.random() < ATTENDANCE_CONFIG.CONSECUTIVE_ABSENCE_PROBABILITY) {
      return { present: false, onTime: false };
    }
  }

  // Calculate if student should be present based on target rate
  const shouldBePresent = currentRate < targetRate || Math.random() < (1 - ATTENDANCE_CONFIG.SICK_LEAVE_PROBABILITY);

  if (shouldBePresent) {
    const onTime = Math.random() > ATTENDANCE_CONFIG.LATE_ARRIVAL_PROBABILITY;
    return { present: true, onTime };
  }

  return { present: false, onTime: false };
}

// Helper: Get school days (Monday-Friday only)
function getSchoolDays(startDate: Date, days: number): Date[] {
  const schoolDays: Date[] = [];
  let currentDate = new Date(startDate);

  while (schoolDays.length < days) {
    const dayOfWeek = currentDate.getDay();
    // Skip weekends (0 = Sunday, 6 = Saturday)
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      schoolDays.push(new Date(currentDate));
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return schoolDays;
}

async function main() {
  console.log("🎯 Starting Attendance Data Seeding...\n");

  try {
    // Fetch all students with their classes
    const students = await prisma.student.findMany({
      include: {
        class: {
          include: {
            grade: true,
            supervisor: true, // Get class teacher
          },
        },
      },
      orderBy: [
        { class: { name: "asc" } },
        { surname: "asc" },
      ],
    });

    if (students.length === 0) {
      console.log("❌ No students found in database!");
      return;
    }

    console.log(`📊 Found ${students.length} students`);
    console.log(`📅 Generating ${ATTENDANCE_CONFIG.DAYS_TO_GENERATE} school days of attendance\n`);

    // Generate school days (excluding weekends)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - ATTENDANCE_CONFIG.DAYS_TO_GENERATE);
    const schoolDays = getSchoolDays(startDate, ATTENDANCE_CONFIG.DAYS_TO_GENERATE);

    console.log(`📅 Date Range: ${schoolDays[0].toLocaleDateString()} to ${schoolDays[schoolDays.length - 1].toLocaleDateString()}`);
    console.log(`📚 Total School Days: ${schoolDays.length}\n`);

    console.log("📋 Attendance Pattern Distribution:");
    console.log(`   ⭐ Excellent (95%+): ${ATTENDANCE_CONFIG.EXCELLENT_ATTENDANCE.percentage}% of students`);
    console.log(`   ✅ Good (85-95%): ${ATTENDANCE_CONFIG.GOOD_ATTENDANCE.percentage}% of students`);
    console.log(`   ⚠️  Average (75-85%): ${ATTENDANCE_CONFIG.AVERAGE_ATTENDANCE.percentage}% of students`);
    console.log(`   ❌ Poor (65-75%): ${ATTENDANCE_CONFIG.POOR_ATTENDANCE.percentage}% of students\n`);

    // Assign attendance patterns to students
    const studentPatterns = new Map<string, AttendancePattern>();
    students.forEach((student) => {
      studentPatterns.set(student.id, assignAttendancePattern());
    });

    let totalRecordsCreated = 0;
    let totalRecordsUpdated = 0;

    // Generate attendance for each student
    for (const student of students) {
      const pattern = studentPatterns.get(student.id)!;
      const targetRate = getTargetRate(pattern);

      console.log(`👤 Processing: ${student.name} ${student.surname} (${student.class.name}) - Pattern: ${pattern}`);

      let presentDays = 0;
      let isConsecutiveAbsence = false;
      let consecutiveDays = 0;

      for (const date of schoolDays) {
        const currentRate = presentDays / schoolDays.indexOf(date) || 0;

        // Generate attendance for this day
        const { present, onTime } = generateAttendance(
          targetRate,
          currentRate,
          isConsecutiveAbsence,
          consecutiveDays
        );

        // Update consecutive absence tracking
        if (!present) {
          if (!isConsecutiveAbsence) {
            isConsecutiveAbsence = true;
            consecutiveDays = 1;
          } else {
            consecutiveDays++;
          }
        } else {
          isConsecutiveAbsence = false;
          consecutiveDays = 0;
          presentDays++;
        }

        // Upsert attendance record
        const existingRecord = await prisma.attendance.findFirst({
          where: {
            studentId: student.id,
            classId: student.classId,
            date: date,
          },
        });

        // Determine status based on present and onTime
        const status = !present ? "ABSENT" : (onTime ? "PRESENT" : "LATE");

        if (existingRecord) {
          await prisma.attendance.update({
            where: { id: existingRecord.id },
            data: {
              present,
              status,
            },
          });
          totalRecordsUpdated++;
        } else {
          // Use class supervisor as the teacher who marked attendance
          const teacherId = student.class.supervisor?.id;
          
          if (!teacherId) {
            console.log(`   ⚠️  Skipping - No supervisor found for class ${student.class.name}`);
            continue;
          }

          await prisma.attendance.create({
            data: {
              studentId: student.id,
              classId: student.classId,
              teacherId: teacherId,
              date: date,
              present,
              status,
            },
          });
          totalRecordsCreated++;
        }
      }

      const actualRate = (presentDays / schoolDays.length) * 100;
      console.log(`   ✅ Generated ${schoolDays.length} records | Attendance Rate: ${actualRate.toFixed(1)}%`);
    }

    console.log("\n" + "=".repeat(60));
    console.log("✅ Attendance Seeding Complete!");
    console.log("=".repeat(60));
    console.log(`📊 Summary Statistics:`);
    console.log(`   👥 Students Processed: ${students.length}`);
    console.log(`   📅 School Days: ${schoolDays.length}`);
    console.log(`   ➕ New Records Created: ${totalRecordsCreated}`);
    console.log(`   🔄 Records Updated: ${totalRecordsUpdated}`);
    console.log(`   📝 Total Records: ${totalRecordsCreated + totalRecordsUpdated}`);
    console.log("=".repeat(60) + "\n");

    // Calculate and display overall statistics
    console.log("📈 Overall Attendance Statistics:");
    const allAttendance = await prisma.attendance.findMany({
      where: {
        date: {
          gte: schoolDays[0],
          lte: schoolDays[schoolDays.length - 1],
        },
      },
    });

    const totalPresent = allAttendance.filter((a) => a.present).length;
    const totalOnTime = allAttendance.filter((a) => a.present && a.onTime).length;
    const overallRate = (totalPresent / allAttendance.length) * 100;
    const punctualityRate = totalPresent > 0 ? (totalOnTime / totalPresent) * 100 : 0;

    console.log(`   📊 Overall Attendance Rate: ${overallRate.toFixed(1)}%`);
    console.log(`   ⏰ Punctuality Rate: ${punctualityRate.toFixed(1)}%`);
    console.log(`   ✅ Present Days: ${totalPresent.toLocaleString()}`);
    console.log(`   ❌ Absent Days: ${(allAttendance.length - totalPresent).toLocaleString()}`);
    console.log(`   ⏰ Late Arrivals: ${(totalPresent - totalOnTime).toLocaleString()}`);

  } catch (error) {
    console.error("\n❌ Error during seeding:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
