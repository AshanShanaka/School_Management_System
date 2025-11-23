import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import Link from "next/link";
import { ExamStatus } from "@prisma/client";
import ExamActions from "@/components/ExamActions";

const ExamListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const user = await getCurrentUser();
  const role = user?.role;

  // Build query based on role
  const query: any = {
    grade: {
      level: {
        notIn: [9, 10], // Exclude historical exams
      },
    },
  };

  // Filter based on user role
  if (role === "student") {
    const student = await prisma.student.findUnique({
      where: { id: user?.id },
      include: { class: { include: { grade: true } } },
    });
    if (student?.class?.gradeId) {
      query.gradeId = student.class.gradeId;
      query.status = "PUBLISHED";
    }
  } else if (role === "parent") {
    const parent = await prisma.parent.findUnique({
      where: { id: user?.id },
      include: {
        students: {
          include: { class: { include: { grade: true } } },
        },
      },
    });
    if (parent?.students && parent.students.length > 0) {
      const gradeIds = parent.students
        .map((student) => student.class?.gradeId)
        .filter((id) => id !== undefined);
      if (gradeIds.length > 0) {
        query.gradeId = { in: gradeIds };
        query.status = "PUBLISHED";
      }
    }
  } else if (role === "teacher") {
    const teacher = await prisma.teacher.findUnique({
      where: { id: user?.id },
      include: {
        lessons: {
          include: {
            class: {
              include: {
                grade: true,
              },
            },
          },
        },
      },
    });

    if (teacher?.lessons && teacher.lessons.length > 0) {
      const gradeIds = teacher.lessons
        .map((lesson) => lesson.class.gradeId)
        .filter((id, index, self) => self.indexOf(id) === index);
      if (gradeIds.length > 0) {
        query.gradeId = { in: gradeIds };
      }
    }
  }

  // Get all exams with related data
  const exams = await prisma.exam.findMany({
    where: query,
    include: {
      grade: true,
      examType: true,
      examSubjects: {
        include: {
          subject: true,
          teacher: true,
        },
      },
      _count: {
        select: {
          results: true,
        },
      },
    },
    orderBy: [
      { year: "desc" },
      { term: "desc" },
      { createdAt: "desc" },
    ],
  });

  // Calculate statistics
  const stats = {
    total: exams.length,
    draft: exams.filter((e) => e.status === "DRAFT").length,
    published: exams.filter((e) => e.status === "PUBLISHED").length,
    ongoing: exams.filter((e) => e.status === "ONGOING").length,
    completed: exams.filter((e) => e.status === "COMPLETED").length,
  };

  // Group by status for cards
  const examsByStatus = {
    DRAFT: exams.filter((e) => e.status === "DRAFT"),
    PUBLISHED: exams.filter((e) => e.status === "PUBLISHED"),
    ONGOING: exams.filter((e) => e.status === "ONGOING"),
    COMPLETED: exams.filter((e) => e.status === "COMPLETED"),
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "DRAFT":
        return { 
          bg: "from-gray-100/80 to-gray-200/60", 
          border: "gray-300/50", 
          text: "gray-800", 
          icon: "📝",
          iconBg: "bg-gray-500"
        };
      case "PUBLISHED":
        return { 
          bg: "from-blue-100/80 to-blue-200/60", 
          border: "blue-300/50", 
          text: "blue-800", 
          icon: "📢",
          iconBg: "bg-blue-500"
        };
      case "ONGOING":
        return { 
          bg: "from-yellow-100/80 to-yellow-200/60", 
          border: "yellow-300/50", 
          text: "yellow-800", 
          icon: "⏳",
          iconBg: "bg-yellow-500"
        };
      case "COMPLETED":
        return { 
          bg: "from-green-100/80 to-green-200/60", 
          border: "green-300/50", 
          text: "green-800", 
          icon: "✅",
          iconBg: "bg-green-500"
        };
      default:
        return { 
          bg: "from-gray-100/80 to-gray-200/60", 
          border: "gray-300/50", 
          text: "gray-800", 
          icon: "📋",
          iconBg: "bg-gray-500"
        };
    }
  };

  const getExamTypeColor = (examType: string) => {
    switch (examType) {
      case "TERM_TEST":
        return "bg-blue-100/80 text-blue-800 border-blue-200";
      case "MONTHLY_TEST":
        return "bg-green-100/80 text-green-800 border-green-200";
      case "UNIT_TEST":
        return "bg-purple-100/80 text-purple-800 border-purple-200";
      case "FINAL_EXAM":
        return "bg-red-100/80 text-red-800 border-red-200";
      case "TRIAL_OL":
        return "bg-orange-100/80 text-orange-800 border-orange-200";
      case "NATIONAL_OL":
        return "bg-red-200/80 text-red-900 border-red-300";
      default:
        return "bg-gray-100/80 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/50 via-white to-indigo-50/50 p-6">
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* Header Section - Eye-friendly Glass Morphism */}
        <div className="relative bg-white/40 backdrop-blur-xl rounded-3xl shadow-xl border border-white/60 p-8 overflow-hidden">
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-100/30 via-indigo-100/20 to-purple-100/30 pointer-events-none"></div>

          {/* Content */}
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-4xl font-bold mb-2 flex items-center gap-3 bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-600 bg-clip-text text-transparent">
                  <span className="text-5xl">📚</span>
                  Examination Management
                </h1>
                <p className="text-gray-700 text-lg font-medium">
                  Comprehensive exam tracking and analytics
                </p>
              </div>
              {role === "admin" && (
                <Link
                  href="/list/exams/create"
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-6 py-3 rounded-xl flex items-center gap-2 font-semibold shadow-lg transition-all"
                >
                  <span className="text-xl">➕</span>
                  Create New Exam
                </Link>
              )}
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-5 gap-4">
              <div className="bg-white/50 backdrop-blur-md rounded-2xl p-5 border-2 border-indigo-200/50 shadow-md hover:shadow-lg transition-all">
                <div className="text-sm font-semibold text-indigo-700 mb-1">Total Exams</div>
                <div className="text-3xl font-bold text-indigo-900">{stats.total}</div>
                <div className="mt-2 h-1 w-12 bg-gradient-to-r from-indigo-400 to-indigo-600 rounded-full"></div>
              </div>
              <div className="bg-white/50 backdrop-blur-md rounded-2xl p-5 border-2 border-gray-200/50 shadow-md hover:shadow-lg transition-all">
                <div className="text-sm font-semibold text-gray-700 mb-1">Draft</div>
                <div className="text-3xl font-bold text-gray-900">{stats.draft}</div>
                <div className="mt-2 h-1 w-12 bg-gradient-to-r from-gray-400 to-gray-600 rounded-full"></div>
              </div>
              <div className="bg-white/50 backdrop-blur-md rounded-2xl p-5 border-2 border-blue-200/50 shadow-md hover:shadow-lg transition-all">
                <div className="text-sm font-semibold text-blue-700 mb-1">Published</div>
                <div className="text-3xl font-bold text-blue-900">{stats.published}</div>
                <div className="mt-2 h-1 w-12 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full"></div>
              </div>
              <div className="bg-white/50 backdrop-blur-md rounded-2xl p-5 border-2 border-yellow-200/50 shadow-md hover:shadow-lg transition-all">
                <div className="text-sm font-semibold text-yellow-700 mb-1">Ongoing</div>
                <div className="text-3xl font-bold text-yellow-900">{stats.ongoing}</div>
                <div className="mt-2 h-1 w-12 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full"></div>
              </div>
              <div className="bg-white/50 backdrop-blur-md rounded-2xl p-5 border-2 border-green-200/50 shadow-md hover:shadow-lg transition-all">
                <div className="text-sm font-semibold text-green-700 mb-1">Completed</div>
                <div className="text-3xl font-bold text-green-900">{stats.completed}</div>
                <div className="mt-2 h-1 w-12 bg-gradient-to-r from-green-400 to-green-600 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Exams by Status */}
        {Object.entries(examsByStatus).map(([status, statusExams]) => {
          if (statusExams.length === 0) return null;
          const colors = getStatusColor(status);

          return (
            <div key={status} className="bg-white/50 backdrop-blur-xl rounded-3xl shadow-lg p-6 border-2 border-indigo-200/50">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-12 h-12 ${colors.iconBg} rounded-xl flex items-center justify-center shadow-md`}>
                  <span className="text-2xl">{colors.icon}</span>
                </div>
                <h2 className={`text-2xl font-bold text-${colors.text}`}>
                  {status.charAt(0) + status.slice(1).toLowerCase().replace('_', ' ')} Exams
                </h2>
                <span className={`ml-auto text-lg font-bold text-${colors.text} bg-white/60 px-4 py-1 rounded-full`}>
                  {statusExams.length}
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {statusExams.map((exam) => (
                  <div
                    key={exam.id}
                    className={`bg-gradient-to-br ${colors.bg} backdrop-blur-lg rounded-2xl p-5 border-2 border-${colors.border} hover:shadow-xl transition-all group`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className={`text-lg font-bold text-${colors.text} mb-1 group-hover:text-indigo-700 transition-colors`}>
                          {exam.title}
                        </h3>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-xs px-3 py-1 rounded-full border ${getExamTypeColor(exam.examTypeEnum)} font-semibold`}>
                            {exam.examTypeEnum.replace("_", " ")}
                          </span>
                          <span className="text-xs font-semibold text-gray-600">
                            Grade {exam.grade.level}
                          </span>
                          <span className="text-xs text-gray-600">
                            • {exam.year} • Term {exam.term}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <div className="w-6 h-6 bg-purple-500 rounded-lg flex items-center justify-center">
                          <span className="text-xs">📖</span>
                        </div>
                        <span className="font-semibold">Subjects:</span>
                        <span className="font-bold">{exam.examSubjects.length}</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {exam.examSubjects.slice(0, 3).map((examSubject, index) => (
                          <span
                            key={index}
                            className="text-xs bg-white/70 backdrop-blur-sm px-2 py-1 rounded-lg border border-gray-200 font-medium"
                          >
                            {examSubject.subject.name}
                          </span>
                        ))}
                        {exam.examSubjects.length > 3 && (
                          <span className="text-xs text-gray-600 px-2 py-1">
                            +{exam.examSubjects.length - 3} more
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <div className="w-6 h-6 bg-blue-500 rounded-lg flex items-center justify-center">
                          <span className="text-xs">👥</span>
                        </div>
                        <span className="font-semibold">Students:</span>
                        <span className="font-bold">{exam._count.results}</span>
                      </div>
                    </div>

                    <ExamActions examId={exam.id} role={role || "student"} />
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {exams.length === 0 && (
          <div className="bg-white/50 backdrop-blur-xl rounded-3xl shadow-lg p-12 border-2 border-indigo-200/50 text-center">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">No Exams Found</h3>
            <p className="text-gray-600">
              {role === "admin"
                ? "Create your first exam to get started"
                : "No exams have been scheduled yet"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExamListPage;
