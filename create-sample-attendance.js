import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function createSampleAttendanceData() {
  try {
    console.log("Creating sample attendance data...");

    // Get all students
    const students = await prisma.student.findMany({
      include: {
        class: true,
      },
    });

    console.log(`Found ${students.length} students`);

    // Get all lessons
    const lessons = await prisma.lesson.findMany();
    console.log(`Found ${lessons.length} lessons`);

    if (lessons.length === 0) {
      console.log("No lessons found. Creating a sample lesson first...");
      
      // Get first class and subject
      const firstClass = await prisma.class.findFirst();
      const firstSubject = await prisma.subject.findFirst();
      const firstTeacher = await prisma.teacher.findFirst();

      if (firstClass && firstSubject && firstTeacher) {
        const sampleLesson = await prisma.lesson.create({
          data: {
            name: "Morning Assembly",
            day: "MONDAY",
            startTime: new Date("2024-01-01T08:30:00Z"),
            endTime: new Date("2024-01-01T09:30:00Z"),
            subjectId: firstSubject.id,
            classId: firstClass.id,
            teacherId: firstTeacher.id,
          },
        });
        console.log("Created sample lesson:", sampleLesson.name);
      }
    }

    // Get the first lesson to use as reference
    const referenceLesson = await prisma.lesson.findFirst();
    
    if (!referenceLesson) {
      console.log("No reference lesson available. Cannot create attendance records.");
      return;
    }

    // Create attendance records for the last 5 days
    const today = new Date();
    const attendancePromises = [];

    for (let dayOffset = 0; dayOffset < 5; dayOffset++) {
      const attendanceDate = new Date(today);
      attendanceDate.setDate(today.getDate() - dayOffset);
      attendanceDate.setHours(8, 30, 0, 0);

      // Skip weekends
      if (attendanceDate.getDay() === 0 || attendanceDate.getDay() === 6) {
        continue;
      }

      for (const student of students) {
        // Random attendance (90% chance of being present)
        const isPresent = Math.random() > 0.1;
        
        attendancePromises.push(
          prisma.attendance.create({
            data: {
              studentId: student.id,
              lessonId: referenceLesson.id,
              date: attendanceDate,
              present: isPresent,
            },
          })
        );
      }
    }

    await Promise.all(attendancePromises);
    console.log(`Created ${attendancePromises.length} attendance records`);

    console.log("Sample attendance data created successfully!");
  } catch (error) {
    console.error("Error creating sample attendance data:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createSampleAttendanceData();
