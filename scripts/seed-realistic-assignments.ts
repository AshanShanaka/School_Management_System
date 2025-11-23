import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Creating realistic subject-specific assignments...");

  // Delete existing assignments first
  await prisma.assignment.deleteMany({});
  console.log("✅ Cleared existing assignments");

  // Get all lessons with their subjects, teachers, and classes
  const lessons = await prisma.lesson.findMany({
    include: {
      subject: true,
      teacher: true,
      class: true,
    },
    orderBy: [
      { subject: { name: "asc" } },
      { class: { name: "asc" } }
    ]
  });

  console.log(`\nFound ${lessons.length} lessons in the system`);

  // Group lessons by subject and teacher
  const subjectTeacherMap = new Map<string, { subject: any, teacher: any, lessons: any[] }>();

  for (const lesson of lessons) {
    const key = `${lesson.subject.name}-${lesson.teacherId}`;
    if (!subjectTeacherMap.has(key)) {
      subjectTeacherMap.set(key, {
        subject: lesson.subject,
        teacher: lesson.teacher,
        lessons: []
      });
    }
    subjectTeacherMap.get(key)!.lessons.push(lesson);
  }

  // Realistic assignment titles (without "Assignment" word)
  const assignmentTitles: { [key: string]: string[] } = {
    "Mathematics": [
      "Quadratic Equations Practice",
      "Circle Theorems Worksheet",
      "Trigonometry Problems",
      "Statistical Analysis",
      "HCF and LCM Problems",
      "Area and Volume Calculations",
      "Sets Theory Exercise",
      "Coordinate Geometry"
    ],
    "Science": [
      "Motion and Forces Lab Report",
      "Atomic Structure Diagram",
      "Cell Biology Observation",
      "Energy Conservation Study",
      "Chemical Equations Balancing",
      "Human Body Systems Chart",
      "Electricity Experiment",
      "Environmental Project"
    ],
    "English": [
      "Essay: My Future Dreams",
      "Tenses Grammar Exercise",
      "Reading Passage Analysis",
      "Formal Letter Writing",
      "Vocabulary Builder",
      "Creative Story Writing",
      "Speech Preparation",
      "Poem Interpretation"
    ],
    "Sinhala": [
      "කාව්‍ය විශ්ලේෂණය",
      "රචනාව: මගේ පාසල",
      "ව්‍යාකරණ අභ්‍යාසය",
      "කෙටි කතාව",
      "විධිමත් ලිපිය",
      "වාචික කථාව",
      "සාහිත්‍ය අධ්‍යයනය",
      "වචන කෝෂය"
    ],
    "History": [
      "Anuradhapura Kingdom Essay",
      "Polonnaruwa Period Study",
      "Kandyan Kingdom Research",
      "Colonial Era Analysis",
      "Independence Movement",
      "Ancient Civilization Report",
      "Cultural Heritage Project",
      "Historical Timeline"
    ],
    "Buddhism": [
      "Buddha's Life Story",
      "Five Precepts Essay",
      "Noble Eightfold Path",
      "Four Noble Truths",
      "Buddhist Ethics Study",
      "Meditation Practice Report",
      "Dhamma Discussion",
      "Buddhist Culture Project"
    ]
  };

  let totalAssignments = 0;

  // Create assignments for each subject-teacher combination
  for (const [key, data] of Array.from(subjectTeacherMap.entries())) {
    const { subject, teacher, lessons } = data;
    
    console.log(`\n📚 ${subject.name} - ${teacher.name} ${teacher.surname}`);

    // Get assignment titles for this subject
    const titles = assignmentTitles[subject.name] || [
      `${subject.name} Exercise 1`,
      `${subject.name} Exercise 2`,
      `${subject.name} Exercise 3`,
      `${subject.name} Exercise 4`
    ];

    // Get unique classes
    const uniqueClasses = new Map<string, any>();
    lessons.forEach(lesson => {
      if (!uniqueClasses.has(lesson.classId)) {
        uniqueClasses.set(lesson.classId, lesson.class);
      }
    });

    console.log(`  Classes: ${Array.from(uniqueClasses.values()).map(c => c.name).join(", ")}`);

    // Create 6-8 assignments per class
    const numAssignments = Math.min(titles.length, 8);

    for (const classItem of Array.from(uniqueClasses.values())) {
      const lessonForClass = lessons.find(l => l.classId === classItem.id);
      
      if (!lessonForClass) continue;

      for (let i = 0; i < numAssignments; i++) {
        const title = titles[i];
        
        // Create due dates spread over 8 weeks
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + (i + 1) * 7);

        try {
          await prisma.assignment.create({
            data: {
              title: title, // Just the topic/exercise name
              startDate: new Date(),
              dueDate: dueDate,
              lessonId: lessonForClass.id,
            },
          });

          totalAssignments++;
          console.log(`    ✅ ${classItem.name}: ${title}`);
        } catch (error) {
          console.log(`    ❌ Failed:`, error);
        }
      }
    }
  }

  console.log(`\n✨ Successfully created ${totalAssignments} realistic assignments!`);
  console.log(`\n📊 Summary:`);
  console.log(`   - Each assignment shows topic name only`);
  console.log(`   - No "Assignment" prefix`);
  console.log(`   - Subject-specific realistic titles`);
  console.log(`   - Total: ${totalAssignments} assignments`);
}

main()
  .catch((e) => {
    console.error("❌ Error seeding assignments:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
