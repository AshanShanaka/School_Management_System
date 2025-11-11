// Quick script to check and seed grades
// Run with: npx ts-node check-grades.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAndSeedGrades() {
  try {
    console.log('🔍 Checking grades in database...');
    
    const existingGrades = await prisma.grade.findMany({
      orderBy: { level: 'asc' }
    });
    
    console.log(`📊 Found ${existingGrades.length} grades in database:`);
    existingGrades.forEach(grade => {
      console.log(`   - Grade ${grade.level} (ID: ${grade.id})`);
    });
    
    if (existingGrades.length === 0) {
      console.log('\n⚠️  No grades found! Creating default grades 6-13...\n');
      
      // Create grades 6 through 13 (typical school grades)
      const gradesToCreate = [6, 7, 8, 9, 10, 11, 12, 13];
      
      for (const level of gradesToCreate) {
        const grade = await prisma.grade.create({
          data: { level }
        });
        console.log(`✅ Created Grade ${grade.level} (ID: ${grade.id})`);
      }
      
      console.log('\n🎉 Successfully created 8 grades!');
    } else {
      console.log('\n✅ Grades already exist in database.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAndSeedGrades();
