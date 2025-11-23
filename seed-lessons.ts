import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting to create lessons for all subjects...");

  // Get all subjects with their teachers
  const subjects = await prisma.subject.findMany({
    include: {
      teachers: {
        include: {
          teacher: true,
        },
      },
    },
  });

  // Get all Grade 11 classes
  const classes = await prisma.class.findMany({
    where: {
      name: {
        contains: "11",
      },
    },
  });

  console.log(`Found ${subjects.length} subjects`);
  console.log(`Found ${classes.length} Grade 11 classes`);

  const days = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"];
  const timeSlots = [
    { start: "08:00", end: "09:00" },
    { start: "09:00", end: "10:00" },
    { start: "10:00", end: "11:00" },
    { start: "11:00", end: "12:00" },
    { start: "13:00", end: "14:00" },
    { start: "14:00", end: "15:00" },
  ];

  let lessonsCreated = 0;
  let dayIndex = 0;
  let timeIndex = 0;

  // Create lessons for each subject with each class
  for (const subject of subjects) {
    if (subject.teachers.length === 0) {
      console.log(`⚠️  No teacher assigned for ${subject.name}, skipping...`);
      continue;
    }

    const teacher = subject.teachers[0].teacher; // Get first teacher for this subject

    for (const classItem of classes) {
      const day = days[dayIndex % days.length];
      const timeSlot = timeSlots[timeIndex % timeSlots.length];

      // Create date objects for start and end times
      const startTime = new Date(`1970-01-01T${timeSlot.start}:00`);
      const endTime = new Date(`1970-01-01T${timeSlot.end}:00`);

      try {
        await prisma.lesson.create({
          data: {
            name: `${subject.name} - ${classItem.name}`,
            day: day,
            startTime: startTime,
            endTime: endTime,
            subjectId: subject.id,
            classId: classItem.id,
            teacherId: teacher.id,
          },
        });

        console.log(
          `✅ Created: ${subject.name} - ${classItem.name} (${teacher.name} on ${day} ${timeSlot.start}-${timeSlot.end})`
        );
        lessonsCreated++;

        // Move to next time slot
        timeIndex++;
        if (timeIndex % timeSlots.length === 0) {
          dayIndex++; // Move to next day after using all time slots
        }
      } catch (error: any) {
        console.log(
          `❌ Failed to create lesson for ${subject.name} - ${classItem.name}: ${error.message}`
        );
      }
    }
  }

  console.log(`\n✅ Successfully created ${lessonsCreated} lessons!`);
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
