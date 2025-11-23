/**
 * Clear Database Script - Keep Admin Only
 * This script deletes all data from the database except the admin user
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearDatabaseKeepAdmin() {
  console.log('🗑️  Starting database cleanup...\n');

  try {
    // Get admin user before deletion
    const admin = await prisma.admin.findFirst({
      where: {
        username: 'admin'
      }
    });

    if (!admin) {
      console.log('⚠️  Warning: No admin user found. Creating one...');
    } else {
      console.log('✓ Found admin user:', admin.username);
    }

    // Delete data in correct order (respecting foreign key constraints)
    console.log('\n📋 Deleting records...\n');

    // 1. Delete timetable data
    console.log('Deleting timetable data...');
    await prisma.timetableSlot.deleteMany({});
    await prisma.schoolTimetable.deleteMany({});

    // 2. Delete messages and meetings
    console.log('Deleting messages and meetings...');
    await prisma.classTeacherMessage.deleteMany({});
    await prisma.parentMeeting.deleteMany({});
    await prisma.classAnnouncement.deleteMany({});

    // 3. Delete report cards
    console.log('Deleting report cards...');
    await prisma.reportCardSubject.deleteMany({});
    await prisma.reportCard.deleteMany({});
    await prisma.reportCardGeneration.deleteMany({});
    await prisma.reportWorkflow.deleteMany({});

    // 4. Delete exam-related data
    console.log('Deleting exam data...');
    await prisma.examResult.deleteMany({});
    await prisma.examSummary.deleteMany({});
    await prisma.examSupervisor.deleteMany({});
    await prisma.examSubject.deleteMany({});
    await prisma.examWorkflow.deleteMany({});
    await prisma.gradeBand.deleteMany({});
    await prisma.exam.deleteMany({});

    // 5. Delete assignments and attendance
    console.log('Deleting assignments and attendance...');
    await prisma.assignment.deleteMany({});
    await prisma.attendance.deleteMany({});
    await prisma.result.deleteMany({});

    // 6. Delete lessons
    console.log('Deleting lessons...');
    await prisma.lesson.deleteMany({});

    // 7. Delete events and announcements
    console.log('Deleting events and announcements...');
    await prisma.event.deleteMany({});
    await prisma.announcement.deleteMany({});

    // 8. Delete users (students, parents, teachers) but NOT admin
    console.log('Deleting students...');
    await prisma.student.deleteMany({});
    
    console.log('Deleting parents...');
    await prisma.parent.deleteMany({});
    
    console.log('Deleting teachers...');
    await prisma.classTeacherAssignment.deleteMany({});
    await prisma.teacher.deleteMany({});

    // 9. Delete class and subject data
    console.log('Deleting classes...');
    await prisma.class.deleteMany({});
    
    console.log('Deleting subjects...');
    await prisma.subject.deleteMany({});

    // 10. Delete grade scales
    console.log('Deleting grade scales...');
    await prisma.gradeScale.deleteMany({});

    // 11. Delete grades (keep system data like exam types)
    console.log('Deleting grades...');
    await prisma.grade.deleteMany({});

    // Keep: Admin, ExamType, Day enum data

    console.log('\n✅ Database cleared successfully!');
    console.log('\n📊 Remaining data:');
    console.log('  ✓ Admin user preserved');
    console.log('  ✓ Exam types preserved');
    
    // Verify admin still exists
    const adminCheck = await prisma.admin.findFirst({
      where: {
        username: 'admin'
      }
    });

    if (adminCheck) {
      console.log('\n✓ Admin user verified:', adminCheck.username);
      console.log('  Email:', adminCheck.email || 'N/A');
    } else {
      console.log('\n⚠️  Creating default admin user...');
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      await prisma.admin.create({
        data: {
          id: 'admin',
          username: 'admin',
          password: hashedPassword,
          name: 'Admin',
          surname: 'User',
          email: 'admin@school.com',
          phone: '1234567890',
          address: 'School Address',
          bloodType: 'O+',
          sex: 'MALE',
          birthday: new Date('1990-01-01'),
        }
      });
      
      console.log('✓ Default admin created successfully!');
      console.log('  Username: admin');
      console.log('  Password: admin123');
    }

    console.log('\n🎉 Database is ready for new data!');

  } catch (error) {
    console.error('\n❌ Error clearing database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
clearDatabaseKeepAdmin()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
