import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function addAttendanceData() {
  try {
    console.log("🎯 Starting attendance data generation...");

    // Find Grade 11
    const grade11 = await prisma.grade.findFirst({
      where: { level: 11 },
    });

    if (!grade11) {
      console.error("❌ Grade 11 not found!");
      return;
    }

    console.log(`✅ Found Grade 11 (ID: ${grade11.id})`);

    // Find Grade 11-A class
    const class11A = await prisma.class.findFirst({
      where: {
        gradeId: grade11.id,
        name: {
          contains: "A",
        },
      },
      include: {
        students: true,
        classTeacher: true,
      },
    });

    if (!class11A) {
      console.error("❌ Grade 11-A class not found!");
      return;
    }

    console.log(`✅ Found class: ${class11A.name} (ID: ${class11A.id})`);
    console.log(`📚 Students in class: ${class11A.students.length}`);

    if (!class11A.classTeacherId) {
      console.error("❌ No class teacher assigned to Grade 11-A!");
      return;
    }

    console.log(`👨‍🏫 Class Teacher: ${class11A.classTeacher?.name} ${class11A.classTeacher?.surname}`);

    // Generate attendance for 3 months (August to November 2025)
    const startDate = new Date("2025-08-01");
    const endDate = new Date("2025-11-19"); // Today

    console.log(`📅 Generating attendance from ${startDate.toDateString()} to ${endDate.toDateString()}`);

    // Get all school days (Monday to Friday)
    const schoolDays: Date[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay();
      // 1 = Monday, 2 = Tuesday, 3 = Wednesday, 4 = Thursday, 5 = Friday
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        schoolDays.push(new Date(currentDate));
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    console.log(`📊 Total school days to generate: ${schoolDays.length}`);

    let totalRecordsCreated = 0;
    let daysProcessed = 0;

    // Generate attendance for each school day
    for (const date of schoolDays) {
      daysProcessed++;
      console.log(`\n📅 Processing day ${daysProcessed}/${schoolDays.length}: ${date.toDateString()}`);

      // Normalize date to midnight
      const attendanceDate = new Date(date);
      attendanceDate.setHours(0, 0, 0, 0);

      // Check if attendance already exists for this day
      const existingAttendance = await prisma.attendance.findFirst({
        where: {
          classId: class11A.id,
          date: attendanceDate,
        },
      });

      if (existingAttendance) {
        console.log(`⏭️  Attendance already exists for ${date.toDateString()}, skipping...`);
        continue;
      }

      // Generate attendance for each student
      const attendanceRecords = [];

      for (const student of class11A.students) {
        // Random attendance pattern:
        // 85% chance of being present
        // 10% chance of being absent
        // 5% chance of being late
        const random = Math.random();
        let status: "PRESENT" | "ABSENT" | "LATE";
        let present: boolean;

        if (random < 0.85) {
          status = "PRESENT";
          present = true;
        } else if (random < 0.95) {
          status = "ABSENT";
          present = false;
        } else {
          status = "LATE";
          present = true; // Late still counts as present
        }

        // Random notes for absent/late students
        let notes: string | null = null;
        if (status === "ABSENT") {
          const absentReasons = [
            "Sick",
            "Medical appointment",
            "Family emergency",
            "Not feeling well",
            null, // Sometimes no reason
          ];
          notes = absentReasons[Math.floor(Math.random() * absentReasons.length)];
        } else if (status === "LATE") {
          const lateReasons = [
            "Transport delay",
            "Traffic",
            "Overslept",
            null, // Sometimes no reason
          ];
          notes = lateReasons[Math.floor(Math.random() * lateReasons.length)];
        }

        attendanceRecords.push({
          studentId: student.id,
          classId: class11A.id,
          teacherId: class11A.classTeacherId!,
          date: attendanceDate,
          status,
          present,
          notes,
        });
      }

      // Batch create attendance records for this day
      try {
        await prisma.attendance.createMany({
          data: attendanceRecords,
          skipDuplicates: true,
        });

        const presentCount = attendanceRecords.filter((r) => r.status === "PRESENT").length;
        const absentCount = attendanceRecords.filter((r) => r.status === "ABSENT").length;
        const lateCount = attendanceRecords.filter((r) => r.status === "LATE").length;

        console.log(`✅ Created ${attendanceRecords.length} attendance records`);
        console.log(`   📊 Present: ${presentCount} | Absent: ${absentCount} | Late: ${lateCount}`);

        totalRecordsCreated += attendanceRecords.length;
      } catch (error) {
        console.error(`❌ Error creating attendance for ${date.toDateString()}:`, error);
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("🎉 Attendance data generation complete!");
    console.log("=".repeat(60));
    console.log(`📊 Summary:`);
    console.log(`   Class: ${class11A.name}`);
    console.log(`   Students: ${class11A.students.length}`);
    console.log(`   School days: ${schoolDays.length}`);
    console.log(`   Total attendance records created: ${totalRecordsCreated}`);
    console.log(`   Days processed: ${daysProcessed}`);
    console.log("=".repeat(60));

    // Calculate and display attendance statistics
    console.log("\n📈 Calculating attendance statistics...");

    const allAttendance = await prisma.attendance.findMany({
      where: {
        classId: class11A.id,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const totalRecords = allAttendance.length;
    const totalPresent = allAttendance.filter((r) => r.status === "PRESENT").length;
    const totalAbsent = allAttendance.filter((r) => r.status === "ABSENT").length;
    const totalLate = allAttendance.filter((r) => r.status === "LATE").length;

    const attendancePercentage = totalRecords > 0 
      ? ((totalPresent + totalLate * 0.5) / totalRecords * 100).toFixed(2)
      : 0;

    console.log(`\n📊 Overall Attendance Statistics (Aug - Nov 2025):`);
    console.log(`   Total records: ${totalRecords}`);
    console.log(`   Present: ${totalPresent} (${((totalPresent / totalRecords) * 100).toFixed(1)}%)`);
    console.log(`   Absent: ${totalAbsent} (${((totalAbsent / totalRecords) * 100).toFixed(1)}%)`);
    console.log(`   Late: ${totalLate} (${((totalLate / totalRecords) * 100).toFixed(1)}%)`);
    console.log(`   Overall Attendance: ${attendancePercentage}%`);

    // Display per-student statistics
    console.log(`\n👥 Per-Student Attendance Summary (Top 5):`);
    
    const studentStats = class11A.students.slice(0, 5).map((student) => {
      const studentRecords = allAttendance.filter((r) => r.studentId === student.id);
      const present = studentRecords.filter((r) => r.status === "PRESENT").length;
      const absent = studentRecords.filter((r) => r.status === "ABSENT").length;
      const late = studentRecords.filter((r) => r.status === "LATE").length;
      const total = studentRecords.length;
      const percentage = total > 0 ? ((present + late * 0.5) / total * 100).toFixed(1) : "0";

      return {
        name: `${student.name} ${student.surname}`,
        present,
        absent,
        late,
        total,
        percentage,
      };
    });

    studentStats.forEach((stat, index) => {
      console.log(`   ${index + 1}. ${stat.name}:`);
      console.log(`      Present: ${stat.present} | Absent: ${stat.absent} | Late: ${stat.late} | Total: ${stat.total} | Attendance: ${stat.percentage}%`);
    });

    console.log(`\n✅ You can now view attendance in the Teacher Attendance page!`);
    console.log(`📍 Navigate to: Teacher Dashboard → Attendance or Attendance Reports`);

  } catch (error) {
    console.error("❌ Error generating attendance data:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
addAttendanceData()
  .then(() => {
    console.log("\n✅ Script completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Script failed:", error);
    process.exit(1);
  });
