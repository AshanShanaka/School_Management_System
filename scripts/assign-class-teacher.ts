/**
 * Script to assign a class to a teacher
 * Run this in the terminal: npx tsx scripts/assign-class-teacher.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function assignClassToTeacher() {
  try {
    console.log('🔍 Fetching available teachers and classes...\n');

    // Get all teachers
    const teachers = await prisma.teacher.findMany({
      select: {
        id: true,
        name: true,
        surname: true,
        assignedClassId: true,
        assignedClass: {
          select: {
            name: true,
          },
        },
      },
    });

    console.log('📋 Available Teachers:');
    teachers.forEach((teacher, index) => {
      const assignedClass = teacher.assignedClass
        ? teacher.assignedClass.name
        : 'None';
      console.log(
        `${index + 1}. ${teacher.name} ${teacher.surname} (ID: ${teacher.id}) - Assigned: ${assignedClass}`
      );
    });

    // Get all classes
    const classes = await prisma.class.findMany({
      select: {
        id: true,
        name: true,
        capacity: true,
        grade: {
          select: {
            level: true,
          },
        },
        _count: {
          select: {
            students: true,
          },
        },
      },
    });

    console.log('\n📚 Available Classes:');
    classes.forEach((cls, index) => {
      console.log(
        `${index + 1}. ${cls.name} (ID: ${cls.id}) - Grade ${cls.grade.level} - Students: ${cls._count.students}/${cls.capacity}`
      );
    });

    // If no teachers or classes, inform user
    if (teachers.length === 0) {
      console.log('\n❌ No teachers found in the database.');
      return;
    }

    if (classes.length === 0) {
      console.log('\n❌ No classes found in the database.');
      return;
    }

    // Find first teacher without an assigned class
    const teacherToAssign = teachers.find(t => !t.assignedClassId);
    
    if (!teacherToAssign) {
      console.log('\n✅ All teachers already have assigned classes!');
      return;
    }

    // Find first class that's not assigned to any teacher
    const assignedClassIds = teachers
      .filter(t => t.assignedClassId)
      .map(t => t.assignedClassId);
    
    const classToAssign = classes.find(c => !assignedClassIds.includes(c.id));

    if (!classToAssign) {
      console.log('\n⚠️ All classes are already assigned to teachers!');
      console.log('   Creating a new class assignment anyway for the first available class...');
      // Just use the second class as fallback
      const fallbackClass = classes[1] || classes[0];
      
      console.log(`\n🎯 Assigning ${teacherToAssign.name} ${teacherToAssign.surname} to ${fallbackClass.name}...`);

      await prisma.teacher.update({
        where: { id: teacherToAssign.id },
        data: {
          assignedClassId: fallbackClass.id,
        },
      });

      console.log('✅ Successfully assigned class to teacher!');
      console.log(`   Teacher: ${teacherToAssign.name} ${teacherToAssign.surname}`);
      console.log(`   Class: ${fallbackClass.name}`);
      console.log(`   Class ID: ${fallbackClass.id}`);
      return;
    }

    console.log(`\n🎯 Assigning ${teacherToAssign.name} ${teacherToAssign.surname} to ${classToAssign.name}...`);

    await prisma.teacher.update({
      where: { id: teacherToAssign.id },
      data: {
        assignedClassId: classToAssign.id,
      },
    });

    console.log('✅ Successfully assigned class to teacher!');
    console.log(`   Teacher: ${teacherToAssign.name} ${teacherToAssign.surname}`);
    console.log(`   Class: ${classToAssign.name}`);
    console.log(`   Class ID: ${classToAssign.id}`);
    
    console.log('\n💡 To assign a different teacher or class, modify this script with:');
    console.log('   - Teacher ID');
    console.log('   - Class ID');
    console.log('\n   Or run this SQL in Prisma Studio:');
    console.log(`   UPDATE "Teacher" SET "assignedClassId" = {CLASS_ID} WHERE "id" = '{TEACHER_ID}';`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

assignClassToTeacher();
