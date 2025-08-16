// Run this script to add sample subject assignments
// Usage: node add-subject-assignments.js

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Adding sample subject assignments...');

    // Get first few subjects and teachers
    const subjects = await prisma.subject.findMany({
      take: 5,
      orderBy: { name: 'asc' },
    });

    const teachers = await prisma.teacher.findMany({
      take: 5,
      orderBy: { name: 'asc' },
    });

    const classes = await prisma.class.findMany({
      take: 3,
      orderBy: { id: 'asc' },
    });

    if (subjects.length === 0) {
      console.log('No subjects found. Creating sample subjects...');
      await prisma.subject.createMany({
        data: [
          { name: 'Mathematics', code: 'MATH', color: '#3B82F6' },
          { name: 'English', code: 'ENG', color: '#10B981' },
          { name: 'Science', code: 'SCI', color: '#F59E0B' },
          { name: 'History', code: 'HIST', color: '#EF4444' },
          { name: 'Geography', code: 'GEO', color: '#8B5CF6' },
        ],
      });
      console.log('Sample subjects created.');
    }

    if (teachers.length === 0) {
      console.log('No teachers found. Please create teachers first.');
      return;
    }

    if (classes.length === 0) {
      console.log('No classes found. Please create classes first.');
      return;
    }

    // Refresh subjects after potential creation
    const refreshedSubjects = await prisma.subject.findMany({
      take: 5,
      orderBy: { name: 'asc' },
    });

    console.log(`Found ${refreshedSubjects.length} subjects and ${teachers.length} teachers for ${classes.length} classes.`);

    // Create subject assignments
    const assignments = [];
    for (const classItem of classes) {
      for (let i = 0; i < Math.min(refreshedSubjects.length, teachers.length); i++) {
        assignments.push({
          subjectId: refreshedSubjects[i].id,
          teacherId: teachers[i].id,
          classId: classItem.id,
        });
      }
    }

    // Clear existing assignments for these classes to avoid duplicates
    await prisma.subjectAssignment.deleteMany({
      where: {
        classId: {
          in: classes.map(c => c.id),
        },
      },
    });

    // Create new assignments
    await prisma.subjectAssignment.createMany({
      data: assignments,
    });

    console.log(`Successfully created ${assignments.length} subject assignments.`);
    
    // Display the assignments
    const createdAssignments = await prisma.subjectAssignment.findMany({
      where: {
        classId: {
          in: classes.map(c => c.id),
        },
      },
      include: {
        subject: true,
        teacher: true,
        class: { include: { grade: true } },
      },
    });

    console.log('\nCreated assignments:');
    createdAssignments.forEach(assignment => {
      console.log(`- ${assignment.subject.name} taught by ${assignment.teacher.name} ${assignment.teacher.surname} for Grade ${assignment.class.grade.level}-${assignment.class.name}`);
    });

  } catch (error) {
    console.error('Error creating subject assignments:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
