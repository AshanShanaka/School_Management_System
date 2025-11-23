import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import PreviousRecordsClient from "@/components/PreviousRecordsClient";

interface PageProps {
  params: {
    classId: string;
  };
}

const TeacherClassPreviousRecordsPage = async ({ params }: PageProps) => {
  const user = await getCurrentUser();
  
  if (!user || user.role !== "teacher") {
    redirect("/sign-in");
  }

  const classId = parseInt(params.classId);

  // Verify teacher is the class teacher for this class
  const classTeacher = await prisma.classTeacher.findFirst({
    where: {
      teacherId: user.id,
      classId: classId,
    },
    include: {
      class: {
        include: {
          grade: true,
        },
      },
    },
  });

  if (!classTeacher) {
    redirect("/teacher/previous-records");
  }

  const classData = classTeacher.class;

  // Get students in the class
  const students = await prisma.student.findMany({
    where: { classId: classId },
    orderBy: [
      { name: "asc" },
      { surname: "asc" },
    ],
  });

  const studentIds = students.map(s => s.id);

  // Get all exam results (only Grade 9 and 10)
  const examResults = await prisma.examResult.findMany({
    where: {
      studentId: { in: studentIds },
      exam: {
        grade: {
          level: {
            in: [9, 10], // Only show Grade 9 and 10 historical records
          },
        },
      },
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
      student: true,
    },
    orderBy: [
      { exam: { year: "desc" } },
      { exam: { term: "desc" } },
      { student: { name: "asc" } },
      { examSubject: { subject: { name: "asc" } } },
    ],
  });

  // Get exam summaries (only Grade 9 and 10)
  const examSummaries = await prisma.examSummary.findMany({
    where: {
      studentId: { in: studentIds },
      exam: {
        grade: {
          level: {
            in: [9, 10], // Only show Grade 9 and 10 historical records
          },
        },
      },
    },
    include: {
      exam: {
        include: {
          grade: true,
          examType: true,
        },
      },
      student: true,
    },
    orderBy: [
      { exam: { year: "desc" } },
      { exam: { term: "desc" } },
      { student: { name: "asc" } },
    ],
  });

  // Calculate subject-level statistics
  const subjectStats = await Promise.all(
    examResults.map(async (result) => {
      const classResults = await prisma.examResult.findMany({
        where: {
          examId: result.examId,
          examSubjectId: result.examSubjectId,
          student: {
            classId: classData.id,
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

      const totalMarks = classResults.reduce((sum, r) => sum + r.marks, 0);
      const classAverage = classResults.length > 0 ? totalMarks / classResults.length : 0;
      const rank = classResults.findIndex(r => r.studentId === result.studentId) + 1;

      return {
        resultId: result.id,
        classAverage: Number(classAverage.toFixed(2)),
        rank,
        classSize: classResults.length,
      };
    })
  );

  const statsMap = new Map(subjectStats.map(s => [s.resultId, s]));

  // Serialize data
  const serializedResults = JSON.parse(JSON.stringify(examResults));
  const serializedSummaries = JSON.parse(JSON.stringify(examSummaries));
  const serializedStats = Array.from(statsMap.entries()).reduce((acc, [key, value]) => {
    acc[key] = value;
    return acc;
  }, {} as Record<string, any>);

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link
              href="/teacher/previous-records"
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            Previous Records - {classData.name}
          </h1>
          <p className="text-gray-600 mt-1">
            Grade {classData.grade.level} • {students.length} Students • Historical Records (Grade 9 & 10 only)
          </p>
        </div>
        <Link
          href="/teacher/historical-marks-import"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <span>📤</span>
          Import More Records
        </Link>
      </div>

      {/* Results Display */}
      {examResults.length > 0 ? (
        <PreviousRecordsClient
          examSummaries={serializedSummaries}
          examResults={serializedResults}
          subjectStats={serializedStats}
          students={JSON.parse(JSON.stringify(students))}
        />
      ) : (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="w-20 h-20 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-xl font-medium text-gray-500 mb-2">No Records Available</h3>
          <p className="text-gray-400 text-center max-w-md mb-4">
            No previous records have been imported for this class yet.
          </p>
          <Link
            href="/teacher/historical-marks-import"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <span>📤</span>
            Import Historical Marks
          </Link>
        </div>
      )}
    </div>
  );
};

export default TeacherClassPreviousRecordsPage;
