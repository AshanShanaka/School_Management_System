import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  // Hash passwords
  const hashedPassword = await bcrypt.hash("admin123", 12);
  const teacherPassword = await bcrypt.hash("Teach@1003", 12);
  const studentPassword = await bcrypt.hash("student123", 12);
  const parentPassword = await bcrypt.hash("parent123", 12);

  console.log("🌱 Seeding database...");

  // Create admin user
  const admin = await prisma.admin.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      email: "admin@school.com",
      password: hashedPassword,
      name: "Admin",
      surname: "User",
    },
  });
  console.log("✅ Created admin user:", admin.username);

  // Create grade levels
  const grades = [];
  for (let level = 1; level <= 12; level++) {
    const grade = await prisma.grade.upsert({
      where: { level },
      update: {},
      create: { level },
    });
    grades.push(grade);
  }
  console.log("✅ Created grade levels 1-12");

  // Create sample subjects
  const subjects = [
    { name: "Mathematics", code: "MATH" },
    { name: "Science", code: "SCI" },
    { name: "English", code: "ENG" },
    { name: "History", code: "HIST" },
    { name: "Geography", code: "GEO" },
  ];

  const createdSubjects = [];
  for (const subject of subjects) {
    const created = await prisma.subject.upsert({
      where: { name: subject.name },
      update: {},
      create: subject,
    });
    createdSubjects.push(created);
  }
  console.log("✅ Created sample subjects");

  // Create exam types
  const examTypes = [
    { name: "Term 1" },
    { name: "Term 2" },
    { name: "Term 3" },
  ];

  const createdExamTypes = [];
  for (const examType of examTypes) {
    const created = await prisma.examType.upsert({
      where: { name: examType.name },
      update: {},
      create: examType,
    });
    createdExamTypes.push(created);
  }
  console.log("✅ Created sample exam types");

  // Create sample classes with proper relationships
  const classesData = [
    { name: "1-A", capacity: 25, gradeId: grades[0].id },
    { name: "1-B", capacity: 30, gradeId: grades[0].id },
    { name: "10-A", capacity: 25, gradeId: grades[9].id },
    { name: "10-B", capacity: 25, gradeId: grades[9].id },
    { name: "11-A", capacity: 25, gradeId: grades[10].id },
    { name: "11-B", capacity: 25, gradeId: grades[10].id },
  ];

  const createdClasses = [];
  for (const classData of classesData) {
    const created = await prisma.class.upsert({
      where: { name: classData.name },
      update: {},
      create: classData,
    });
    createdClasses.push(created);
  }
  console.log("✅ Created sample classes");

  // Create teacher users
  const teachersData = [
    {
      username: "kasun",
      email: "kasun@gmail.com",
      password: teacherPassword,
      name: "Kasun",
      surname: "Perera",
      phone: "0771234567",
      address: "Colombo, Sri Lanka",
      sex: "MALE" as const,
      birthday: new Date("1985-05-15"),
    },
    {
      username: "priya",
      email: "priya@school.com",
      password: teacherPassword,
      name: "Priya",
      surname: "Silva",
      phone: "0772345678",
      address: "Kandy, Sri Lanka",
      sex: "FEMALE" as const,
      birthday: new Date("1988-03-22"),
    },
    {
      username: "nimal",
      email: "nimal@school.com",
      password: teacherPassword,
      name: "Nimal",
      surname: "Fernando",
      phone: "0773456789",
      address: "Galle, Sri Lanka",
      sex: "MALE" as const,
      birthday: new Date("1982-07-10"),
    },
  ];

  const createdTeachers = [];
  for (const teacherData of teachersData) {
    const teacher = await prisma.teacher.upsert({
      where: { username: teacherData.username },
      update: {},
      create: teacherData,
    });
    createdTeachers.push(teacher);
  }
  console.log("✅ Created teacher users");

  // Assign teachers as class supervisors and to subjects
  if (createdTeachers.length > 0 && createdClasses.length > 0) {
    // Assign first teacher to first two classes
    await prisma.class.update({
      where: { id: createdClasses[0].id },
      data: { supervisorId: createdTeachers[0].id },
    });
    await prisma.class.update({
      where: { id: createdClasses[1].id },
      data: { supervisorId: createdTeachers[0].id },
    });

    // Assign second teacher to next two classes
    if (createdTeachers[1] && createdClasses[2]) {
      await prisma.class.update({
        where: { id: createdClasses[2].id },
        data: { supervisorId: createdTeachers[1].id },
      });
    }
    if (createdTeachers[1] && createdClasses[3]) {
      await prisma.class.update({
        where: { id: createdClasses[3].id },
        data: { supervisorId: createdTeachers[1].id },
      });
    }

    // Connect teachers to subjects
    for (
      let i = 0;
      i < createdTeachers.length && i < createdSubjects.length;
      i++
    ) {
      await prisma.teacher.update({
        where: { id: createdTeachers[i].id },
        data: {
          subjects: {
            connect: createdSubjects.slice(i, i + 2).map((s) => ({ id: s.id })),
          },
        },
      });
    }
  }
  console.log("✅ Assigned teachers to classes and subjects");

  // Create parent users
  const parentsData = [
    {
      username: "parent1",
      email: "parent1@example.com",
      password: parentPassword,
      name: "John",
      surname: "Doe",
      phone: "0712345678",
      address: "Galle, Sri Lanka",
      sex: "MALE" as const,
      birthday: new Date("1980-03-20"),
    },
    {
      username: "parent2",
      email: "parent2@example.com",
      password: parentPassword,
      name: "Mary",
      surname: "Smith",
      phone: "0713456789",
      address: "Colombo, Sri Lanka",
      sex: "FEMALE" as const,
      birthday: new Date("1983-06-15"),
    },
  ];

  const createdParents = [];
  for (const parentData of parentsData) {
    const parent = await prisma.parent.upsert({
      where: { username: parentData.username },
      update: {},
      create: parentData,
    });
    createdParents.push(parent);
  }
  console.log("✅ Created parent users");

  // Create student users
  if (createdClasses.length > 0 && createdParents.length > 0) {
    const studentsData = [
      {
        username: "student1",
        email: "student1@example.com",
        password: studentPassword,
        name: "Jane",
        surname: "Doe",
        phone: "0723456789",
        address: "Galle, Sri Lanka",
        sex: "FEMALE" as const,
        birthday: new Date("2010-08-10"),
        gradeId: grades[0].id,
        classId: createdClasses[0].id,
        parentId: createdParents[0].id,
      },
      {
        username: "student2",
        email: "student2@example.com",
        password: studentPassword,
        name: "Mike",
        surname: "Smith",
        phone: "0724567890",
        address: "Colombo, Sri Lanka",
        sex: "MALE" as const,
        birthday: new Date("2008-12-05"),
        gradeId: grades[2].id,
        classId: createdClasses[2].id,
        parentId: createdParents[1].id,
      },
      {
        username: "student3",
        email: "student3@example.com",
        password: studentPassword,
        name: "Sarah",
        surname: "Wilson",
        phone: "0725678901",
        address: "Kandy, Sri Lanka",
        sex: "FEMALE" as const,
        birthday: new Date("2009-04-18"),
        gradeId: grades[1].id,
        classId: createdClasses[1].id,
        parentId: createdParents[0].id,
      },
    ];

    for (const studentData of studentsData) {
      await prisma.student.upsert({
        where: { username: studentData.username },
        update: {},
        create: studentData,
      });
    }
    console.log("✅ Created student users");
  }

  console.log("🎉 Database seeded successfully!");
  console.log("");
  console.log("🔐 Login credentials:");
  console.log("👨‍💼 Admin: admin / admin123");
  console.log("👨‍🏫 Teachers:");
  console.log("   kasun / Teach@1003 (or kasun@gmail.com / Teach@1003)");
  console.log("   priya / Teach@1003");
  console.log("   nimal / Teach@1003");
  console.log("👨‍👩‍👧‍👦 Parents:");
  console.log("   parent1 / parent123");
  console.log("   parent2 / parent123");
  console.log("👩‍🎓 Students:");
  console.log("   student1 / student123");
  console.log("   student2 / student123");
  console.log("   student3 / student123");
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
