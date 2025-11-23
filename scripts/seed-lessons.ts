import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding lessons for all subjects...");

  // Get all teachers with their subjects
  const teachers = await prisma.teacher.findMany({
    include: {
      subjects: true,
    },
  });

  console.log(`Found ${teachers.length} teachers`);

  // Get all classes
  const classes = await prisma.class.findMany({
    orderBy: { name: "asc" },
  });

  console.log(`Found ${classes.length} classes`);

  // Define lesson schedule template
  const lessonSchedule = [
    { day: "MONDAY", startTime: new Date("1970-01-01T08:00:00"), endTime: new Date("1970-01-01T09:00:00") },
    { day: "MONDAY", startTime: new Date("1970-01-01T09:00:00"), endTime: new Date("1970-01-01T10:00:00") },
    { day: "TUESDAY", startTime: new Date("1970-01-01T08:00:00"), endTime: new Date("1970-01-01T09:00:00") },
    { day: "TUESDAY", startTime: new Date("1970-01-01T10:00:00"), endTime: new Date("1970-01-01T11:00:00") },
    { day: "WEDNESDAY", startTime: new Date("1970-01-01T08:00:00"), endTime: new Date("1970-01-01T09:00:00") },
    { day: "THURSDAY", startTime: new Date("1970-01-01T09:00:00"), endTime: new Date("1970-01-01T10:00:00") },
    { day: "FRIDAY", startTime: new Date("1970-01-01T08:00:00"), endTime: new Date("1970-01-01T09:00:00") },
  ];

  let lessonsCreated = 0;

  // For each teacher
  for (const teacher of teachers) {
    if (teacher.subjects.length === 0) {
      console.log(`⚠️  Teacher ${teacher.name} ${teacher.surname} has no subjects assigned`);
      continue;
    }

    console.log(`\n👨‍🏫 Creating lessons for ${teacher.name} ${teacher.surname}`);

    // For each subject the teacher teaches
    for (const subject of teacher.subjects) {
      console.log(`  📚 Subject: ${subject.name}`);

      // For each class
      for (let i = 0; i < classes.length; i++) {
        const classItem = classes[i];
        
        // Use different schedule slots for different classes to avoid conflicts
        const scheduleIndex = i % lessonSchedule.length;
        const schedule = lessonSchedule[scheduleIndex];

        try {
          const lesson = await prisma.lesson.create({
            data: {
              name: `${subject.name} - ${classItem.name}`,
              day: schedule.day,
              startTime: schedule.startTime,
              endTime: schedule.endTime,
              subjectId: subject.id,
              classId: classItem.id,
              teacherId: teacher.id,
            },
          });

          lessonsCreated++;
          console.log(`    ✅ Created: ${lesson.name} on ${schedule.day} ${schedule.startTime.toTimeString().slice(0, 5)}-${schedule.endTime.toTimeString().slice(0, 5)}`);
        } catch (error) {
          console.log(`    ❌ Failed to create lesson for ${subject.name} - ${classItem.name}:`, error);
        }
      }
    }
  }

  console.log(`\n✅ Successfully created ${lessonsCreated} lessons!`);
}

main()
  .catch((e) => {
    console.error("❌ Error seeding lessons:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
