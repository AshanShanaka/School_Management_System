import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Creating realistic GCE O/L lesson schedule for Sri Lankan school...");

  // First, delete existing lessons
  await prisma.lesson.deleteMany({});
  console.log("✅ Cleared existing lessons");

  // Get all Grade 11 classes (GCE O/L year)
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
  const allSubjects = await prisma.subject.findMany({
    include: {
      teachers: true,
    },
  });

  console.log(`\nFound ${allSubjects.length} subjects in database:`, allSubjects.map(s => s.name).join(", "));

  // Realistic GCE O/L Subject Allocation (periods per week)
  // Based on actual Sri Lankan O/L curriculum
  const olSubjectAllocation: { [key: string]: number } = {
    // Core subjects (compulsory for all students)
    "Mathematics": 7,        // Mathematics - Important core subject
    "Science": 7,            // Science - Important core subject
    "English": 6,            // First Language English
    "Sinhala": 6,            // Mother Tongue
    "History": 4,            // History of Sri Lanka
    "Buddhism": 3,           // Buddhism (or other religion)
    
    // These would typically be in the database but might not exist yet
    // "Geography": 3,
    // "ICT": 2,              // Information & Communication Technology
    // "Health & PE": 2,      // Health and Physical Education
    // "Art": 2,              // Aesthetic Studies
    // "Music": 2,
  };

  // Define realistic weekly schedule (Sri Lankan school timing)
  // Typically 7:30 AM - 1:30 PM with 8-9 periods per day
  const weeklySchedule = [
    // Monday
    { day: "MONDAY", period: 1, startTime: "07:30", endTime: "08:10" },
    { day: "MONDAY", period: 2, startTime: "08:10", endTime: "08:50" },
    { day: "MONDAY", period: 3, startTime: "08:50", endTime: "09:30" },
    { day: "MONDAY", period: 4, startTime: "09:30", endTime: "10:10" },
    { day: "MONDAY", period: 5, startTime: "10:30", endTime: "11:10" }, // 20min interval
    { day: "MONDAY", period: 6, startTime: "11:10", endTime: "11:50" },
    { day: "MONDAY", period: 7, startTime: "11:50", endTime: "12:30" },
    { day: "MONDAY", period: 8, startTime: "12:30", endTime: "13:10" },
    
    // Tuesday
    { day: "TUESDAY", period: 1, startTime: "07:30", endTime: "08:10" },
    { day: "TUESDAY", period: 2, startTime: "08:10", endTime: "08:50" },
    { day: "TUESDAY", period: 3, startTime: "08:50", endTime: "09:30" },
    { day: "TUESDAY", period: 4, startTime: "09:30", endTime: "10:10" },
    { day: "TUESDAY", period: 5, startTime: "10:30", endTime: "11:10" },
    { day: "TUESDAY", period: 6, startTime: "11:10", endTime: "11:50" },
    { day: "TUESDAY", period: 7, startTime: "11:50", endTime: "12:30" },
    { day: "TUESDAY", period: 8, startTime: "12:30", endTime: "13:10" },
    
    // Wednesday
    { day: "WEDNESDAY", period: 1, startTime: "07:30", endTime: "08:10" },
    { day: "WEDNESDAY", period: 2, startTime: "08:10", endTime: "08:50" },
    { day: "WEDNESDAY", period: 3, startTime: "08:50", endTime: "09:30" },
    { day: "WEDNESDAY", period: 4, startTime: "09:30", endTime: "10:10" },
    { day: "WEDNESDAY", period: 5, startTime: "10:30", endTime: "11:10" },
    { day: "WEDNESDAY", period: 6, startTime: "11:10", endTime: "11:50" },
    { day: "WEDNESDAY", period: 7, startTime: "11:50", endTime: "12:30" },
    { day: "WEDNESDAY", period: 8, startTime: "12:30", endTime: "13:10" },
    
    // Thursday
    { day: "THURSDAY", period: 1, startTime: "07:30", endTime: "08:10" },
    { day: "THURSDAY", period: 2, startTime: "08:10", endTime: "08:50" },
    { day: "THURSDAY", period: 3, startTime: "08:50", endTime: "09:30" },
    { day: "THURSDAY", period: 4, startTime: "09:30", endTime: "10:10" },
    { day: "THURSDAY", period: 5, startTime: "10:30", endTime: "11:10" },
    { day: "THURSDAY", period: 6, startTime: "11:10", endTime: "11:50" },
    { day: "THURSDAY", period: 7, startTime: "11:50", endTime: "12:30" },
    { day: "THURSDAY", period: 8, startTime: "12:30", endTime: "13:10" },
    
    // Friday
    { day: "FRIDAY", period: 1, startTime: "07:30", endTime: "08:10" },
    { day: "FRIDAY", period: 2, startTime: "08:10", endTime: "08:50" },
    { day: "FRIDAY", period: 3, startTime: "08:50", endTime: "09:30" },
    { day: "FRIDAY", period: 4, startTime: "09:30", endTime: "10:10" },
    { day: "FRIDAY", period: 5, startTime: "10:30", endTime: "11:10" },
    { day: "FRIDAY", period: 6, startTime: "11:10", endTime: "11:50" },
    { day: "FRIDAY", period: 7, startTime: "11:50", endTime: "12:30" },
    { day: "FRIDAY", period: 8, startTime: "12:30", endTime: "13:10" },
  ];

  let totalLessonsCreated = 0;

  // For each class
  for (const classItem of classes) {
    console.log(`\n📚 Creating GCE O/L schedule for ${classItem.name}`);
    
    let scheduleIndex = 0;
    let classLessonsCount = 0;

    // For each subject in O/L curriculum
    for (const [subjectName, periodsPerWeek] of Object.entries(olSubjectAllocation)) {
      // Find the subject in database
      const subject = allSubjects.find(s => s.name === subjectName);
      
      if (!subject) {
        console.log(`  ⚠️  Subject "${subjectName}" not found in database - skipping`);
        continue;
      }

      // Get a teacher for this subject
      const teacher = subject.teachers[0];
      if (!teacher) {
        console.log(`  ⚠️  No teacher assigned for ${subjectName} - skipping`);
        continue;
      }

      console.log(`  📖 ${subjectName} (${periodsPerWeek} periods/week) - ${teacher.name} ${teacher.surname}`);

      // Create lessons for this subject spread across the week
      for (let i = 0; i < periodsPerWeek; i++) {
        if (scheduleIndex >= weeklySchedule.length) {
          console.log(`    ⚠️  No more time slots available in the week`);
          break;
        }

        const slot = weeklySchedule[scheduleIndex];
        scheduleIndex++;

        try {
          const lesson = await prisma.lesson.create({
            data: {
              name: `${subjectName} - ${classItem.name}`,
              day: slot.day,
              startTime: new Date(`1970-01-01T${slot.startTime}:00`),
              endTime: new Date(`1970-01-01T${slot.endTime}:00`),
              subjectId: subject.id,
              classId: classItem.id,
              teacherId: teacher.id,
            },
          });

          classLessonsCount++;
          totalLessonsCreated++;
          console.log(`    ✅ ${slot.day} Period ${slot.period} (${slot.startTime}-${slot.endTime})`);
        } catch (error) {
          console.log(`    ❌ Failed to create lesson:`, error);
        }
      }
    }

    console.log(`  ✨ Total lessons for ${classItem.name}: ${classLessonsCount}`);
  }

  const totalPeriods = Object.values(olSubjectAllocation).reduce((a, b) => a + b, 0);

  console.log(`\n✨ Successfully created ${totalLessonsCreated} lessons for GCE O/L!`);
  console.log(`\n📊 GCE O/L Schedule Summary:`);
  console.log(`   - Classes: ${classes.length} (Grade 11 A, B, C, D)`);
  console.log(`   - Subjects: ${Object.keys(olSubjectAllocation).length} core O/L subjects`);
  console.log(`   - Periods per week per class: ${totalPeriods}`);
  console.log(`   - Total lessons created: ${totalLessonsCreated}`);
  console.log(`\n📚 Subject Breakdown:`);
  for (const [subject, periods] of Object.entries(olSubjectAllocation)) {
    console.log(`   - ${subject}: ${periods} periods/week`);
  }
  console.log(`\n⏰ School Hours: 7:30 AM - 1:10 PM (Sri Lankan standard)`);
  console.log(`   - 8 periods per day × 5 days = 40 periods per week`);
  console.log(`   - Used: ${totalPeriods} periods for O/L subjects`);
  console.log(`   - Remaining: ${40 - totalPeriods} periods (for other activities)`);
}

main()
  .catch((e) => {
    console.error("❌ Error seeding lessons:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
