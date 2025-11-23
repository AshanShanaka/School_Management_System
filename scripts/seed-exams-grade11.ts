import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Find Grade 11
  const grade = await prisma.grade.findFirst({ where: { level: 11 } });
  if (!grade) {
    console.error('❌ Grade 11 not found!');
    process.exit(1);
  }

  // Exam terms and enums
  const terms = [
    { term: 1, enum: 'TERM1', title: 'Grade 11 Term 1 Exam' },
    { term: 2, enum: 'TERM2', title: 'Grade 11 Term 2 Exam' },
    { term: 3, enum: 'TERM3', title: 'Grade 11 Term 3 Exam' },
    { term: 4, enum: 'TERM3', title: 'Grade 11 Term 4 Exam' } // Use TERM3 for Term 4 if only 3 enums exist
  ];

  for (const t of terms) {
    // Check if exam already exists
    const exists = await prisma.exam.findFirst({
      where: {
        gradeId: grade.id,
        term: t.term,
        year: 2025,
        examTypeEnum: t.enum as any,
      },
    });
    if (exists) {
      console.log(`⚠️  Exam already exists for term ${t.term}`);
      continue;
    }
    await prisma.exam.create({
      data: {
        title: t.title,
        examTypeEnum: t.enum as any,
        gradeId: grade.id,
        term: t.term,
        year: 2025,
        status: 'DRAFT',
      },
    });
    console.log(`✅ Created: ${t.title}`);
  }

  await prisma.$disconnect();
  console.log('🎉 Done!');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
