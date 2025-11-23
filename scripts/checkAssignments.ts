import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAssignments() {
  try {
    console.log('=== CHECKING ASSIGNMENTS ===\n');

    // Get total assignments
    const totalAssignments = await prisma.assignment.count();
    console.log(`Total assignments in database: ${totalAssignments}`);

    // Get assignments with full details
    const assignments = await prisma.assignment.findMany({
      include: {
        lesson: {
          include: {
            subject: true,
            class: true,
          },
        },
      },
      take: 10,
    });

    console.log(`\nShowing first 10 assignments:\n`);
    assignments.forEach((assignment, index) => {
      console.log(`${index + 1}. ${assignment.title}`);
      console.log(`   Subject: ${assignment.lesson.subject.name}`);
      console.log(`   Class: ${assignment.lesson.class.name}`);
      console.log(`   Due Date: ${assignment.dueDate.toISOString().split('T')[0]}`);
      console.log(`   Status: ${new Date() > assignment.dueDate ? 'OVERDUE' : 'UPCOMING'}`);
      console.log('');
    });

    // Check upcoming assignments
    const upcomingCount = await prisma.assignment.count({
      where: {
        dueDate: { gte: new Date() },
      },
    });
    console.log(`\nUpcoming assignments (not yet due): ${upcomingCount}`);

    // Check students in classes
    const studentsInClasses = await prisma.student.findMany({
      select: {
        id: true,
        name: true,
        surname: true,
        class: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      take: 5,
    });

    console.log(`\nSample students and their classes:`);
    studentsInClasses.forEach((student) => {
      console.log(`- ${student.name} ${student.surname} (${student.id}) -> Class: ${student.class.name}`);
    });

    // Check if assignments exist for student's classes
    if (studentsInClasses.length > 0) {
      const firstStudent = studentsInClasses[0];
      const studentAssignments = await prisma.assignment.findMany({
        where: {
          lesson: {
            class: {
              students: { some: { id: firstStudent.id } },
            },
          },
          dueDate: { gte: new Date() },
        },
        include: {
          lesson: {
            include: {
              subject: true,
            },
          },
        },
      });

      console.log(`\nUpcoming assignments for ${firstStudent.name} ${firstStudent.surname}:`);
      if (studentAssignments.length === 0) {
        console.log('NO ASSIGNMENTS FOUND! This is why the student dashboard is empty.');
      } else {
        studentAssignments.forEach((assignment) => {
          console.log(`- ${assignment.title} (${assignment.lesson.subject.name}) - Due: ${assignment.dueDate.toISOString().split('T')[0]}`);
        });
      }
    }

  } catch (error) {
    console.error('Error checking assignments:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAssignments();
