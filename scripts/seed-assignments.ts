import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Creating assignments for all subjects by their teachers...");

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

  console.log(`\nFound ${subjectTeacherMap.size} subject-teacher combinations`);

  // Assignment types for different subjects
  const assignmentTypes = [
    "Homework",
    "Class Work",
    "Past Paper Practice",
    "Project Work",
    "Essay",
    "Practical Work",
    "Revision Exercise",
    "Term Test Preparation"
  ];

  // Subject-specific assignment titles
  const assignmentTitles: { [key: string]: string[] } = {
    "Mathematics": [
      "Algebra - Quadratic Equations",
      "Geometry - Circle Theorems",
      "Trigonometry - Sin, Cos, Tan Problems",
      "Statistics - Mean, Median, Mode",
      "Number Systems - HCF and LCM",
      "Mensuration - Area and Volume",
      "Sets and Functions",
      "Graphs and Coordinates"
    ],
    "Science": [
      "Physics - Motion and Forces",
      "Chemistry - Atomic Structure",
      "Biology - Cell Structure",
      "Physics - Energy and Work",
      "Chemistry - Chemical Reactions",
      "Biology - Human Body Systems",
      "Physics - Electricity and Magnetism",
      "Environmental Science Project"
    ],
    "English": [
      "Essay Writing - My School Life",
      "Grammar - Tenses Practice",
      "Comprehension - Reading Passage Analysis",
      "Letter Writing - Formal Letter",
      "Vocabulary Building Exercise",
      "Creative Writing - Short Story",
      "Speech Preparation",
      "Literature - Poem Analysis"
    ],
    "Sinhala": [
      "කාව්‍ය විශ්ලේෂණය (Poem Analysis)",
      "රචනා ලිවීම (Essay Writing)",
      "ව්‍යාකරණ අභ්‍යාස (Grammar Practice)",
      "කෙටි කතා කියවීම (Short Story Reading)",
      "ලිපි ලිවීම (Letter Writing)",
      "වාචික කථාව (Oral Presentation)",
      "සාහිත්‍ය කෘති අධ්‍යයනය (Literature Study)",
      "වචන මාලාව (Vocabulary)"
    ],
    "History": [
      "Ancient Sri Lankan Civilization",
      "Anuradhapura Kingdom - Essay",
      "Polonnaruwa Period Study",
      "Kandyan Kingdom History",
      "Colonial Period in Sri Lanka",
      "Independence Movement",
      "Post-Independence Era",
      "Cultural Heritage of Sri Lanka"
    ],
    "Buddhism": [
      "Buddha's Life Story",
      "Five Precepts - Essay",
      "Noble Eightfold Path",
      "Four Noble Truths",
      "Buddhist Teachings on Ethics",
      "Meditation Practice Report",
      "Buddhist Culture in Sri Lanka",
      "Vesak Celebration - Project"
    ]
  };

  let totalAssignments = 0;

  // Create assignments for each subject-teacher combination
  for (const [key, data] of Array.from(subjectTeacherMap.entries())) {
    const { subject, teacher, lessons } = data;
    
    console.log(`\n📚 Creating assignments for ${subject.name} - ${teacher.name} ${teacher.surname}`);

    // Get assignment titles for this subject
    const titles = assignmentTitles[subject.name] || [
      `${subject.name} Assignment 1`,
      `${subject.name} Assignment 2`,
      `${subject.name} Assignment 3`,
      `${subject.name} Assignment 4`
    ];

    // Get unique classes for this teacher's subject
    const uniqueClasses = new Map<string, any>();
    lessons.forEach(lesson => {
      if (!uniqueClasses.has(lesson.classId)) {
        uniqueClasses.set(lesson.classId, lesson.class);
      }
    });

    console.log(`  Classes: ${Array.from(uniqueClasses.values()).map(c => c.name).join(", ")}`);

    // Create 4-6 assignments per class for this subject
    const numAssignments = Math.min(titles.length, 6);

    for (const classItem of Array.from(uniqueClasses.values())) {
      // Find a lesson for this class to link the assignment to
      const lessonForClass = lessons.find(l => l.classId === classItem.id);
      
      if (!lessonForClass) continue;

      for (let i = 0; i < numAssignments; i++) {
        const title = titles[i] || `${subject.name} Assignment ${i + 1}`;
        const type = assignmentTypes[i % assignmentTypes.length];
        
        // Create due dates spread over the term (next 2-3 months)
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + (i + 1) * 7); // Weekly assignments

        try {
          const assignment = await prisma.assignment.create({
            data: {
              title: title,
              startDate: new Date(), // All start today
              dueDate: dueDate,
              lessonId: lessonForClass.id,
            },
          });

          totalAssignments++;
          console.log(`    ✅ ${classItem.name}: ${title} (Due: ${dueDate.toLocaleDateString()})`);
        } catch (error) {
          console.log(`    ❌ Failed to create assignment for ${classItem.name}:`, error);
        }
      }
    }
  }

  console.log(`\n✨ Successfully created ${totalAssignments} assignments!`);
  console.log(`\n📊 Summary:`);
  console.log(`   - Subject-Teacher combinations: ${subjectTeacherMap.size}`);
  console.log(`   - Classes: ${classes.length}`);
  console.log(`   - Assignments per subject per class: 4-6`);
  console.log(`   - Total assignments created: ${totalAssignments}`);
  console.log(`\n📝 Assignment types included:`);
  assignmentTypes.forEach(type => console.log(`   - ${type}`));
}

main()
  .catch((e) => {
    console.error("❌ Error seeding assignments:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
