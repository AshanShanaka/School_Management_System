/**
 * Quick Class Teacher Assignment
 * This script assigns the first available teacher to the first available class
 * Run: npx tsx scripts/quick-assign-teacher.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function quickAssignTeacher() {
  try {
    console.log('🔍 Finding teachers and classes...\n');

    // Get all teachers
    const teachers = await prisma.teacher.findMany({
      include: {
        assignedClass: {
          include: {
            grade: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Get all classes
    const classes = await prisma.class.findMany({
      include: {
        grade: true,
        classTeacher: true,
        _count: {
          select: {
            students: true,
          },
        },
      },
      orderBy: [
        { grade: { level: 'asc' } },
        { name: 'asc' },
      ],
    });

    console.log(`📋 Found ${teachers.length} teachers and ${classes.length} classes\n`);

    // Show current assignments
    console.log('Current Assignments:');
    console.log('='.repeat(70));
    
    const assigned = teachers.filter(t => t.assignedClassId);
    const unassigned = teachers.filter(t => !t.assignedClassId);

    if (assigned.length > 0) {
      console.log('✓ Assigned Teachers:');
      assigned.forEach((t, i) => {
        console.log(`  ${i + 1}. ${t.name} ${t.surname} -> ${t.assignedClass?.name} (Grade ${t.assignedClass?.grade.level})`);
      });
    }

    if (unassigned.length > 0) {
      console.log('\n○ Unassigned Teachers:');
      unassigned.forEach((t, i) => {
        console.log(`  ${i + 1}. ${t.name} ${t.surname} (ID: ${t.id})`);
      });
    }

    console.log('\n');

    // Assign first unassigned teacher to first available class
    if (unassigned.length === 0) {
      console.log('✅ All teachers already have assigned classes!');
      return;
    }

    const teacherToAssign = unassigned[0];
    
    // Find classes without a class teacher
    const unassignedClasses = classes.filter(c => !c.classTeacherId);
    
    if (unassignedClasses.length === 0) {
      console.log('⚠️  All classes already have class teachers!');
      console.log('   Assigning to first class anyway...');
    }

    const classToAssign = unassignedClasses[0] || classes[0];

    console.log('🎯 Assigning:');
    console.log(`   Teacher: ${teacherToAssign.name} ${teacherToAssign.surname}`);
    console.log(`   Class: ${classToAssign.name} (Grade ${classToAssign.grade.level})`);
    console.log(`   Students: ${classToAssign._count.students}`);
    console.log('\n   Processing...');

    // Update teacher record
    await prisma.teacher.update({
      where: { id: teacherToAssign.id },
      data: { assignedClassId: classToAssign.id },
    });

    // Update class record
    await prisma.class.update({
      where: { id: classToAssign.id },
      data: { classTeacherId: teacherToAssign.id },
    });

    console.log('\n✅ SUCCESS! Assignment complete.');
    console.log('\n📝 Details:');
    console.log(`   Teacher ID: ${teacherToAssign.id}`);
    console.log(`   Teacher: ${teacherToAssign.name} ${teacherToAssign.surname}`);
    console.log(`   Class ID: ${classToAssign.id}`);
    console.log(`   Class: ${classToAssign.name}`);
    console.log(`   Grade: ${classToAssign.grade.level}`);
    
    console.log('\n💡 To assign more teachers, run this script again.');
    console.log('   Or use: npx tsx scripts/assign-all-teachers.ts\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

quickAssignTeacher();
