import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function testClassTeacherAPI() {
  try {
    // Test: Find Ravi Perera and his class assignment
    const teacher = await prisma.teacher.findUnique({
      where: { email: "ravi.perera@wkcc.lk" },
      include: {
        classes: {
          include: {
            grade: true,
            students: {
              select: {
                id: true,
                name: true,
                surname: true,
                username: true,
              },
            },
          },
        },
      },
    });

    if (!teacher) {
      console.log("❌ Teacher not found!");
      return;
    }

    console.log("\n✅ TEACHER FOUND:");
    console.log("Name:", `${teacher.name} ${teacher.surname}`);
    console.log("Email:", teacher.email);
    console.log("ID:", teacher.id);

    console.log("\n📚 CLASS ASSIGNMENTS:");
    if (!teacher.classes || teacher.classes.length === 0) {
      console.log("❌ NO CLASSES ASSIGNED");
      console.log("\n⚠️ THIS IS WHY THE ERROR APPEARS!");
      return;
    }

    teacher.classes.forEach((cls, index) => {
      console.log(`\n${index + 1}. ${cls.name}`);
      console.log(`   Grade: ${cls.grade.level}`);
      console.log(`   Students: ${cls.students.length}`);
      console.log(`   Class ID: ${cls.id}`);
    });

    console.log("\n🎯 API RESPONSE SIMULATION:");
    const apiResponse = {
      class: {
        id: teacher.classes[0].id,
        name: teacher.classes[0].name,
        gradeId: teacher.classes[0].gradeId,
        grade: teacher.classes[0].grade,
        studentCount: teacher.classes[0].students.length,
      },
    };
    console.log(JSON.stringify(apiResponse, null, 2));

    console.log("\n✅ Teacher SHOULD see their assigned class!");
    console.log("✅ Historical marks import SHOULD be accessible!");

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testClassTeacherAPI();
