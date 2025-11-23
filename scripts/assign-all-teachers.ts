/**
 * Assign All Teachers to Classes
 * This script assigns each teacher to a unique class (one teacher per class)
 * Run: npx tsx scripts/assign-all-teachers.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function assignAllTeachers() {
  try {
    console.log('🔍 Fetching all teachers and classes...\n');

    // Get all teachers
    const teachers = await prisma.teacher.findMany({
      orderBy: {
        name: 'asc',
      },
    });

    // Get all classes
    const classes = await prisma.class.findMany({
      include: {
        grade: true,
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

    if (teachers.length === 0) {
      console.log('❌ No teachers found!');
      return;
    }

    if (classes.length === 0) {
      console.log('❌ No classes found!');
      return;
    }

    // Assign each teacher to a class
    let assignedCount = 0;
    const maxAssignments = Math.min(teachers.length, classes.length);

    console.log(`🎯 Assigning ${maxAssignments} teacher(s) to class(es)...\n`);

    for (let i = 0; i < maxAssignments; i++) {
      const teacher = teachers[i];
      const cls = classes[i];

      console.log(`${i + 1}. Assigning ${teacher.name} ${teacher.surname} -> ${cls.name} (Grade ${cls.grade.level})`);

      // Update teacher record
      await prisma.teacher.update({
        where: { id: teacher.id },
        data: { assignedClassId: cls.id },
      });

      // Update class record
      await prisma.class.update({
        where: { id: cls.id },
        data: { classTeacherId: teacher.id },
      });

      assignedCount++;
    }

    console.log('\n' + '='.repeat(70));
    console.log(`✅ Successfully assigned ${assignedCount} teacher(s) to classes!`);
    console.log('='.repeat(70));

    // Show summary
    console.log('\n📊 Assignment Summary:');
    for (let i = 0; i < assignedCount; i++) {
      const teacher = teachers[i];
      const cls = classes[i];
      console.log(`   ${i + 1}. ${teacher.name} ${teacher.surname} -> ${cls.name} (Grade ${cls.grade.level}) - ${cls._count.students} students`);
    }

    if (teachers.length > classes.length) {
      console.log(`\n⚠️  ${teachers.length - classes.length} teacher(s) remain unassigned (more teachers than classes)`);
    } else if (classes.length > teachers.length) {
      console.log(`\n⚠️  ${classes.length - teachers.length} class(es) remain without a class teacher (more classes than teachers)`);
    }

    console.log('\n✨ Done! Teachers can now access attendance features.\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

assignAllTeachers();
