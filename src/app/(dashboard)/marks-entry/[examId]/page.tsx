import { getCurrentUser } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import MarksEntryForm from "@/components/MarksEntryForm";
import Link from "next/link";
import Image from "next/image";

interface MarksEntryPageProps {
  params: {
    examId: string;
  };
  searchParams: {
    subjectId?: string;
    classId?: string;
  };
}

const MarksEntryPage = async ({ params, searchParams }: MarksEntryPageProps) => {
  const user = await getCurrentUser();
  const examId = parseInt(params.examId);
  const subjectId = parseInt(searchParams.subjectId || "0");
  const classId = parseInt(searchParams.classId || "0");

  if (!user || user.role !== "teacher") {
    return notFound();
  }

  if (isNaN(examId) || isNaN(subjectId) || isNaN(classId)) {
    return notFound();
  }

  // Verify teacher has permission to enter marks for this subject/class
  const assignment = await prisma.subjectAssignment.findFirst({
    where: {
      teacherId: user.id,
      subjectId: subjectId,
      classId: classId,
    },
    include: {
      subject: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
      class: {
        select: {
          id: true,
          name: true,
          grade: {
            select: {
              level: true,
            },
          },
        },
      },
    },
  });

  if (!assignment) {
    return notFound();
  }

  // Get exam details
  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    select: {
      id: true,
      title: true,
      year: true,
      term: true,
      status: true,
      examTypeEnum: true,
      marksEntryDeadline: true,
    },
  });

  if (!exam) {
    return notFound();
  }

  // Check if marks entry is allowed
  if (!["MARKS_ENTRY", "CLASS_REVIEW"].includes(exam.status)) {
    redirect(`/exam-timetable/${examId}?error=marks-entry-not-allowed`);
  }

  // Get exam subject details
  const examSubject = await prisma.examSubject.findFirst({
    where: {
      examId: examId,
      subjectId: subjectId,
    },
    select: {
      id: true,
      maxMarks: true,
      marksEntered: true,
      marksEnteredAt: true,
      marksEnteredBy: true,
    },
  });

  if (!examSubject) {
    return notFound();
  }

  // Get students in the class
  const students = await prisma.student.findMany({
    where: {
      classId: classId,
    },
    select: {
      id: true,
      name: true,
      surname: true,
      username: true,
      admissionNumber: true,
    },
    orderBy: [
      { surname: "asc" },
      { name: "asc" },
    ],
  });

  // Get existing results if any
  const existingResults = await prisma.examResult.findMany({
    where: {
      examId: examId,
      subjectId: subjectId,
      student: {
        classId: classId,
      },
    },
    select: {
      id: true,
      studentId: true,
      marks: true,
      grade: true,
    },
  });

  const resultsMap = existingResults.reduce((acc, result) => {
    acc[result.studentId] = result;
    return acc;
  }, {} as Record<string, typeof existingResults[0]>);

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link 
            href={`/exam-timetable/${examId}`}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <span>←</span>
            <span className="text-sm">Back to Exam Timetable</span>
          </Link>
        </div>
        
        <div className="text-right">
          <h1 className="text-xl font-bold text-gray-900">Marks Entry</h1>
          <p className="text-sm text-gray-600">
            {exam.title} - {exam.year} Term {exam.term}
          </p>
        </div>
      </div>

      {/* Exam Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">Subject Details</h3>
          <div className="space-y-1 text-sm">
            <p><span className="font-medium">Subject:</span> {assignment.subject.name}</p>
            <p><span className="font-medium">Code:</span> {assignment.subject.code}</p>
            <p><span className="font-medium">Class:</span> Grade {assignment.class.grade.level} - {assignment.class.name}</p>
          </div>
        </div>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="font-semibold text-green-900 mb-2">Exam Details</h3>
          <div className="space-y-1 text-sm">
            <p><span className="font-medium">Type:</span> {exam.examTypeEnum}</p>
            <p><span className="font-medium">Max Marks:</span> {examSubject.maxMarks}</p>
            <p><span className="font-medium">Status:</span> 
              <span className={`ml-1 px-2 py-1 rounded-full text-xs ${
                exam.status === "MARKS_ENTRY" ? "bg-yellow-100 text-yellow-800" : "bg-orange-100 text-orange-800"
              }`}>
                {exam.status.replace("_", " ")}
              </span>
            </p>
          </div>
        </div>
        
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h3 className="font-semibold text-purple-900 mb-2">Progress</h3>
          <div className="space-y-1 text-sm">
            <p><span className="font-medium">Students:</span> {students.length}</p>
            <p><span className="font-medium">Results Entered:</span> {existingResults.length}</p>
            {examSubject.marksEntered && (
              <p className="text-green-600">
                <span className="font-medium">✓ Marks Submitted</span>
              </p>
            )}
            {exam.marksEntryDeadline && (
              <p><span className="font-medium">Deadline:</span> {new Date(exam.marksEntryDeadline).toLocaleDateString()}</p>
            )}
          </div>
        </div>
      </div>

      {/* Marks Entry Form */}
      <div className="bg-gray-50 rounded-lg p-6">
        <MarksEntryForm 
          examId={examId}
          subjectId={subjectId}
          classId={classId}
          students={students}
          existingResults={resultsMap}
          maxMarks={examSubject.maxMarks}
          marksEntered={examSubject.marksEntered}
        />
      </div>
    </div>
  );
};

export default MarksEntryPage;
