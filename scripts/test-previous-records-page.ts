import prisma from "@/lib/prisma";

async function testPreviousRecordsPage() {
  try {
    console.log("🧪 Testing Previous Records Page Setup\n");

    // Test 1: Check if Ravi Perera exists
    const ravi = await prisma.teacher.findFirst({
      where: {
        name: "Ravi",
        surname: "Perera",
      },
      include: {
        classes: {
          include: {
            grade: true,
            students: {
              select: {
                id: true,
                name: true,
                surname: true,
              },
            },
          },
        },
      },
    });

    if (!ravi) {
      console.log("❌ Ravi Perera not found");
      return;
    }

    console.log("✅ Teacher Found:");
    console.log(`   Name: ${ravi.name} ${ravi.surname}`);
    console.log(`   ID: ${ravi.id}`);
    console.log(`   Username: ${ravi.username}`);

    // Test 2: Check assigned classes
    if (!ravi.classes || ravi.classes.length === 0) {
      console.log("❌ No classes assigned to Ravi Perera");
      return;
    }

    console.log(`\n✅ Assigned Classes: ${ravi.classes.length}`);
    ravi.classes.forEach((cls) => {
      console.log(`\n   Class: ${cls.name}`);
      console.log(`   Grade: ${cls.grade?.level}`);
      console.log(`   Students: ${cls.students.length}`);
      console.log(`   Class ID: ${cls.id}`);
    });

    // Test 3: Check for historical marks
    const firstClass = ravi.classes[0];
    const historicalMarks = await prisma.historicalMark.findMany({
      where: {
        student: {
          classId: firstClass.id,
        },
        grade: {
          in: [9, 10], // Only Grade 9 & 10
        },
      },
      include: {
        student: {
          select: {
            name: true,
            surname: true,
          },
        },
        subject: {
          select: {
            name: true,
          },
        },
      },
      take: 5,
    });

    console.log(`\n📊 Historical Marks (Grade 9 & 10):`);
    console.log(`   Total records found: ${historicalMarks.length}`);

    if (historicalMarks.length > 0) {
      console.log("\n   Sample records:");
      historicalMarks.forEach((mark) => {
        console.log(
          `   - ${mark.student.name} ${mark.student.surname}: ${mark.subject.name} Grade ${mark.grade} = ${mark.mark}`
        );
      });
    } else {
      console.log("   ⚠️ No historical marks found for this class");
      console.log("   💡 Use the 'Import Historical Marks' feature to add data");
    }

    // Test 4: Simulate API response format
    console.log("\n🔍 Expected API Response Format:");
    const apiResponse = {
      class: {
        id: firstClass.id,
        name: firstClass.name,
        gradeId: firstClass.gradeId,
        grade: firstClass.grade,
        studentCount: firstClass.students.length,
        students: firstClass.students,
      },
    };
    console.log(JSON.stringify(apiResponse, null, 2));

    console.log("\n✅ Previous Records Page Test Complete!");
    console.log(
      `\n📝 Next steps:\n   1. Login as Ravi Perera (username: ${ravi.username})`
    );
    console.log("   2. Navigate to /teacher/previous-records");
    console.log(`   3. You should see Class ${firstClass.name} with ${firstClass.students.length} students`);
    console.log("   4. Click 'View Records' to see historical marks");
  } catch (error) {
    console.error("❌ Error during test:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testPreviousRecordsPage();
