import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database with test data...');

  // Hash password
  const hashedPassword = await bcrypt.hash('student123', 12);
  const teacherHashedPassword = await bcrypt.hash('teacher123', 12);

  try {
    // Create Grade
    const grade10 = await prisma.grade.upsert({
      where: { level: 10 },
      update: {},
      create: {
        level: 10,
      },
    });

    const grade11 = await prisma.grade.upsert({
      where: { level: 11 },
      update: {},
      create: {
        level: 11,
      },
    });

    console.log('✅ Grades created');

    // Create Classes
    const class10A = await prisma.class.upsert({
      where: { name: '10A' },
      update: {},
      create: {
        name: '10A',
        capacity: 30,
        gradeId: grade10.id,
        supervisorId: null,
      },
    });

    const class11A = await prisma.class.upsert({
      where: { name: '11A' },
      update: {},
      create: {
        name: '11A',
        capacity: 30,
        gradeId: grade11.id,
        supervisorId: null,
      },
    });

    console.log('✅ Classes created');

    // Create Subjects
    const mathSubject = await prisma.subject.upsert({
      where: { name: 'Mathematics' },
      update: {},
      create: {
        name: 'Mathematics',
        code: 'MATH101',
      },
    });

    const scienceSubject = await prisma.subject.upsert({
      where: { name: 'Science' },
      update: {},
      create: {
        name: 'Science',
        code: 'SCI101',
      },
    });

    const englishSubject = await prisma.subject.upsert({
      where: { name: 'English' },
      update: {},
      create: {
        name: 'English',
        code: 'ENG101',
      },
    });

    console.log('✅ Subjects created');

    // Create Teacher
    const teacher = await prisma.teacher.upsert({
      where: { id: 'teacher-temp-id-2' },
      update: {},
      create: {
        id: 'teacher-temp-id-2',
        username: 'teacher1',
        email: 'teacher1@example.com',
        password: teacherHashedPassword,
        name: 'John',
        surname: 'Teacher',
        phone: '1234567890',
        address: '123 Teacher St',
        birthday: new Date('1985-05-15'),
        sex: 'MALE',
        bloodType: 'O+',
      },
    });

    console.log('✅ Teacher created');

    // Create Student
    const student = await prisma.student.upsert({
      where: { id: 'student-temp-id' },
      update: {},
      create: {
        id: 'student-temp-id',
        username: 'student1',
        email: 'student@example.com',
        password: hashedPassword,
        name: 'Jane',
        surname: 'Doe',
        phone: '0987654321',
        address: '456 Student Ave',
        birthday: new Date('2006-08-20'),
        sex: 'FEMALE',
        bloodType: 'A+',
        parentId: 'parent-temp-id',
        classId: class10A.id,
      },
    });

    console.log('✅ Student created');

    // Create Parent
    const parent = await prisma.parent.upsert({
      where: { id: 'parent-temp-id' },
      update: {},
      create: {
        id: 'parent-temp-id',
        username: 'parent1',
        email: 'parent@example.com',
        password: await bcrypt.hash('parent123', 12),
        name: 'John',
        surname: 'Doe',
        phone: '1122334455',
        address: '456 Student Ave',
      },
    });

    console.log('✅ Parent created');

    // Create Exam Type
    const termTest = await prisma.examType.upsert({
      where: { name: 'Term Test' },
      update: {},
      create: {
        name: 'Term Test',
        description: 'Regular term examination',
      },
    });

    console.log('✅ Exam Type created');

    // Create Sample Exam
    const exam = await prisma.exam.upsert({
      where: { 
        title_year_term_gradeId: {
          title: 'First Term Test',
          year: 2025,
          term: 1,
          gradeId: grade10.id,
        }
      },
      update: {},
      create: {
        title: 'First Term Test',
        startTime: new Date('2025-08-25T09:00:00Z'),
        endTime: new Date('2025-08-25T11:00:00Z'),
        year: 2025,
        term: 1,
        status: 'COMPLETED',
        examTypeEnum: 'TERM_TEST',
        gradeId: grade10.id,
        examTypeId: termTest.id,
      },
    });

    console.log('✅ Exam created');

    // Create Exam Subjects
    const mathExamSubject = await prisma.examSubject.upsert({
      where: {
        examId_subjectId: {
          examId: exam.id,
          subjectId: mathSubject.id,
        },
      },
      update: {},
      create: {
        examId: exam.id,
        subjectId: mathSubject.id,
        teacherId: teacher.id,
        maxMarks: 100,
      },
    });

    const scienceExamSubject = await prisma.examSubject.upsert({
      where: {
        examId_subjectId: {
          examId: exam.id,
          subjectId: scienceSubject.id,
        },
      },
      update: {},
      create: {
        examId: exam.id,
        subjectId: scienceSubject.id,
        teacherId: teacher.id,
        maxMarks: 100,
      },
    });

    const englishExamSubject = await prisma.examSubject.upsert({
      where: {
        examId_subjectId: {
          examId: exam.id,
          subjectId: englishSubject.id,
        },
      },
      update: {},
      create: {
        examId: exam.id,
        subjectId: englishSubject.id,
        teacherId: teacher.id,
        maxMarks: 100,
      },
    });

    console.log('✅ Exam Subjects created');

    // Create Sample Exam Results
    await prisma.examResult.upsert({
      where: {
        examId_examSubjectId_studentId: {
          examId: exam.id,
          examSubjectId: mathExamSubject.id,
          studentId: student.id,
        },
      },
      update: {},
      create: {
        examId: exam.id,
        examSubjectId: mathExamSubject.id,
        studentId: student.id,
        marks: 85,
        grade: 'A',
      },
    });

    await prisma.examResult.upsert({
      where: {
        examId_examSubjectId_studentId: {
          examId: exam.id,
          examSubjectId: scienceExamSubject.id,
          studentId: student.id,
        },
      },
      update: {},
      create: {
        examId: exam.id,
        examSubjectId: scienceExamSubject.id,
        studentId: student.id,
        marks: 78,
        grade: 'B+',
      },
    });

    await prisma.examResult.upsert({
      where: {
        examId_examSubjectId_studentId: {
          examId: exam.id,
          examSubjectId: englishExamSubject.id,
          studentId: student.id,
        },
      },
      update: {},
      create: {
        examId: exam.id,
        examSubjectId: englishExamSubject.id,
        studentId: student.id,
        marks: 92,
        grade: 'A+',
      },
    });

    console.log('✅ Exam Results created');

    // Create Exam Summary
    await prisma.examSummary.upsert({
      where: {
        examId_studentId: {
          examId: exam.id,
          studentId: student.id,
        },
      },
      update: {},
      create: {
        examId: exam.id,
        studentId: student.id,
        totalMarks: 255,
        totalMaxMarks: 300,
        percentage: 85.0,
        average: 82.5,
        overallGrade: 'A',
        classRank: 1,
        classSize: 1,
      },
    });

    console.log('✅ Exam Summary created');

    // Create Report Card
    const reportCard = await prisma.reportCard.upsert({
      where: {
        examId_studentId: {
          examId: exam.id,
          studentId: student.id,
        },
      },
      update: {},
      create: {
        examId: exam.id,
        studentId: student.id,
        status: 'published',
        totalMarks: 255,
        maxMarks: 300,
        percentage: 85.0,
        overallGrade: 'A',
        classRank: 1,
        classAverage: 82.5,
        teacherComment: 'Excellent performance across all subjects. Keep up the good work!',
        principalComment: 'Outstanding student with consistent academic excellence.',
        generatedAt: new Date(),
      },
    });

    // Create Report Card Subjects
    await prisma.reportCardSubject.upsert({
      where: {
        reportCardId_subjectId: {
          reportCardId: reportCard.id,
          subjectId: mathSubject.id,
        },
      },
      update: {},
      create: {
        reportCardId: reportCard.id,
        subjectId: mathSubject.id,
        marks: 85,
        maxMarks: 100,
        grade: 'A',
        classAverage: 75.5,
        remarks: 'Strong problem-solving skills',
      },
    });

    await prisma.reportCardSubject.upsert({
      where: {
        reportCardId_subjectId: {
          reportCardId: reportCard.id,
          subjectId: scienceSubject.id,
        },
      },
      update: {},
      create: {
        reportCardId: reportCard.id,
        subjectId: scienceSubject.id,
        marks: 78,
        maxMarks: 100,
        grade: 'B+',
        classAverage: 72.0,
        remarks: 'Good understanding of concepts',
      },
    });

    await prisma.reportCardSubject.upsert({
      where: {
        reportCardId_subjectId: {
          reportCardId: reportCard.id,
          subjectId: englishSubject.id,
        },
      },
      update: {},
      create: {
        reportCardId: reportCard.id,
        subjectId: englishSubject.id,
        marks: 92,
        maxMarks: 100,
        grade: 'A+',
        classAverage: 78.5,
        remarks: 'Excellent writing and communication skills',
      },
    });

    console.log('✅ Report Card and Subjects created');

    console.log('🎉 Database seeded successfully!');
    console.log('\n📚 Test Credentials:');
    console.log('Student: username=student1, password=student123');
    console.log('Teacher: username=teacher1, password=teacher123');
    console.log('Parent: username=parent1, password=parent123');
    console.log('Admin: username=admin, password=admin123');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
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
