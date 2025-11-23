/**
 * Seed Script: Generate Realistic Exam Marks
 * 
 * This script generates realistic exam marks for all existing students in the database.
 * Marks are generated for Terms 1, 2, and 3, with consistent performance levels per student.
 * 
 * Usage: npx tsx scripts/seedExamMarks.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Student performance categories with their mark ranges
 */
const PERFORMANCE_CATEGORIES = {
  STRONG: { min: 70, max: 95, label: 'Strong' },
  AVERAGE: { min: 45, max: 70, label: 'Average' },
  WEAK: { min: 20, max: 45, label: 'Weak' },
} as const;

/**
 * Random variation per term (±)
 * This adds realistic fluctuation to student marks across terms
 */
const TERM_VARIATION = 8;

/**
 * Terms to generate marks for
 */
const TERMS = [1, 2, 3];

/**
 * Current year for exam generation
 */
const CURRENT_YEAR = new Date().getFullYear();

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Randomly assign a performance category to a student
 * Distribution: 30% Strong, 50% Average, 20% Weak
 */
function assignPerformanceCategory(): keyof typeof PERFORMANCE_CATEGORIES {
  const rand = Math.random();
  if (rand < 0.30) return 'STRONG';
  if (rand < 0.80) return 'AVERAGE';
  return 'WEAK';
}

/**
 * Generate a random mark within a specified range
 */
