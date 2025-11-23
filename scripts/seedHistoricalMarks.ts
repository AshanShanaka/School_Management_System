import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Configuration
const CONFIG = {
  HISTORICAL_GRADES: [9, 10], // Generate marks for Grade 9 and 10
  TERMS_PER_GRADE: [1, 2, 3], // 3 terms per grade
  CURRENT_YEAR: new Date().getFullYear(),
  
  // Performance consistency (how much marks vary from current pattern)
  GRADE_9_VARIATION: 10,  // Grade 9 marks can vary ±10 from current pattern
  GRADE_10_VARIATION: 5,  // Grade 10 marks can vary ±5 from current pattern (closer to current)
  
  // Grade progression patterns
  IMPROVING_STUDENT_RATE: 0.30,  // 30% students improve over time
  STABLE_STUDENT_RATE: 0.50,     // 50% students stay consistent
  DECLINING_STUDENT_RATE: 0.20,  // 20% students decline slightly
};

type PerformanceCategory = "STRONG" | "AVERAGE" | "WEAK";
type ProgressionPattern = "IMPROVING" | "STABLE" | "DECLINING";

// Helper: Determine performance category from current average marks
function getPerformanceCategory(averageMarks: number): PerformanceCategory {
  if (averageMarks >= 70) return "STRONG";
  if (averageMarks >= 45) return "AVERAGE";
  return "WEAK";
}

// Helper: Assign progression pattern
function assignProgressionPattern(): ProgressionPattern {
  const rand = Math.random();
  if (rand < CONFIG.IMPROVING_STUDENT_RATE) return "IMPROVING";
  if (rand < CONFIG.IMPROVING_STUDENT_RATE + CONFIG.STABLE_STUDENT_RATE) return "STABLE";
  return "DECLINING";
}

// Helper: Calculate historical mark based on current performance and progression
function calculateHistoricalMark(
  currentAverage: number,
  historicalGrade: number,
  pattern: ProgressionPattern,
  subjectId: number
): number {
  const variation = historicalGrade === 9 ? CONFIG.GRADE_9_VARIATION : CONFIG.GRADE_10_VARIATION;
  
  let baseMark = currentAverage;
  
  // Adjust based on progression pattern
  if (pattern === "IMPROVING") {
    // Student was weaker in the past
    if (historicalGrade === 9) baseMark -= 15;
    if (historicalGrade === 10) baseMark -= 8;
  } else if (pattern === "DECLINING") {
    // Student was stronger in the past
    if (historicalGrade === 9) baseMark += 10;
    if (historicalGrade === 10) baseMark += 5;
  }
  // STABLE pattern keeps similar marks
  
  // Add random variation
  const randomVariation = Math.floor(Math.random() * (variation * 2 + 1)) - variation;
  let finalMark = baseMark + randomVariation;
  
  // Keep within realistic bounds
  finalMark = Math.max(20, Math.min(95, finalMark));
  
  return Math.round(finalMark);
}

// Helper: Calculate grade from marks
function calculateGrade(marks: number): string {
  if (marks >= 75) return "A";
  if (marks >= 65) return "B";
  if (marks >= 50) return "C";
  if (marks >= 35) return "S";
  return "W";
}

// Helper: Get or create historical exam
async function getOrCreateHistoricalExam(
  term: number,
  gradeId: number,
  gradeLevel: number,
  year: number
): Promise<any> {
  const termEnum = term === 1 ? "TERM1" : term === 2 ? "TERM2" : "TERM3";
  const title = `Grade ${gradeLevel} Term ${term} Exam`;
  
  let exam = await prisma.exam.findFirst({
    where: {
      gradeId,
      term,
      year,
    },
  });

  if (!exam) {
    exam = await prisma.exam.create({
      data: {
        title,
        year,
        term,
        gradeId,
        examTypeEnum: termEnum as any,
        status: "PUBLISHED",
      },
    });
    console.log(`   📝 Created exam: ${title} (${year})`);
  }

  return exam;
}

