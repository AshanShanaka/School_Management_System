import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkCurrentTeacher() {
  try {
    console.log("🔍 Checking all teachers and their class assignments...\n");

    const teachers = await prisma.teacher.findMany({
      select: {
        id: true,
        username: true,
        name: true,
        surname: true,
        email: true,
        assignedClassId: true,
        _count: {
          select: {
            classes: true, // Classes where they are class teacher
            lessons: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    console.log("📋 All Teachers:\n");
    for (const teacher of teachers) {
      console.log(`👤 ${teacher.name} ${teacher.surname}`);
      console.log(`   ID: ${teacher.id}`);
      console.log(`   Username: ${teacher.username}`);
      console.log(`   Email: ${teacher.email || "N/A"}`);
      console.log(`   Assigned Class ID: ${teacher.assignedClassId || "None"}`);
      console.log(`   Is Class Teacher for: ${teacher._count.classes} class(es)`);
      console.log(`   Teaches: ${teacher._count.lessons} lesson(s)`);

      // Check which class they're the class teacher for
      if (teacher._count.classes > 0) {
        const classesAsTeacher = await prisma.class.findMany({
          where: {
            classTeacherId: teacher.id,
          },
          include: {
            grade: true,
          },
        });

        classesAsTeacher.forEach((cls) => {
          console.log(`   ✅ Class Teacher: ${cls.name} (${cls.grade.level})`);
        });
      }
      console.log("");
    }

    // Check classes and their teachers
    console.log("\n📚 Classes and their teachers:\n");
    const classes = await prisma.class.findMany({
      include: {
        grade: true,
        classTeacher: {
          select: {
            id: true,
            name: true,
            surname: true,
            username: true,
          },
        },
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

    for (const cls of classes) {
      console.log(`📖 ${cls.name} (Grade ${cls.grade.level})`);
      console.log(`   Class ID: ${cls.id}`);
      console.log(`   Students: ${cls._count.students}`);
      if (cls.classTeacher) {
        console.log(
          `   Class Teacher: ${cls.classTeacher.name} ${cls.classTeacher.surname} (ID: ${cls.classTeacher.id}, username: ${cls.classTeacher.username})`
        );
      } else {
        console.log(`   Class Teacher: None assigned ❌`);
      }
      console.log("");
    }

    console.log("\n💡 To login as a class teacher, use one of these usernames:");
    const classTeachers = teachers.filter((t) => t._count.classes > 0);
    if (classTeachers.length > 0) {
      classTeachers.forEach((teacher) => {
        console.log(`   • Username: ${teacher.username} (${teacher.name} ${teacher.surname})`);
      });
    } else {
      console.log("   ⚠️ No class teachers found!");
    }
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCurrentTeacher();
