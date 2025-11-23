import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function reassignClassTeachers() {
  try {
    console.log("🔄 Reassigning all class teachers...\n");

    // First, get all teachers and classes
    const teachers = await prisma.teacher.findMany({
      select: {
        id: true,
        username: true,
        name: true,
        surname: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    const classes = await prisma.class.findMany({
      include: {
        grade: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    console.log("📋 Available Teachers:");
    teachers.forEach((t, idx) => {
      console.log(`   ${idx + 1}. ${t.name} ${t.surname} (${t.username})`);
    });

    console.log("\n📚 Available Classes:");
    classes.forEach((c, idx) => {
      console.log(`   ${idx + 1}. ${c.name} - Grade ${c.grade.level}`);
    });

    console.log("\n");
    console.log("=" .repeat(60));
    console.log("Setting up class teacher assignments...");
    console.log("=" .repeat(60));
    console.log("");

    // Define the correct assignments
    // You can modify this array based on your requirements
    const assignments = [
      {
        className: "11-A",
        teacherUsername: "raviperera",
        teacherName: "Ravi Perera",
      },
      {
        className: "11-B",
        teacherUsername: "kamalasenanayak",
        teacherName: "Kamala Senanayake",
      },
      {
        className: "11-C",
        teacherUsername: "sureshbandara",
        teacherName: "Suresh Bandara",
      },
      {
        className: "11-D",
        teacherUsername: "nirmalajayaward",
        teacherName: "Nirmala Jayawardena",
      },
    ];

    let successCount = 0;
    let errorCount = 0;

    for (const assignment of assignments) {
      try {
        // Find the teacher
        const teacher = await prisma.teacher.findUnique({
          where: { username: assignment.teacherUsername },
        });

        if (!teacher) {
          console.log(`❌ Teacher not found: ${assignment.teacherName} (${assignment.teacherUsername})`);
          errorCount++;
          continue;
        }

        // Find the class
        const classRecord = await prisma.class.findFirst({
          where: { name: assignment.className },
          include: { grade: true },
        });

        if (!classRecord) {
          console.log(`❌ Class not found: ${assignment.className}`);
          errorCount++;
          continue;
        }

        console.log(`🔧 Assigning: ${assignment.teacherName} -> ${assignment.className}`);

        // First, clear any existing assignments for this class
        await prisma.teacher.updateMany({
          where: {
            assignedClassId: classRecord.id,
          },
          data: {
            assignedClassId: null,
          },
        });

        // Clear any existing assignment for this teacher
        await prisma.class.updateMany({
          where: {
            classTeacherId: teacher.id,
          },
          data: {
            classTeacherId: null,
          },
        });

        // Update the class to point to the teacher
        await prisma.class.update({
          where: { id: classRecord.id },
          data: {
            classTeacherId: teacher.id,
          },
        });

        // Update the teacher to point to the class (bidirectional)
        await prisma.teacher.update({
          where: { id: teacher.id },
          data: {
            assignedClassId: classRecord.id,
          },
        });

        console.log(`   ✅ Success: ${teacher.name} ${teacher.surname} is now class teacher of ${classRecord.name} (Grade ${classRecord.grade.level})`);
        successCount++;
      } catch (error) {
        console.log(`   ❌ Error assigning ${assignment.teacherName}: ${error}`);
        errorCount++;
      }
      console.log("");
    }

    console.log("\n" + "=".repeat(60));
    console.log(`📊 Summary:`);
    console.log(`   ✅ Successful assignments: ${successCount}`);
    console.log(`   ❌ Failed assignments: ${errorCount}`);
    console.log("=".repeat(60));

    // Verify the assignments
    console.log("\n🔍 Verifying assignments...\n");

    const verifyClasses = await prisma.class.findMany({
      where: {
        classTeacherId: {
          not: null,
        },
      },
      include: {
        classTeacher: true,
        grade: true,
        _count: {
          select: {
            students: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    console.log("✅ Current Class Teacher Assignments:\n");
    verifyClasses.forEach((cls) => {
      if (cls.classTeacher) {
        console.log(
          `   📖 ${cls.name} (Grade ${cls.grade.level}) - ${cls._count.students} students`
        );
        console.log(
          `      👤 ${cls.classTeacher.name} ${cls.classTeacher.surname} (${cls.classTeacher.username})`
        );
        console.log("");
      }
    });

    console.log("\n💡 Teachers can now login with these usernames:");
    verifyClasses.forEach((cls) => {
      if (cls.classTeacher) {
        console.log(`   • ${cls.classTeacher.username} - Class ${cls.name}`);
      }
    });

    console.log("\n✨ All done!");
  } catch (error) {
    console.error("❌ Fatal error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

reassignClassTeachers();
