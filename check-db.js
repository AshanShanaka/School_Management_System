const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log("Checking database contents...");
    
    const grades = await prisma.grade.findMany();
    console.log("Grades:", grades.length);
    
    const classes = await prisma.class.findMany({ include: { grade: true } });
    console.log("Classes:", classes.length);
    classes.forEach(cls => {
      console.log(`- Class ${cls.name} (Grade ${cls.grade?.level})`);
    });
    
    const subjects = await prisma.subject.findMany();
    console.log("Subjects:", subjects.length);
    
    const timetables = await prisma.timetable.findMany();
    console.log("Timetables:", timetables.length);
    
    const students = await prisma.student.findMany();
    console.log("Students:", students.length);
    
    const teachers = await prisma.teacher.findMany();
    console.log("Teachers:", teachers.length);
    
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
