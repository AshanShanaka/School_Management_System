/**
 * Fix Class Teacher Assignments
 * This script ensures bidirectional relationship between Teacher and Class
 * Run: npx tsx scripts/fix-class-teacher-assignments.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixClassTeacherAssignments() {
  try {
    console.log('🔍 Checking class teacher assignments...\n');

    // Get all teachers with assigned classes
    const teachers = await prisma.teacher.findMany({
      include: {
        assignedClass: {
          include: {
            grade: true,
            _count: {
              select: {
                students: true,
              },
            },
          },
        },
      },
    });

    console.log(`📋 Found ${teachers.length} teachers\n`);

    let fixedCount = 0;
    let alreadyCorrectCount = 0;

    for (const teacher of teachers) {
      if (teacher.assignedClassId) {
        // Teacher has an assigned class - check if Class.classTeacherId matches
        const classRecord = await prisma.class.findUnique({
          where: { id: teacher.assignedClassId },
        });

        if (classRecord) {
          if (classRecord.classTeacherId !== teacher.id) {
            console.log(`⚠️  Mismatch found for ${teacher.name} ${teacher.surname}:`);
            console.log(`   Teacher.assignedClassId: ${teacher.assignedClassId} (${teacher.assignedClass?.name})`);
            console.log(`   Class.classTeacherId: ${classRecord.classTeacherId || 'NULL'}`);
            console.log(`   Fixing...`);

            // Update the class record to point to this teacher
            await prisma.class.update({
              where: { id: teacher.assignedClassId },
              data: { classTeacherId: teacher.id },
            });

            console.log(`   ✅ Fixed! Class ${teacher.assignedClass?.name} now points to ${teacher.name} ${teacher.surname}\n`);
            fixedCount++;
          } else {
            console.log(`✓ ${teacher.name} ${teacher.surname} -> ${teacher.assignedClass?.name} (${teacher.assignedClass?.grade.level}) - Already correct`);
            alreadyCorrectCount++;
          }
        }
      } else {
        console.log(`○ ${teacher.name} ${teacher.surname} - No class assigned`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 Summary:');
    console.log(`   ✅ Already Correct: ${alreadyCorrectCount}`);
    console.log(`   🔧 Fixed: ${fixedCount}`);
    console.log(`   ○ No Assignment: ${teachers.length - alreadyCorrectCount - fixedCount}`);
    console.log('='.repeat(60));

    // Show current assignments
    console.log('\n📋 Current Class Teacher Assignments:');
    const assignedTeachers = teachers.filter(t => t.assignedClassId);
    
    if (assignedTeachers.length === 0) {
      console.log('   ⚠️  No teachers have assigned classes!');
      console.log('\n💡 To assign a class teacher, run:');
      console.log('   npx tsx scripts/manual-assign-class.ts');
    } else {
      assignedTeachers.forEach((teacher, index) => {
        console.log(`   ${index + 1}. ${teacher.name} ${teacher.surname} -> ${teacher.assignedClass?.name} (Grade ${teacher.assignedClass?.grade.level}) - ${teacher.assignedClass?._count.students} students`);
      });
    }

    console.log('\n✨ Done!\n');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixClassTeacherAssignments();
