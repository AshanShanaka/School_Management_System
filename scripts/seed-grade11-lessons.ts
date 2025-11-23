import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Creating realistic Grade 11 lesson schedule...");

  // First, delete existing lessons
  await prisma.lesson.deleteMany({});
  console.log("✅ Cleared existing lessons");

  // Get all Grade 11 classes
  const classes = await prisma.class.findMany({
    where: {
      name: {
        startsWith: "11"
      }
    },
    orderBy: { name: "asc" },
  });

  console.log(`Found ${classes.length} Grade 11 classes:`, classes.map(c => c.name).join(", "));

  // Get all subjects and their teachers
  const subjects = await prisma.subject.findMany({
    include: {
      teachers: true,
    },
  });

  console.log(`\nFound ${subjects.length} subjects:`, subjects.map(s => s.name).join(", "));

  // Define a realistic weekly schedule (5 periods per day, 5 days)
  const weeklySchedule = [
    // Monday
    { day: "MONDAY", period: 1, startTime: "08:00", endTime: "08:40" },
    { day: "MONDAY", period: 2, startTime: "08:40", endTime: "09:20" },
    { day: "MONDAY", period: 3, startTime: "09:20", endTime: "10:00" },
    { day: "MONDAY", period: 4, startTime: "10:20", endTime: "11:00" }, // 20min break
    { day: "MONDAY", period: 5, startTime: "11:00", endTime: "11:40" },
    { day: "MONDAY", period: 6, startTime: "11:40", endTime: "12:20" },
    { day: "MONDAY", period: 7, startTime: "12:20", endTime: "13:00" },
    { day: "MONDAY", period: 8, startTime: "13:45", endTime: "14:25" }, // lunch break
    
    // Tuesday
    { day: "TUESDAY", period: 1, startTime: "08:00", endTime: "08:40" },
    { day: "TUESDAY", period: 2, startTime: "08:40", endTime: "09:20" },
    { day: "TUESDAY", period: 3, startTime: "09:20", endTime: "10:00" },
    { day: "TUESDAY", period: 4, startTime: "10:20", endTime: "11:00" },
    { day: "TUESDAY", period: 5, startTime: "11:00", endTime: "11:40" },
    { day: "TUESDAY", period: 6, startTime: "11:40", endTime: "12:20" },
    { day: "TUESDAY", period: 7, startTime: "12:20", endTime: "13:00" },
    { day: "TUESDAY", period: 8, startTime: "13:45", endTime: "14:25" },
    
    // Wednesday
    { day: "WEDNESDAY", period: 1, startTime: "08:00", endTime: "08:40" },
    { day: "WEDNESDAY", period: 2, startTime: "08:40", endTime: "09:20" },
    { day: "WEDNESDAY", period: 3, startTime: "09:20", endTime: "10:00" },
    { day: "WEDNESDAY", period: 4, startTime: "10:20", endTime: "11:00" },
    { day: "WEDNESDAY", period: 5, startTime: "11:00", endTime: "11:40" },
    { day: "WEDNESDAY", period: 6, startTime: "11:40", endTime: "12:20" },
    { day: "WEDNESDAY", period: 7, startTime: "12:20", endTime: "13:00" },
    { day: "WEDNESDAY", period: 8, startTime: "13:45", endTime: "14:25" },
    
    // Thursday
    { day: "THURSDAY", period: 1, startTime: "08:00", endTime: "08:40" },
    { day: "THURSDAY", period: 2, startTime: "08:40", endTime: "09:20" },
    { day: "THURSDAY", period: 3, startTime: "09:20", endTime: "10:00" },
    { day: "THURSDAY", period: 4, startTime: "10:20", endTime: "11:00" },
    { day: "THURSDAY", period: 5, startTime: "11:00", endTime: "11:40" },
    { day: "THURSDAY", period: 6, startTime: "11:40", endTime: "12:20" },
    { day: "THURSDAY", period: 7, startTime: "12:20", endTime: "13:00" },
    { day: "THURSDAY", period: 8, startTime: "13:45", endTime: "14:25" },
    
    // Friday
    { day: "FRIDAY", period: 1, startTime: "08:00", endTime: "08:40" },
    { day: "FRIDAY", period: 2, startTime: "08:40", endTime: "09:20" },
    { day: "FRIDAY", period: 3, startTime: "09:20", endTime: "10:00" },
    { day: "FRIDAY", period: 4, startTime: "10:20", endTime: "11:00" },
    { day: "FRIDAY", period: 5, startTime: "11:00", endTime: "11:40" },
    { day: "FRIDAY", period: 6, startTime: "11:40", endTime: "12:20" },
    { day: "FRIDAY", period: 7, startTime: "12:20", endTime: "13:00" },
    { day: "FRIDAY", period: 8, startTime: "13:45", endTime: "14:25" },
  ];

  // Subject allocation for Grade 11 (periods per week)
  const subjectAllocation: { [key: string]: number } = {
    "Mathematics": 8,      // Core subject - more periods
    "Science": 8,          // Core subject - more periods
    "English": 6,          // Language - important
    "Sinhala": 5,          // Language
    "History": 4,          // Social studies
    "Buddhism": 2,         // Religion/Ethics
  };

  let lessonsCreated = 0;
  let scheduleIndex = 0;

  // For each class
  for (const classItem of classes) {
    console.log(`\n📚 Creating schedule for ${classItem.name}`);
    scheduleIndex = 0; // Reset for each class

    // For each subject, allocate lessons based on periods
    for (const subject of subjects) {
      const periodsPerWeek = subjectAllocation[subject.name] || 0;
      
      if (periodsPerWeek === 0) {
        console.log(`  ⚠️  Skipping ${subject.name} (not in Grade 11 curriculum)`);
        continue;
      }

      // Get a teacher for this subject
      const teacher = subject.teachers[0];
      if (!teacher) {
        console.log(`  ⚠️  No teacher found for ${subject.name}`);
        continue;
      }

      console.log(`  📖 ${subject.name} (${periodsPerWeek} periods/week) - Teacher: ${teacher.name} ${teacher.surname}`);

      // Create lessons for this subject
      for (let i = 0; i < periodsPerWeek; i++) {
        if (scheduleIndex >= weeklySchedule.length) {
          console.log(`    ⚠️  No more time slots available`);
          break;
        }

        const slot = weeklySchedule[scheduleIndex];
        scheduleIndex++;

        try {
          const lesson = await prisma.lesson.create({
            data: {
              name: `${subject.name} - Period ${slot.period}`,
              day: slot.day,
              startTime: new Date(`1970-01-01T${slot.startTime}:00`),
              endTime: new Date(`1970-01-01T${slot.endTime}:00`),
              subjectId: subject.id,
              classId: classItem.id,
              teacherId: teacher.id,
            },
          });

          lessonsCreated++;
          console.log(`    ✅ ${slot.day} Period ${slot.period} (${slot.startTime}-${slot.endTime})`);
        } catch (error) {
          console.log(`    ❌ Failed to create lesson:`, error);
        }
      }
    }
  }

  console.log(`\n✨ Successfully created ${lessonsCreated} lessons for Grade 11!`);
  console.log(`\n📊 Summary:`);
  console.log(`   - Classes: ${classes.length}`);
  console.log(`   - Subjects per class: ${Object.keys(subjectAllocation).length}`);
  console.log(`   - Total periods per week per class: ${Object.values(subjectAllocation).reduce((a, b) => a + b, 0)}`);
  console.log(`   - Total lessons created: ${lessonsCreated}`);
}

main()
  .catch((e) => {
    console.error("❌ Error seeding lessons:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
