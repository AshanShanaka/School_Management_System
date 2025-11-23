import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Creating Grade 9 and 10...\n");

  const grade9 = await prisma.grade.upsert({
    where: { level: 9 },
    create: { level: 9 },
    update: {},
  });

  const grade10 = await prisma.grade.upsert({
    where: { level: 10 },
    create: { level: 10 },
    update: {},
  });

  console.log("✅ Grade 9:", grade9);
  console.log("✅ Grade 10:", grade10);
  
  await prisma.$disconnect();
}

main();