// Helper: Get or create exam-subject link
async function getOrCreateExamSubject(examId: number, subjectId: number): Promise<any> {
  let examSubject = await prisma.examSubject.findFirst({
    where: {
      examId,
      subjectId,
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

async function main() {
  console.log("🎓 Starting Historical Marks Seeding for Grade 11 Students...\n");

  try {
    // Get Grade 11 students with their current exam results
    const grade11Students = await prisma.student.findMany({
      where: {
        class: {
          grade: {
            level: 11,
          },
        },
      },
      include: {
        class: {
          include: {
            grade: true,
          },
        },
        examResults: {
          include: {
            exam: true,
            examSubject: {
              include: {
                subject: true,
              },
            },
          },
        },
      },
    });

    if (grade11Students.length === 0) {
      console.log("❌ No Grade 11 students found!");
      return;
    }

    console.log(`👥 Found ${grade11Students.length} Grade 11 students`);
    console.log(`📚 Generating historical marks for Grades 9 and 10\n`);

    // Get all subjects
    const subjects = await prisma.subject.findMany({
      orderBy: { name: "asc" },
    });

    console.log(`📖 Found ${subjects.length} subjects\n`);

    // Get Grade 9 and 10 from database
    const grade9 = await prisma.grade.findUnique({ where: { level: 9 } });
    const grade10 = await prisma.grade.findUnique({ where: { level: 10 } });

    if (!grade9 || !grade10) {
      console.log("❌ Grade 9 or 10 not found in database!");
      return;
    }

    let totalMarksCreated = 0;
    let totalMarksUpdated = 0;

    // Process each student
    for (const student of grade11Students) {
      console.log(`\n👤 Processing: ${student.name} ${student.surname} (${student.class.name})`);

      // Calculate current average performance
      const currentMarks = student.examResults.map(r => r.marks);
      const currentAverage = currentMarks.length > 0
        ? currentMarks.reduce((a, b) => a + b, 0) / currentMarks.length
        : 50;

      const performanceCategory = getPerformanceCategory(currentAverage);
      const progressionPattern = assignProgressionPattern();

      console.log(`   📊 Current Average: ${currentAverage.toFixed(1)} (${performanceCategory})`);
      console.log(`   📈 Progression Pattern: ${progressionPattern}`);

      // Generate marks for each historical grade
      for (const historicalGradeLevel of CONFIG.HISTORICAL_GRADES) {
        const historicalGrade = historicalGradeLevel === 9 ? grade9 : grade10;
        const year = CONFIG.CURRENT_YEAR - (11 - historicalGradeLevel);

        console.log(`\n   📅 Grade ${historicalGradeLevel} (Year ${year}):`);

        // Generate marks for each term
        for (const term of CONFIG.TERMS_PER_GRADE) {
          const exam = await getOrCreateHistoricalExam(term, historicalGrade.id, historicalGradeLevel, year);

          // Generate marks for each subject
          for (const subject of subjects) {
            const examSubject = await getOrCreateExamSubject(exam.id, subject.id);

            // Calculate historical mark based on current performance
            const marks = calculateHistoricalMark(
              currentAverage,
              historicalGradeLevel,
              progressionPattern,
              subject.id
            );

            const grade = calculateGrade(marks);

            // Check if record already exists
            const existingResult = await prisma.examResult.findUnique({
              where: {
                examSubjectId_studentId: {
                  examSubjectId: examSubject.id,
                  studentId: student.id,
                },
              },
            });

            if (existingResult) {
              await prisma.examResult.update({
                where: { id: existingResult.id },
                data: { marks, grade },
              });
              totalMarksUpdated++;
            } else {
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

          console.log(`      ✅ Term ${term}: Generated ${subjects.length} subject marks`);
        }
      }
    }

    console.log("\n" + "=".repeat(70));
    console.log("✅ Historical Marks Seeding Complete!");
    console.log("=".repeat(70));
    console.log(`📊 Summary Statistics:`);
    console.log(`   👥 Students Processed: ${grade11Students.length}`);
    console.log(`   📚 Subjects per Term: ${subjects.length}`);
    console.log(`   📅 Historical Grades: ${CONFIG.HISTORICAL_GRADES.join(", ")}`);
    console.log(`   📝 Terms per Grade: ${CONFIG.TERMS_PER_GRADE.length}`);
    console.log(`   ➕ New Records Created: ${totalMarksCreated}`);
    console.log(`   🔄 Records Updated: ${totalMarksUpdated}`);
    console.log(`   📝 Total Records: ${totalMarksCreated + totalMarksUpdated}`);
    console.log("=".repeat(70) + "\n");

    // Display progression pattern distribution
    console.log("📈 Progression Pattern Distribution:");
    console.log(`   🚀 Improving: ${(CONFIG.IMPROVING_STUDENT_RATE * 100).toFixed(0)}%`);
    console.log(`   ➡️  Stable: ${(CONFIG.STABLE_STUDENT_RATE * 100).toFixed(0)}%`);
    console.log(`   📉 Declining: ${(CONFIG.DECLINING_STUDENT_RATE * 100).toFixed(0)}%\n`);

    console.log("💡 Historical marks maintain consistency with current performance!");
    console.log("💡 Grade 9 marks vary more, Grade 10 marks closer to Grade 11 pattern.");

  } catch (error) {
    console.error("\n❌ Error during seeding:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
