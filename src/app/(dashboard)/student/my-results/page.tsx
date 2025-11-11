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
          user: true,
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
          teacher: {
            include: {
              user: true,
            },
          },
        },
      },
      student: {
        include: {
          user: true,
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
          user: true,
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
        examSummaries={examSummaries}
        examResults={examResults}
        reportCards={reportCards}
        userRole={user.role}
      />
    </div>
  );
};

export default StudentExamResultsPage;
