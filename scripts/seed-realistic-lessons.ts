import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Creating realistic GCE O/L lessons with proper subject names...");

  // First, delete assignments (they reference lessons)
  await prisma.assignment.deleteMany({});
  console.log("✅ Cleared existing assignments");
  
  // Then delete existing lessons
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
  const allSubjects = await prisma.subject.findMany({
    include: {
      teachers: true,
    },
  });

  console.log(`\nFound ${allSubjects.length} subjects in database:`, allSubjects.map(s => s.name).join(", "));

  // Realistic lesson topics for each subject (GCE O/L curriculum)
  const lessonTopics: { [key: string]: string[] } = {
    "Mathematics": [
      "Algebra",
      "Geometry", 
      "Trigonometry",
      "Statistics",
      "Number Theory",
      "Mensuration",
      "Sets & Functions"
    ],
    "Science": [
      "Physics",
      "Chemistry",
      "Biology",
      "Physical Science",
      "Life Science",
      "Earth Science",
      "Practical Science"
    ],
    "English": [
      "Grammar",
      "Literature",
      "Writing Skills",
      "Reading Comprehension",
      "Vocabulary",
      "Spoken English"
    ],
    "Sinhala": [
      "සිංහල ව්‍යාකරණ",
      "සිංහල සාහිත්‍යය",
      "රචනා ලිවීම",
      "කවි විචාරය",
      "ප්‍රාථමික සිංහල",
      "භාෂා කරුණු"
    ],
    "History": [
      "Ancient History",
      "Medieval History",
      "Modern History",
      "Sri Lankan History",
      "World History",
      "Cultural History"
    ],
    "Buddhism": [
      "බුද්ධ චරිතය",
      "ධර්ම දේශනා",
      "සීල මාතෘකා",
      "භාවනා",
      "බෞද්ධ සංස්කෘතිය",
      "බෞද්ධ ඉතිහාසය"
    ]
  };

  // GCE O/L Subject Allocation (periods per week)
  const olSubjectAllocation: { [key: string]: number } = {
    "Mathematics": 7,
    "Science": 7,
    "English": 6,
    "Sinhala": 6,
    "History": 4,
    "Buddhism": 3,
  };

  // Weekly schedule (Sri Lankan school timing)
  const weeklySchedule = [
    // Monday
    { day: "MONDAY", period: 1, startTime: "07:30", endTime: "08:10" },
    { day: "MONDAY", period: 2, startTime: "08:10", endTime: "08:50" },
    { day: "MONDAY", period: 3, startTime: "08:50", endTime: "09:30" },
    { day: "MONDAY", period: 4, startTime: "09:30", endTime: "10:10" },
    { day: "MONDAY", period: 5, startTime: "10:30", endTime: "11:10" },
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
    console.log(`\n📚 Creating schedule for ${classItem.name}`);
    
    let scheduleIndex = 0;

    // For each subject in O/L curriculum
    for (const [subjectName, periodsPerWeek] of Object.entries(olSubjectAllocation)) {
      const subject = allSubjects.find(s => s.name === subjectName);
      
      if (!subject) {
        console.log(`  ⚠️  Subject "${subjectName}" not found - skipping`);
        continue;
      }

      const teacher = subject.teachers[0];
      if (!teacher) {
        console.log(`  ⚠️  No teacher for ${subjectName} - skipping`);
        continue;
      }

      console.log(`  📖 ${subjectName} (${periodsPerWeek} periods) - ${teacher.name} ${teacher.surname}`);

      const topics = lessonTopics[subjectName] || [subjectName];

      // Create lessons for this subject
      for (let i = 0; i < periodsPerWeek; i++) {
        if (scheduleIndex >= weeklySchedule.length) {
          console.log(`    ⚠️  No more time slots available`);
          break;
        }

        const slot = weeklySchedule[scheduleIndex];
        scheduleIndex++;

        // Use subject name or topic for lesson name (no "- Period" suffix)
        const lessonName = topics[i % topics.length];

        try {
          const lesson = await prisma.lesson.create({
            data: {
              name: lessonName, // Just the topic name
              day: slot.day,
              startTime: new Date(`1970-01-01T${slot.startTime}:00`),
              endTime: new Date(`1970-01-01T${slot.endTime}:00`),
              subjectId: subject.id,
              classId: classItem.id,
              teacherId: teacher.id,
            },
          });

          totalLessonsCreated++;
          console.log(`    ✅ ${slot.day} P${slot.period}: ${lessonName}`);
        } catch (error) {
          console.log(`    ❌ Failed to create lesson:`, error);
        }
      }
    }
  }

  console.log(`\n✨ Successfully created ${totalLessonsCreated} realistic lessons!`);
}

main()
  .catch((e) => {
    console.error("❌ Error seeding lessons:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
