import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import ExamTimetableTable from "@/components/ExamTimetableTable";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

const ParentExamTimetablePage = async () => {
  const user = await getCurrentUser();
  
  if (!user || user.role !== "parent") {
    redirect("/");
  }

  // Get parent's children and their grades
  const parent = await prisma.parent.findUnique({
    where: { id: user.id },
    include: {
      students: {
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

  if (!parent?.students || parent.students.length === 0) {
    return (
      <div className="bg-white p-8 rounded-md flex-1 m-4 mt-0">
        <div className="flex flex-col items-center justify-center h-64">
          <Image src="/student.png" alt="No children" width={64} height={64} className="opacity-50" />
          <h3 className="text-lg font-semibold text-gray-700 mt-4">No Children Registered</h3>
          <p className="text-gray-500 mt-2">Please contact your administrator to link your children to your account.</p>
        </div>
      </div>
    );
  }

  // Get unique grade IDs from all children
  const gradeIds = Array.from(
    new Set(
      parent.students
        .filter(student => student.class?.gradeId)
        .map(student => student.class.gradeId)
    )
  ) as number[];

  if (gradeIds.length === 0) {
    return (
      <div className="bg-white p-8 rounded-md flex-1 m-4 mt-0">
        <div className="flex flex-col items-center justify-center h-64">
          <Image src="/class.png" alt="No class" width={64} height={64} className="opacity-50" />
          <h3 className="text-lg font-semibold text-gray-700 mt-4">Children Not Assigned to Classes</h3>
          <p className="text-gray-500 mt-2">Please contact your administrator to assign your children to classes.</p>
        </div>
      </div>
    );
  }

  // Fetch published exams for all children's grades
  const exams = await prisma.exam.findMany({
    where: {
      gradeId: {
        in: gradeIds
      },
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

  // Group children by grade
  type StudentWithClass = typeof parent.students[number];
  const childrenByGrade = parent.students.reduce((acc, student) => {
    if (student.class?.grade) {
      const gradeLevel = student.class.grade.level;
      if (!acc[gradeLevel]) {
        acc[gradeLevel] = [];
      }
      acc[gradeLevel].push(student);
    }
    return acc;
  }, {} as Record<number, StudentWithClass[]>);

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Children's Exam Timetable</h1>
          <p className="text-gray-600 mt-1">
            Viewing exams for {parent.students.length} {parent.students.length === 1 ? 'child' : 'children'} 
            {" "}across {gradeIds.length} {gradeIds.length === 1 ? 'grade' : 'grades'}
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-4 rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Children</p>
              <p className="text-3xl font-bold mt-1">{parent.students.length}</p>
            </div>
            <div className="bg-white bg-opacity-20 p-3 rounded-lg">
              <Image src="/student.png" alt="Children" width={24} height={24} className="filter invert" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 p-4 rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Grades</p>
              <p className="text-3xl font-bold mt-1">{gradeIds.length}</p>
            </div>
            <div className="bg-white bg-opacity-20 p-3 rounded-lg">
              <Image src="/class.png" alt="Grades" width={24} height={24} className="filter invert" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-4 rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">Total Subjects</p>
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

      {/* Children Overview */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="text-sm font-semibold text-blue-900 mb-3 flex items-center gap-2">
          <Image src="/student.png" alt="Children" width={18} height={18} />
          Your Children
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {Object.entries(childrenByGrade).map(([gradeLevel, students]) => {
            const studentList = students as StudentWithClass[];
            return (
              <div key={gradeLevel} className="bg-white rounded-md p-3 border border-blue-100">
                <p className="text-xs font-semibold text-gray-600 mb-2">Grade {gradeLevel}</p>
                <div className="space-y-1">
                  {studentList.map((student) => (
                    <div key={student.id} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                      <p className="text-sm text-gray-700">
                        {student.name} {student.surname} 
                        <span className="text-xs text-gray-500 ml-1">({student.class?.name})</span>
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Important Notice */}
      {exams.length > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex items-start">
            <Image src="/announcement.png" alt="Notice" width={20} height={20} className="mt-0.5" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Parent Reminder</h3>
              <p className="text-sm text-yellow-700 mt-1">
                Please ensure your children are aware of their exam schedules and help them prepare accordingly. 
                Ensure they arrive at school 15 minutes before each exam starts.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Exam Timetables */}
      <ExamTimetableTable 
        exams={exams} 
        userRole="parent"
        showGrade={true}
      />
    </div>
  );
};

export default ParentExamTimetablePage;
