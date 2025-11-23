/**
 * Manual Class Assignment Tool
 * Use this to assign a specific teacher to a specific class
 * 
 * Usage:
 * 1. Find your teacher ID from the list
 * 2. Find a class ID from the list
 * 3. Update the TEACHER_ID and CLASS_ID variables below
 * 4. Run: npx tsx scripts/manual-assign-class.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================
// EDIT THESE VALUES
// ============================================
const TEACHER_ID = 'YOUR_TEACHER_ID_HERE';  // e.g., 'cmhtdblpd001puhegqtg35hqd'
const CLASS_ID = 12;  // e.g., 12 for 9-A, 13 for 10-A, 11 for 11-A
// ============================================

async function manualAssignClass() {
  try {
    console.log('🔍 Fetching database information...\n');

    // Get all teachers
    const teachers = await prisma.teacher.findMany({
      select: {
        id: true,
        name: true,
        surname: true,
        email: true,
        assignedClassId: true,
        assignedClass: {
          select: {
            name: true,
          },
        },
      },
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

    console.log('=' .repeat(70));
    console.log('📋 ALL TEACHERS IN SYSTEM');
    console.log('='.repeat(70));
    teachers.forEach((teacher) => {
      const assignedClass = teacher.assignedClass
        ? teacher.assignedClass.name
        : 'NO CLASS ASSIGNED';
      console.log(`ID: ${teacher.id}`);
      console.log(`Name: ${teacher.name} ${teacher.surname}`);
      console.log(`Email: ${teacher.email || 'N/A'}`);
      console.log(`Assigned Class: ${assignedClass}`);
      console.log('-'.repeat(70));
    });

    console.log('\n' + '='.repeat(70));
    console.log('📚 ALL CLASSES IN SYSTEM');
    console.log('='.repeat(70));
    classes.forEach((cls) => {
      console.log(`ID: ${cls.id}`);
      console.log(`Name: ${cls.name}`);
      console.log(`Grade: ${cls.grade.level}`);
      console.log(`Students: ${cls._count.students}/${cls.capacity}`);
      console.log('-'.repeat(70));
    });

    // Check if custom values are set
    if (TEACHER_ID === 'YOUR_TEACHER_ID_HERE') {
      console.log('\n⚠️  Please update TEACHER_ID in this script first!');
      console.log('   1. Copy a teacher ID from the list above');
      console.log('   2. Edit scripts/manual-assign-class.ts');
      console.log('   3. Update TEACHER_ID and CLASS_ID variables');
      console.log('   4. Run this script again\n');
      return;
    }

    // Validate teacher exists
    const teacher = teachers.find(t => t.id === TEACHER_ID);
    if (!teacher) {
      console.log(`\n❌ Teacher ID "${TEACHER_ID}" not found!`);
      return;
    }

    // Validate class exists
    const targetClass = classes.find(c => c.id === CLASS_ID);
    if (!targetClass) {
      console.log(`\n❌ Class ID ${CLASS_ID} not found!`);
      return;
    }

    // Check if class is already assigned
    const classAlreadyAssigned = teachers.find(
      t => t.assignedClassId === CLASS_ID && t.id !== TEACHER_ID
    );
    
    if (classAlreadyAssigned) {
      console.log(`\n⚠️  Warning: Class ${targetClass.name} is already assigned to ${classAlreadyAssigned.name} ${classAlreadyAssigned.surname}`);
      console.log('   Proceeding will reassign the class...\n');
    }

    // Perform assignment
    console.log(`\n🎯 Assigning class...`);
    console.log(`   Teacher: ${teacher.name} ${teacher.surname}`);
    console.log(`   Class: ${targetClass.name} (Grade ${targetClass.grade.level})\n`);

    await prisma.teacher.update({
      where: { id: TEACHER_ID },
      data: {
        assignedClassId: CLASS_ID,
      },
    });

    console.log('✅ SUCCESS! Class assigned to teacher.');
    console.log(`\n💡 Now log in as: ${teacher.name} ${teacher.surname}`);
    console.log(`   Email: ${teacher.email || 'Use Clerk dashboard to find email'}`);
    console.log(`   Then navigate to: Class Teacher → Class O/L Analytics\n`);

  } catch (error) {
    console.error('\n❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

manualAssignClass();
