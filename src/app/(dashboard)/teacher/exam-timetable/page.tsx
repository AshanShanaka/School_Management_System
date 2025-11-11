import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import ExamTimetableTable from "@/components/ExamTimetableTable";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

const TeacherExamTimetablePage = async () => {
  const user = await getCurrentUser();
  
  if (!user || user.role !== "teacher") {
    redirect("/");
  }

  // Get teacher's lessons to find which grades they teach
  const teacher = await prisma.teacher.findUnique({
    where: { id: user.id },
    include: {
      lessons: {
        include: {
          class: {
            include: {
              grade: true
            }
          }
        }
      }
    }
  });

  // Get unique grade IDs
  const gradeIds = teacher?.lessons 
    ? Array.from(new Set(teacher.lessons.map(lesson => lesson.class.gradeId)))
    : [];

  // Fetch published exams for these grades
  const exams = await prisma.exam.findMany({
    where: {
      gradeId: { in: gradeIds },
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
          <h1 className="text-2xl font-bold text-gray-800">Exam Timetable</h1>
          <p className="text-gray-600 mt-1">View exam schedules for your classes</p>
        </div>
        <Link href="/list/exams">
          <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2">
            <Image src="/view.png" alt="View" width={16} height={16} />
            View All Exams
          </button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total Exams</p>
              <p className="text-3xl font-bold mt-1">{exams.length}</p>
            </div>
            <div className="bg-white bg-opacity-20 p-3 rounded-lg">
              <Image src="/exam.png" alt="Exams" width={24} height={24} className="filter invert" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 p-4 rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Grades Teaching</p>
              <p className="text-3xl font-bold mt-1">{gradeIds.length}</p>
            </div>
            <div className="bg-white bg-opacity-20 p-3 rounded-lg">
              <Image src="/class.png" alt="Grades" width={24} height={24} className="filter invert" />
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
      </div>

      {/* Exam Timetables */}
      <ExamTimetableTable 
        exams={exams} 
        userRole="teacher"
        showGrade={true}
      />
    </div>
  );
};

export default TeacherExamTimetablePage;
