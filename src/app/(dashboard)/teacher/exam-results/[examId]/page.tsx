import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import ExamResultsClient from "@/components/ExamResultsClient";

const TeacherExamResultsPage = async ({
  params,
}: {
  params: { examId: string };
}) => {
  const user = await getCurrentUser();
  
  if (!user || user.role !== "teacher") {
    redirect("/sign-in");
  }

  const examId = parseInt(params.examId);

  // Get exam details with results
  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    include: {
      grade: true,
      examType: true,
      examSubjects: {
        where: {
          teacherId: user.id,
        },
        include: {
          subject: true,
          teacher: true,
          subjectResults: {
            include: {
              student: {
                include: {
                  user: true,
                  class: true,
                },
              },
            },
            orderBy: {
              marks: "desc",
            },
          },
        },
      },
      examSummaries: {
        include: {
          student: {
            include: {
              user: true,
              class: true,
            },
          },
        },
        orderBy: {
          percentage: "desc",
        },
      },
    },
  });

  if (!exam) {
    redirect("/list/exams");
  }

  // Get all classes for this grade
  const classes = await prisma.class.findMany({
    where: {
      gradeId: exam.gradeId,
    },
    include: {
      grade: true,
    },
  });

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Exam Results</h1>
          <p className="text-gray-600 mt-1">
            {exam.title} - Grade {exam.grade.level} - {exam.examType.name}
          </p>
        </div>
      </div>

      <ExamResultsClient 
        exam={exam} 
        classes={classes} 
        teacherSubjects={exam.examSubjects}
        teacherId={user.id}
      />
    </div>
  );
};

export default TeacherExamResultsPage;
