import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed...");

  try {
    // Check if admin already exists
    const existingAdmin = await prisma.admin.findFirst({
      where: { username: "admin" },
    });

    if (existingAdmin) {
      console.log("✅ Admin user already exists");
    } else {
      // Create admin user
      const hashedPassword = await bcrypt.hash("admin123", 12);

      const admin = await prisma.admin.create({
        data: {
          username: "admin",
          email: "admin@school.com",
          password: hashedPassword,
          name: "Admin",
          surname: "User",
        },
      });

      console.log("✅ Created admin user:", admin.username);
    }

    // Check if any grades exist
    const gradeCount = await prisma.grade.count();

    if (gradeCount === 0) {
      console.log("Creating default grades...");

      // Create grades 1-13
      for (let i = 1; i <= 13; i++) {
        await prisma.grade.create({
          data: {
            level: i,
          },
        });
      }

      console.log("✅ Created grades 1-13");
    } else {
      console.log(`✅ Found ${gradeCount} existing grades`);
    }

    // Check if any classes exist
    const classCount = await prisma.class.count();

    if (classCount === 0) {
      console.log("Creating default classes...");

      // Create some sample classes
      const grades = await prisma.grade.findMany();

      for (const grade of grades.slice(0, 5)) {
        // Only for first 5 grades
        await prisma.class.create({
          data: {
            name: `${grade.level}-A`,
            capacity: 35,
            gradeId: grade.id,
          },
        });

        await prisma.class.create({
          data: {
            name: `${grade.level}-B`,
            capacity: 35,
            gradeId: grade.id,
          },
        });
      }

      console.log("✅ Created sample classes");
    } else {
      console.log(`✅ Found ${classCount} existing classes`);
    }

    console.log("🎉 Seeding completed successfully!");
  } catch (error) {
    console.error("❌ Error during seeding:");
    console.error(error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