function generateRandomMark(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate marks for a student based on their performance category
 * Adds term variation to simulate realistic performance fluctuations
 */
function generateStudentMarks(
  category: keyof typeof PERFORMANCE_CATEGORIES,
  termNumber: number
): number {
  const { min, max } = PERFORMANCE_CATEGORIES[category];
  
  // Base mark within the category range
  const baseMark = generateRandomMark(min, max);
  
  // Add random variation for this term (can be positive or negative)
  const variation = generateRandomMark(-TERM_VARIATION, TERM_VARIATION);
  const finalMark = baseMark + variation;
  
  // Ensure mark stays within 0-100 bounds
  return Math.max(0, Math.min(100, finalMark));
}

/**
 * Calculate letter grade based on percentage
 * A: 75-100, B: 65-74, C: 50-64, S: 35-49, W: 0-34
 */
function calculateGrade(marks: number): string {
  if (marks >= 75) return 'A';
  if (marks >= 65) return 'B';
  if (marks >= 50) return 'C';
  if (marks >= 35) return 'S';
  return 'W';
}

/**
 * Get or create exam for a specific term
 */
async function getOrCreateExam(term: number, gradeId: number) {
  // Try to find existing exam
  let exam = await prisma.exam.findFirst({
    where: {
      term,
      year: CURRENT_YEAR,
      gradeId,
    },
  });

  // If no exam exists, create one
  if (!exam) {
    console.log(`   📝 Creating exam for Grade ${gradeId}, Term ${term}`);
    exam = await prisma.exam.create({
      data: {
        title: `Grade ${gradeId} - Term ${term} Exam ${CURRENT_YEAR}`,
        term,
        year: CURRENT_YEAR,
        gradeId,
        examTypeEnum: `TERM${term}` as any,
        status: 'PUBLISHED',
      },
    });
  }

  return exam;
}

/**
 * Get or create exam subject link
 */
async function getOrCreateExamSubject(examId: number, subjectId: number) {
  let examSubject = await prisma.examSubject.findUnique({
    where: {
      examId_subjectId: {
        examId,
        subjectId,
      },
    },
  });

  if (!examSubject) {
    examSubject = await prisma.examSubject.create({
      data: {
        examId,
        subjectId,
        maxMarks: 100,
      },
    });
  }

  return examSubject;
}

// ============================================================================
// MAIN SEEDING LOGIC
// ============================================================================

async function seedExamMarks() {
  console.log('🌱 Starting Exam Marks Seeding Process...\n');

  try {
    // Step 1: Fetch all students
    console.log('📚 Fetching all students...');
    const students = await prisma.student.findMany({
      include: {
        grade: true,
        class: true,
      },
    });

    if (students.length === 0) {
      console.log('❌ No students found in database!');
      return;
    }

    console.log(`✅ Found ${students.length} students\n`);

    // Step 2: Fetch all subjects
    console.log('📖 Fetching all subjects...');
    const subjects = await prisma.subject.findMany();

    if (subjects.length === 0) {
      console.log('❌ No subjects found in database!');
      return;
    }

    console.log(`✅ Found ${subjects.length} subjects\n`);

    // Step 3: Assign performance category to each student
    console.log('🎯 Assigning performance categories to students...');
    const studentPerformance = new Map<string, keyof typeof PERFORMANCE_CATEGORIES>();
    
    students.forEach(student => {
      const category = assignPerformanceCategory();
      studentPerformance.set(student.id, category);
      console.log(`   ${student.name} ${student.surname} → ${PERFORMANCE_CATEGORIES[category].label}`);
    });

    console.log('\n');

    // Step 4: Generate marks for each student, subject, and term
    let totalMarksCreated = 0;
    let totalMarksUpdated = 0;

    for (const student of students) {
      console.log(`\n👨‍🎓 Processing ${student.name} ${student.surname} (Grade ${student.grade.level})...`);
      
      const category = studentPerformance.get(student.id)!;

      for (const term of TERMS) {
        console.log(`   📅 Term ${term}:`);

        // Get or create exam for this term and grade
        const exam = await getOrCreateExam(term, student.gradeId);

        for (const subject of subjects) {
          // Get or create exam subject link
          const examSubject = await getOrCreateExamSubject(exam.id, subject.id);

          // Generate marks based on student's performance category
          const marks = generateStudentMarks(category, term);
          const grade = calculateGrade(marks);

          // Check if marks already exist
          const existingResult = await prisma.examResult.findUnique({
            where: {
              examSubjectId_studentId: {
                examSubjectId: examSubject.id,
                studentId: student.id,
              },
            },
          });

          if (existingResult) {
            // Update existing marks
            await prisma.examResult.update({
              where: { id: existingResult.id },
              data: {
                marks,
                grade,
              },
            });
            totalMarksUpdated++;
          } else {
            // Insert new marks
            await prisma.examResult.create({
              data: {
                examId: exam.id,
                examSubjectId: examSubject.id,
                studentId: student.id,
                marks,
                grade,
              },
            });
            totalMarksCreated++;
          }
        }

        console.log(`      ✓ Generated marks for ${subjects.length} subjects`);
      }
    }

    // Step 5: Summary
    console.log('\n');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ SEEDING COMPLETE!');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`📊 Total students processed: ${students.length}`);
    console.log(`📚 Total subjects: ${subjects.length}`);
    console.log(`📅 Terms covered: ${TERMS.join(', ')}`);
    console.log(`➕ New marks created: ${totalMarksCreated}`);
    console.log(`🔄 Existing marks updated: ${totalMarksUpdated}`);
    console.log(`📈 Total exam results: ${totalMarksCreated + totalMarksUpdated}`);
    console.log('═══════════════════════════════════════════════════════════\n');

    // Step 6: Generate summary statistics
    console.log('📈 Performance Distribution:');
    const categories = Array.from(studentPerformance.values());
    const strongCount = categories.filter(c => c === 'STRONG').length;
    const averageCount = categories.filter(c => c === 'AVERAGE').length;
    const weakCount = categories.filter(c => c === 'WEAK').length;

    console.log(`   🏆 Strong Students: ${strongCount} (${((strongCount / students.length) * 100).toFixed(1)}%)`);
    console.log(`   📊 Average Students: ${averageCount} (${((averageCount / students.length) * 100).toFixed(1)}%)`);
    console.log(`   📉 Weak Students: ${weakCount} (${((weakCount / students.length) * 100).toFixed(1)}%)`);
    console.log('\n');

  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// ============================================================================
// EXECUTE SCRIPT
// ============================================================================

seedExamMarks()
  .then(() => {
    console.log('🎉 Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
