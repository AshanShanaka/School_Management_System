import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function syncClassTeachers() {
  try {
    console.log("🔄 Syncing bidirectional class teacher relationships...\n");

    // Get all classes with assigned teachers
    const classes = await prisma.class.findMany({
      where: {
        classTeacherId: {
          not: null,
        },
      },
      include: {
        classTeacher: true,
        grade: true,
      },
    });

    console.log(`📋 Found ${classes.length} classes with assigned teachers\n`);

    let fixedCount = 0;

    for (const classItem of classes) {
      const teacher = classItem.classTeacher;
      if (!teacher) continue;

      console.log(`Checking: ${teacher.name} ${teacher.surname} -> ${classItem.name}`);

      // Check if teacher's assignedClassId matches
      if (teacher.assignedClassId !== classItem.id) {
        console.log(`  ⚠️  Teacher.assignedClassId = ${teacher.assignedClassId}, but should be ${classItem.id}`);
        console.log(`  🔧 Fixing...`);

        await prisma.teacher.update({
          where: { id: teacher.id },
          data: { assignedClassId: classItem.id },
        });

        console.log(`  ✅ Fixed!`);
        fixedCount++;
      } else {
        console.log(`  ✓ Already correct`);
      }
      console.log("");
    }

    console.log("\n============================================================");
    console.log(`✨ Done! Fixed ${fixedCount} teacher assignment(s)`);
    console.log("============================================================\n");

    // Verify the fix
    console.log("🔍 Verification:\n");
    const verifyTeachers = await prisma.teacher.findMany({
      where: {
        assignedClassId: {
          not: null,
        },
      },
      include: {
        assignedClass: {
          include: {
            grade: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    for (const teacher of verifyTeachers) {
      if (teacher.assignedClass) {
        console.log(
          `✅ ${teacher.name} ${teacher.surname} (${teacher.username}) -> ${teacher.assignedClass.name} (Grade ${teacher.assignedClass.grade.level})`
        );
      }
    }

    console.log("\n✨ All class teacher assignments are now synchronized!");
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

syncClassTeachers();
