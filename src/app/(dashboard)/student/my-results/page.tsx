import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import StudentExamResultsClient from "@/components/StudentExamResultsClient";

const StudentExamResultsPage = async () => {
  const user = await getCurrentUser();
  
  if (!user || (user.role !== "student" && user.role !== "parent")) {
    redirect("/sign-in");
  }

  let studentIds: string[] = [];

  if (user.role === "student") {
    studentIds = [user.id];
  } else if (user.role === "parent") {
    const parent = await prisma.parent.findUnique({
      where: { id: user.id },
      include: { students: true },
    });
    studentIds = parent?.students.map(s => s.id) || [];
  }

  if (studentIds.length === 0) {
    redirect("/");
  }

  console.log('=== Student Results Page Debug ===');
  console.log('User ID:', user.id);
  console.log('User Role:', user.role);
  console.log('Student IDs:', studentIds);

  // Get all exam summaries for the student(s)
  const examSummaries = await prisma.examSummary.findMany({
    where: {
      studentId: { in: studentIds },
    },
    include: {
      exam: {
        include: {
          grade: true,
          examType: true,
        },
      },
      student: {
        include: {
          class: {
            include: {
              grade: true,
            },
          },
        },
      },
    },
    orderBy: [
      { exam: { year: "desc" } },
      { exam: { term: "desc" } },
      { exam: { createdAt: "desc" } },
    ],
  });

  // Get exam results for detailed view
  const examResults = await prisma.examResult.findMany({
    where: {
      studentId: { in: studentIds },
    },
    include: {
      exam: {
        include: {
          grade: true,
          examType: true,
        },
      },
      examSubject: {
        include: {
          subject: true,
          teacher: true,
        },
      },
      student: {
        include: {
          class: true,
        },
      },
    },
    orderBy: [
      { exam: { year: "desc" } },
      { exam: { term: "desc" } },
      { examSubject: { subject: { name: "asc" } } },
    ],
  });

  // Calculate subject-level statistics (class average and rank per subject)
  const subjectStats = await Promise.all(
    examResults.map(async (result) => {
      // Get all results for the same exam subject in the same class
      const classResults = await prisma.examResult.findMany({
        where: {
          examId: result.examId,
          examSubjectId: result.examSubjectId,
          student: {
            classId: result.student.classId,
          },
        },
        select: {
          marks: true,
          studentId: true,
        },
        orderBy: {
          marks: 'desc',
        },
      });

      // Calculate class average
      const totalMarks = classResults.reduce((sum, r) => sum + r.marks, 0);
      const classAverage = classResults.length > 0 ? totalMarks / classResults.length : 0;

      // Find student's rank
      const rank = classResults.findIndex(r => r.studentId === result.studentId) + 1;

      return {
        resultId: result.id,
        classAverage: Number(classAverage.toFixed(2)),
        rank,
        classSize: classResults.length,
      };
    })
  );

  // Create a map for easy lookup
  const statsMap = new Map(subjectStats.map(s => [s.resultId, s]));

  // Get report cards
  const reportCards = await prisma.reportCard.findMany({
    where: {
      studentId: { in: studentIds },
      status: { in: ["PUBLISHED", "APPROVED"] },
    },
    include: {
      exam: {
        include: {
          grade: true,
          examType: true,
        },
      },
      student: {
        include: {
          class: true,
        },
      },
      subjects: {
        include: {
          subject: true,
        },
      },
    },
    orderBy: [
      { exam: { year: "desc" } },
      { exam: { term: "desc" } },
    ],
  });

  console.log('Exam Summaries found:', examSummaries.length);
  console.log('Exam Results found:', examResults.length);
  console.log('Report Cards found:', reportCards.length);
  
  // Serialize data to avoid issues with Date objects
  const serializedSummaries = JSON.parse(JSON.stringify(examSummaries));
  const serializedResults = JSON.parse(JSON.stringify(examResults));
  const serializedReportCards = JSON.parse(JSON.stringify(reportCards));
  const serializedStats = Array.from(statsMap.entries()).reduce((acc, [key, value]) => {
    acc[key] = value;
    return acc;
  }, {} as Record<string, any>);

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {user.role === "student" ? "My Exam Results" : "Children's Exam Results"}
          </h1>
          <p className="text-gray-600 mt-1">
            View exam results, summaries, and report cards
          </p>
        </div>
      </div>

      <StudentExamResultsClient 
        examSummaries={serializedSummaries}
        examResults={serializedResults}
        reportCards={serializedReportCards}
        userRole={user.role}
        subjectStats={serializedStats}
      />
    </div>
  );
};

export default StudentExamResultsPage;
