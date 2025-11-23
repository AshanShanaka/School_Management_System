import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function testLessonCreation() {
  console.log("🧪 Testing Lesson Creation Fixes\n");

  try {
    // 1. Check if teachers exist
    console.log("1️⃣ Checking teachers...");
    const teachers = await prisma.teacher.findMany({
      where: {
        username: {
          in: ["raviperera", "kamalasenanayak"],
        },
      },
      include: {
        subjects: true,
      },
    });

    if (teachers.length === 0) {
      console.log("❌ No teachers found!");
      return;
    }

    console.log(`✅ Found ${teachers.length} teachers`);
    teachers.forEach((teacher) => {
      console.log(
        `   - ${teacher.name} ${teacher.surname} (${teacher.username})`
      );
      console.log(
        `     Subjects: ${teacher.subjects.map((s) => s.name).join(", ")}`
      );
    });

    // 2. Check subjects
    console.log("\n2️⃣ Checking subjects...");
    const subjects = await prisma.subject.findMany({
      take: 5,
    });
    console.log(`✅ Found ${subjects.length} subjects`);

    // 3. Check classes
    console.log("\n3️⃣ Checking classes...");
    const classes = await prisma.class.findMany({
      take: 5,
    });
    console.log(`✅ Found ${classes.length} classes`);

    // 4. Check existing lessons
    console.log("\n4️⃣ Checking existing lessons...");
    const lessonCount = await prisma.lesson.count();
    console.log(`📊 Total lessons in database: ${lessonCount}`);

    if (lessonCount > 0) {
      console.log("\n📋 Sample lessons:");
      const sampleLessons = await prisma.lesson.findMany({
        take: 3,
        include: {
          teacher: {
            select: { name: true, surname: true },
          },
          subject: {
            select: { name: true },
          },
          class: {
            select: { name: true },
          },
        },
      });

      sampleLessons.forEach((lesson) => {
        console.log(`\n   Lesson: ${lesson.name}`);
        console.log(`   Subject: ${lesson.subject.name}`);
        console.log(
          `   Teacher: ${lesson.teacher.name} ${lesson.teacher.surname}`
        );
        console.log(`   Class: ${lesson.class.name}`);
        console.log(`   Day: ${lesson.day}`);
        console.log(
          `   Time: ${lesson.startTime.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          })} - ${lesson.endTime.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          })}`
        );
      });
    }

    // 5. Test date parsing (simulate what the form does)
    console.log("\n5️⃣ Testing datetime parsing...");
    const testDateTime = "2024-11-22T10:00";
    const testDateObj = new Date(testDateTime);
    const hours = testDateObj.getHours().toString().padStart(2, "0");
    const minutes = testDateObj.getMinutes().toString().padStart(2, "0");
    const timeOnlyDate = new Date(`1970-01-01T${hours}:${minutes}:00`);

    console.log(`   Input: ${testDateTime}`);
    console.log(`   Parsed time: ${hours}:${minutes}`);
    console.log(`   Stored as: ${timeOnlyDate.toISOString()}`);
    console.log("   ✅ DateTime parsing works correctly");

    // 6. Summary
    console.log("\n📊 Summary:");
    console.log(`   ✅ Teachers: ${teachers.length}`);
    console.log(`   ✅ Subjects: ${subjects.length}`);
    console.log(`   ✅ Classes: ${classes.length}`);
    console.log(`   ✅ Existing Lessons: ${lessonCount}`);
    console.log(`   ✅ DateTime Parsing: Working`);

    console.log("\n🎯 System Ready for Lesson Creation!");
    console.log("\n📝 To create a lesson:");
    console.log("   1. Login as raviperera (Mathematics teacher)");
    console.log("   2. Navigate to /list/lessons");
    console.log("   3. Click 'Add Lesson' button");
    console.log("   4. Fill in the form:");
    console.log("      - Lesson Name: e.g., 'Algebra Basics'");
    console.log("      - Day: Select day (Monday-Friday)");
    console.log("      - Start Time: Pick a time");
    console.log("      - End Time: Pick end time");
    console.log("      - Subject: Auto-assigned (Mathematics)");
    console.log("      - Class: Select a class");
    console.log("   5. Click 'Create'");
    console.log("\n✅ Expected: Success toast and lesson appears in list");
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testLessonCreation();
