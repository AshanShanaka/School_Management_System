import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkTeacherSubjects() {
  try {
    console.log("🔍 Checking teacher-subject assignments...\n");

    // Get all teachers with their assigned subjects
    const teachers = await prisma.teacher.findMany({
      include: {
        subjects: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        lessons: {
          include: {
            subject: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
            class: {
              select: {
                name: true,
              },
            },
          },
        },
        assignedClass: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    console.log("=" .repeat(70));
    console.log("📋 TEACHER-SUBJECT ASSIGNMENTS");
    console.log("=" .repeat(70));
    console.log("");

    let teachersWithSubjects = 0;
    let teachersWithoutSubjects = 0;

    for (const teacher of teachers) {
      console.log(`👤 ${teacher.name} ${teacher.surname} (${teacher.username})`);
      console.log(`   Email: ${teacher.email || "N/A"}`);
      console.log(`   Class Teacher: ${teacher.assignedClass?.name || "None"}`);
      
      if (teacher.subjects.length > 0) {
        console.log(`   ✅ Assigned Subjects (${teacher.subjects.length}):`);
        teacher.subjects.forEach(subject => {
          console.log(`      • ${subject.name} (${subject.code})`);
        });
        teachersWithSubjects++;
      } else {
        console.log(`   ❌ No subjects assigned`);
        teachersWithoutSubjects++;
      }

      if (teacher.lessons.length > 0) {
        console.log(`   📚 Teaching Lessons (${teacher.lessons.length}):`);
        const lessonSubjects = new Map();
        teacher.lessons.forEach(lesson => {
          const subjectKey = `${lesson.subject.name} (${lesson.subject.code})`;
          if (!lessonSubjects.has(subjectKey)) {
            lessonSubjects.set(subjectKey, []);
          }
          lessonSubjects.get(subjectKey)!.push(lesson.class.name);
        });

        lessonSubjects.forEach((classes, subject) => {
          console.log(`      • ${subject} → ${classes.join(", ")}`);
        });
      }

      console.log("");
    }

    console.log("=" .repeat(70));
    console.log("📊 SUMMARY");
    console.log("=" .repeat(70));
    console.log(`Total Teachers: ${teachers.length}`);
    console.log(`✅ With Subject Assignments: ${teachersWithSubjects}`);
    console.log(`❌ Without Subject Assignments: ${teachersWithoutSubjects}`);
    console.log("");

    // Check all subjects and their assigned teachers
    console.log("=" .repeat(70));
    console.log("📚 ALL SUBJECTS");
    console.log("=" .repeat(70));
    console.log("");

    const subjects = await prisma.subject.findMany({
      include: {
        teachers: {
          select: {
            id: true,
            name: true,
            surname: true,
            username: true,
          },
        },
        _count: {
          select: {
            lessons: true,
            teachers: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    for (const subject of subjects) {
      console.log(`📖 ${subject.name} (${subject.code})`);
      console.log(`   Lessons: ${subject._count.lessons}`);
      if (subject.teachers.length > 0) {
        console.log(`   ✅ Assigned Teachers (${subject.teachers.length}):`);
        subject.teachers.forEach(teacher => {
          console.log(`      • ${teacher.name} ${teacher.surname} (${teacher.username})`);
        });
      } else {
        console.log(`   ❌ No teachers assigned`);
      }
      console.log("");
    }

    console.log("=" .repeat(70));
    console.log("💡 RECOMMENDATIONS");
    console.log("=" .repeat(70));
    console.log("");

    if (teachersWithoutSubjects > 0) {
      console.log("⚠️  Some teachers don't have subjects assigned!");
      console.log("   To assign subjects to teachers, you need to:");
      console.log("   1. Use the admin interface, OR");
      console.log("   2. Run a script to sync subjects from lessons");
      console.log("");
    }

    if (subjects.some(s => s.teachers.length === 0)) {
      console.log("⚠️  Some subjects don't have teachers assigned!");
      console.log("   These subjects won't appear in teacher marks entry.");
      console.log("");
    }

    console.log("✅ For marks entry to work:");
    console.log("   • Teachers must have subjects assigned (Teacher.subjects)");
    console.log("   • Exams must be in PUBLISHED/MARKS_ENTRY/CLASS_REVIEW status");
    console.log("   • ExamSubjects must be created for each exam-subject pair");
    console.log("");

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTeacherSubjects();
