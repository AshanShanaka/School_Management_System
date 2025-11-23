/**
 * Quick Teacher Setup - Find and Assign Your Account
 * This script helps you:
 * 1. See all teachers
 * 2. Assign the teacher YOU are logged in as to a class
 * 
 * Usage: Just tell me your email, and I'll assign you!
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================
// TELL ME: What email did you log in with?
// ============================================
const YOUR_LOGIN_EMAIL = 'YOUR_EMAIL_HERE@wkcc.lk';  // e.g., 'suresh.bandara@wkcc.lk'
// ============================================

async function setupTeacher() {
  try {
    console.log('\n' + '='.repeat(70));
    console.log('🎓 TEACHER & CLASS ASSIGNMENT TOOL');
    console.log('='.repeat(70));

    // Get all teachers with their classes
    const teachers = await prisma.teacher.findMany({
      select: {
        id: true,
        name: true,
        surname: true,
        email: true,
        assignedClassId: true,
        assignedClass: {
          select: {
            id: true,
            name: true,
            _count: {
              select: { students: true }
            }
          },
        },
      },
    });

    // Get all classes
    const classes = await prisma.class.findMany({
      select: {
        id: true,
        name: true,
        _count: {
          select: { students: true }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    console.log('\n📋 ALL TEACHERS:');
    console.log('-'.repeat(70));
    teachers.forEach((teacher) => {
      const classInfo = teacher.assignedClass 
        ? `${teacher.assignedClass.name} (${teacher.assignedClass._count.students} students)`
        : '❌ NO CLASS';
      
      const youMarker = teacher.email === YOUR_LOGIN_EMAIL ? ' ← YOU?' : '';
      console.log(`${teacher.email}`);
      console.log(`  Name: ${teacher.name} ${teacher.surname}${youMarker}`);
      console.log(`  Class: ${classInfo}`);
      console.log(`  ID: ${teacher.id}`);
      console.log();
    });

    console.log('📚 ALL CLASSES:');
    console.log('-'.repeat(70));
    classes.forEach((cls) => {
      const assignedTo = teachers.find(t => t.assignedClassId === cls.id);
      const assignmentInfo = assignedTo 
        ? `✓ Assigned to ${assignedTo.name} ${assignedTo.surname}`
        : '○ Available';
      
      console.log(`Class ${cls.name}: ${cls._count.students} students - ${assignmentInfo}`);
    });
    console.log();

    // Check if user set their email
    if (YOUR_LOGIN_EMAIL === 'YOUR_EMAIL_HERE@wkcc.lk') {
      console.log('⚠️  PLEASE UPDATE YOUR EMAIL IN THIS SCRIPT!');
      console.log('\n📝 Steps:');
      console.log('   1. Look at the teachers list above');
      console.log('   2. Find YOUR email address');
      console.log('   3. Edit this file: scripts/quick-teacher-setup.ts');
      console.log('   4. Change YOUR_LOGIN_EMAIL to your actual email');
      console.log('   5. Run this script again\n');
      return;
    }

    // Find the logged-in teacher
    const yourTeacher = teachers.find(t => t.email === YOUR_LOGIN_EMAIL);

    if (!yourTeacher) {
      console.log(`❌ ERROR: No teacher found with email "${YOUR_LOGIN_EMAIL}"`);
      console.log('\nAvailable emails:');
      teachers.forEach(t => console.log(`   - ${t.email}`));
      console.log();
      return;
    }

    console.log('='.repeat(70));
    console.log(`✓ FOUND YOUR ACCOUNT: ${yourTeacher.name} ${yourTeacher.surname}`);
    console.log('='.repeat(70));

    // Check if already assigned
    if (yourTeacher.assignedClass) {
      console.log(`\n✅ You are already assigned to: ${yourTeacher.assignedClass.name}`);
      console.log(`   Students in class: ${yourTeacher.assignedClass._count.students}`);
      console.log('\n💡 You can now access: Dashboard → Class O/L Analytics\n');
      return;
    }

    // Find class with most students (11-A has 20 students)
    const bestClass = classes
      .filter(c => c._count.students > 0)
      .sort((a, b) => b._count.students - a._count.students)[0];

    if (!bestClass) {
      console.log('\n⚠️  No classes with students found!');
      console.log('   Please add students to classes first.\n');
      return;
    }

    console.log(`\n🎯 Assigning you to: ${bestClass.name}`);
    console.log(`   This class has ${bestClass._count.students} students`);

    // Check if someone else has this class
    const currentTeacher = teachers.find(t => t.assignedClassId === bestClass.id);
    if (currentTeacher) {
      console.log(`   ⚠️  Currently assigned to: ${currentTeacher.name} ${currentTeacher.surname}`);
      console.log(`   Reassigning to you...`);
      
      // Unassign the other teacher first
      await prisma.teacher.update({
        where: { id: currentTeacher.id },
        data: { assignedClassId: null }
      });
    }

    // Assign to your teacher
    await prisma.teacher.update({
      where: { id: yourTeacher.id },
      data: { assignedClassId: bestClass.id },
    });

    console.log('\n✅ SUCCESS! Class assigned!');
    console.log('='.repeat(70));
    console.log(`Teacher: ${yourTeacher.name} ${yourTeacher.surname}`);
    console.log(`Email: ${yourTeacher.email}`);
    console.log(`Assigned Class: ${bestClass.name}`);
    console.log(`Students: ${bestClass._count.students}`);
    console.log('='.repeat(70));
    console.log('\n🎉 You can now:');
    console.log('   1. Refresh your browser');
    console.log('   2. Go to: Dashboard → Class O/L Analytics');
    console.log('   3. View predictions for all your students!\n');

  } catch (error) {
    console.error('\n❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupTeacher();
