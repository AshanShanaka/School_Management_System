/**
 * Create New Teacher Script
 * Use this to create a new teacher account in the system
 * 
 * This creates the teacher in the database. You'll also need to:
 * 1. Create the user in Clerk with the same ID
 * 2. Set the role to "teacher" in Clerk
 * 
 * Usage: npx tsx scripts/create-teacher.ts
 */

import { PrismaClient } from '@prisma/client';
import { customAlphabet } from 'nanoid';

const prisma = new PrismaClient();

// Generate unique ID like Clerk does
const generateId = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 25);

// ============================================
// EDIT THESE VALUES TO CREATE A NEW TEACHER
// ============================================
const NEW_TEACHER = {
  name: 'John',
  surname: 'Doe',
  email: 'john.doe@wkcc.lk',
  phone: '+94771234567',
  sex: 'MALE', // or 'FEMALE'
  birthday: new Date('1985-05-15'), // Format: YYYY-MM-DD
  bloodType: 'O+',
  address: '123 School Road, Colombo',
  
  // Assign to a class immediately (optional)
  assignToClassId: 11, // Set to null if you don't want to assign yet
};
// ============================================

async function createTeacher() {
  try {
    console.log('🔍 Creating new teacher...\n');
    console.log('Teacher Details:');
    console.log(`  Name: ${NEW_TEACHER.name} ${NEW_TEACHER.surname}`);
    console.log(`  Email: ${NEW_TEACHER.email}`);
    console.log(`  Phone: ${NEW_TEACHER.phone}`);
    console.log(`  Sex: ${NEW_TEACHER.sex}`);
    console.log(`  Birthday: ${NEW_TEACHER.birthday.toDateString()}`);

    // Check if email already exists
    const existingTeacher = await prisma.teacher.findFirst({
      where: {
        email: NEW_TEACHER.email,
      },
    });

    if (existingTeacher) {
      console.log(`\n❌ Error: Teacher with email ${NEW_TEACHER.email} already exists!`);
      console.log(`   Existing Teacher: ${existingTeacher.name} ${existingTeacher.surname}`);
      console.log(`   ID: ${existingTeacher.id}\n`);
      return;
    }

    // Validate class if provided
    if (NEW_TEACHER.assignToClassId) {
      const classExists = await prisma.class.findUnique({
        where: { id: NEW_TEACHER.assignToClassId },
        include: {
          grade: true,
        },
      });

      if (!classExists) {
        console.log(`\n❌ Error: Class with ID ${NEW_TEACHER.assignToClassId} does not exist!`);
        console.log('   Set assignToClassId to null or use a valid class ID.\n');
        return;
      }

      // Check if class is already assigned
      const classTeacher = await prisma.teacher.findFirst({
        where: {
          assignedClassId: NEW_TEACHER.assignToClassId,
        },
      });

      if (classTeacher) {
        console.log(`\n⚠️  Warning: Class ${classExists.name} is already assigned to ${classTeacher.name} ${classTeacher.surname}`);
        console.log('   Proceeding will reassign the class to the new teacher...\n');
      } else {
        console.log(`  Will be assigned to: ${classExists.name} (Grade ${classExists.grade.level})`);
      }
    }

    // Generate unique ID for the teacher
    const teacherId = `teacher_${generateId()}`;

    console.log(`\n🎯 Creating teacher with ID: ${teacherId}\n`);

    // Create the teacher
    const teacher = await prisma.teacher.create({
      data: {
        id: teacherId,
        username: NEW_TEACHER.email.split('@')[0], // Use email prefix as username
        name: NEW_TEACHER.name,
        surname: NEW_TEACHER.surname,
        email: NEW_TEACHER.email,
        phone: NEW_TEACHER.phone,
        sex: NEW_TEACHER.sex,
        birthday: NEW_TEACHER.birthday,
        bloodType: NEW_TEACHER.bloodType,
        address: NEW_TEACHER.address,
        assignedClassId: NEW_TEACHER.assignToClassId,
        img: null, // Can be updated later
      },
      include: {
        assignedClass: {
          include: {
            grade: true,
          },
        },
      },
    });

    console.log('✅ SUCCESS! Teacher created in database.\n');
    console.log('='.repeat(70));
    console.log('📋 TEACHER DETAILS');
    console.log('='.repeat(70));
    console.log(`ID: ${teacher.id}`);
    console.log(`Username: ${teacher.username}`);
    console.log(`Name: ${teacher.name} ${teacher.surname}`);
    console.log(`Email: ${teacher.email}`);
    console.log(`Phone: ${teacher.phone}`);
    console.log(`Sex: ${teacher.sex}`);
    console.log(`Birthday: ${teacher.birthday.toDateString()}`);
    console.log(`Blood Type: ${teacher.bloodType}`);
    console.log(`Address: ${teacher.address}`);
    
    if (teacher.assignedClass) {
      console.log(`Assigned Class: ${teacher.assignedClass.name} (Grade ${teacher.assignedClass.grade.level})`);
    } else {
      console.log('Assigned Class: None');
    }
    
    console.log('='.repeat(70));

    console.log('\n⚠️  IMPORTANT: You must also create this user in Clerk!');
    console.log('\n📝 Steps to complete setup:');
    console.log('   1. Go to Clerk Dashboard (https://dashboard.clerk.com)');
    console.log('   2. Navigate to Users → Create User');
    console.log('   3. Use these details:');
    console.log(`      - User ID: ${teacher.id}`);
    console.log(`      - Email: ${teacher.email}`);
    console.log(`      - First Name: ${teacher.name}`);
    console.log(`      - Last Name: ${teacher.surname}`);
    console.log('   4. In Metadata → Public Metadata, add:');
    console.log('      {"role": "teacher"}');
    console.log('   5. Send invitation or set password\n');

    console.log('💡 Or use this quick command to create in Clerk via API:');
    console.log(`   (Requires Clerk API key in environment)\n`);

  } catch (error) {
    console.error('\n❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTeacher();
