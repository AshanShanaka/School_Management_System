import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkTeacherMarksEntry() {
  try {
    // Find Ravi Perera
    const teacher = await prisma.teacher.findFirst({
      where: {
        email: "ravi.perera@wkcc.lk",
      },
      include: {
        subjects: true,
        classes: {
          include: {
            grade: true,
            students: {
              select: {
                id: true,
                name: true,
                surname: true,
                username: true,
                class: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!teacher) {
      console.log("❌ Teacher not found!");
      return;
    }

    console.log("\n📋 TEACHER INFORMATION:");
    console.log("Name:", `${teacher.name} ${teacher.surname}`);
    console.log("Email:", teacher.email);
    console.log("ID:", teacher.id);

    console.log("\n📚 SUBJECTS TEACHER IS ASSIGNED TO:");
    if (teacher.subjects.length === 0) {
      console.log("❌ NO SUBJECTS ASSIGNED!");
    } else {
      teacher.subjects.forEach((subject, index) => {
        console.log(`${index + 1}. ${subject.name} (ID: ${subject.id})`);
      });
    }

    console.log("\n🏫 CLASS TEACHER ASSIGNMENT:");
    if (teacher.classes && teacher.classes.length > 0) {
      teacher.classes.forEach((cls) => {
        console.log(`✅ Class Teacher for: ${cls.name}`);
        console.log(`   Grade: ${cls.grade.level}`);
        console.log(`   Students: ${cls.students.length}`);
        
        if (cls.students.length > 0) {
          console.log("\n   👥 STUDENTS IN CLASS:");
          cls.students.forEach((student, index) => {
            console.log(`   ${index + 1}. ${student.name} ${student.surname} (${student.username}) - Class: ${student.class.name}`);
          });
        }
      });
    } else {
      console.log("❌ NOT A CLASS TEACHER");
    }

    // Check for exams in Grade 11
    console.log("\n📝 EXAMS FOR GRADE 11:");
    const exams = await prisma.exam.findMany({
      where: {
        grade: {
          level: 11,
        },
      },
      include: {
        grade: true,
        examType: true,
        examSubjects: {
          include: {
            subject: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
    });

    if (exams.length === 0) {
      console.log("❌ NO EXAMS FOUND FOR GRADE 11");
    } else {
      exams.forEach((exam, index) => {
        console.log(`\n${index + 1}. ${exam.title}`);
        console.log(`   Status: ${exam.status}`);
        console.log(`   Type: ${exam.examType.name}`);
        console.log(`   Subjects: ${exam.examSubjects.length}`);
        exam.examSubjects.forEach((es) => {
          console.log(`      - ${es.subject.name} (Max: ${es.maxMarks}, Entered: ${es.marksEntered ? "✅" : "❌"})`);
        });
      });
    }

    // Check all Grade 11 students
    console.log("\n👥 ALL GRADE 11 STUDENTS:");
    const grade11Students = await prisma.student.findMany({
      where: {
        class: {
          grade: {
            level: 11,
          },
        },
      },
      include: {
        class: {
          include: {
            grade: true,
          },
        },
      },
      orderBy: [
        { class: { name: "asc" } },
        { surname: "asc" },
        { name: "asc" },
      ],
    });

    console.log(`Total Grade 11 students: ${grade11Students.length}`);
    
    // Group by class
    const byClass: Record<string, typeof grade11Students> = {};
    grade11Students.forEach((student) => {
      const className = student.class.name;
      if (!byClass[className]) {
        byClass[className] = [];
      }
      byClass[className].push(student);
    });

    Object.entries(byClass).forEach(([className, students]) => {
      console.log(`\n📚 ${className}: ${students.length} students`);
      students.forEach((student, index) => {
        console.log(`   ${index + 1}. ${student.name} ${student.surname} (${student.username})`);
      });
    });

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTeacherMarksEntry();
