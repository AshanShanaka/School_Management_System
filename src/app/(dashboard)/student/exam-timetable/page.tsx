import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import ExamTimetableTable from "@/components/ExamTimetableTable";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

const StudentExamTimetablePage = async () => {
  const user = await getCurrentUser();
  
  if (!user || user.role !== "student") {
    redirect("/");
  }

  // Get student's grade
  const student = await prisma.student.findUnique({
    where: { id: user.id },
    include: {
      class: {
        include: {
          grade: true
        }
      }
    }
  });

  if (!student?.class) {
    return (
      <div className="bg-white p-8 rounded-md flex-1 m-4 mt-0">
        <div className="flex flex-col items-center justify-center h-64">
          <Image src="/class.png" alt="No class" width={64} height={64} className="opacity-50" />
          <h3 className="text-lg font-semibold text-gray-700 mt-4">Not Assigned to a Class</h3>
          <p className="text-gray-500 mt-2">Please contact your administrator to be assigned to a class.</p>
        </div>
      </div>
    );
  }

  // Fetch published exams for student's grade
  const exams = await prisma.exam.findMany({
    where: {
      gradeId: student.class.gradeId,
      status: "PUBLISHED",
    },
    include: {
      grade: true,
      examSubjects: {
        include: {
          subject: true,
          teacher: {
            select: {
              id: true,
              name: true,
              surname: true
            }
          }
        },
        orderBy: {
          examDate: 'asc'
        }
      }
    },
    orderBy: [
      { year: 'desc' },
      { term: 'desc' }
    ]
  });

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">My Exam Timetable</h1>
          <p className="text-gray-600 mt-1">
            Grade {student.class.grade.level} - {student.class.name}
          </p>
        </div>
        <Link href="/list/exams">
          <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2">
            <Image src="/view.png" alt="View" width={16} height={16} />
            View Exam Details
          </button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Upcoming Exams</p>
              <p className="text-3xl font-bold mt-1">{exams.length}</p>
            </div>
            <div className="bg-white bg-opacity-20 p-3 rounded-lg">
              <Image src="/exam.png" alt="Exams" width={24} height={24} className="filter invert" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-4 rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Total Subjects</p>
              <p className="text-3xl font-bold mt-1">
                {exams.reduce((sum, exam) => sum + exam.examSubjects.length, 0)}
              </p>
            </div>
            <div className="bg-white bg-opacity-20 p-3 rounded-lg">
              <Image src="/subject.png" alt="Subjects" width={24} height={24} className="filter invert" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 p-4 rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">My Grade</p>
              <p className="text-3xl font-bold mt-1">{student.class.grade.level}</p>
            </div>
            <div className="bg-white bg-opacity-20 p-3 rounded-lg">
              <Image src="/class.png" alt="Grade" width={24} height={24} className="filter invert" />
            </div>
          </div>
        </div>
      </div>

      {/* Important Notice */}
      {exams.length > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex items-start">
            <Image src="/announcement.png" alt="Notice" width={20} height={20} className="mt-0.5" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Exam Preparation Reminder</h3>
              <p className="text-sm text-yellow-700 mt-1">
                Please review the exam schedule carefully and prepare accordingly. Arrive 15 minutes before the exam starts.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Exam Timetables */}
      <ExamTimetableTable 
        exams={exams} 
        userRole="student"
        showGrade={false}
      />
    </div>
  );
};

export default StudentExamTimetablePage;
