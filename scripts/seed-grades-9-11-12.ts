/**
 * Seed Script: Add Grades 9, 11, 12
 * This script adds only Grade 9, 11, and 12 to the database
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedGrades() {
  console.log('🎓 Starting Grade 9, 11, 12 seeding...\n');

  try {
    // Define the grades to add
    const gradesToAdd = [
      {
        level: 9,
      },
      {
        level: 11,
      },
      {
        level: 12,
      },
    ];

    console.log('📚 Creating grades...');
    
    for (const gradeData of gradesToAdd) {
      // Check if grade already exists
      const existing = await prisma.grade.findFirst({
        where: { level: gradeData.level },
      });

      if (existing) {
        console.log(`  ⚠️  Grade ${gradeData.level} already exists, skipping...`);
        continue;
      }

      // Create the grade
      const grade = await prisma.grade.create({
        data: gradeData,
      });

      console.log(`  ✓ Created: Grade ${grade.level} (ID: ${grade.id})`);
    }

    // Display summary
    console.log('\n📊 Seeding Complete!\n');
    
    const allGrades = await prisma.grade.findMany({
      orderBy: { level: 'asc' },
    });

    console.log('Current grades in database:');
    allGrades.forEach(grade => {
      console.log(`  • Grade ${grade.level} (ID: ${grade.id})`);
    });

    console.log('\n✅ Grade 9, 11, 12 seeding completed successfully!');

  } catch (error) {
    console.error('\n❌ Error seeding grades:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
seedGrades()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
