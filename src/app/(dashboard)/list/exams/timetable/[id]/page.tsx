import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

const ExamTimetableDetailPage = async ({
  params,
}: {
  params: { id: string };
}) => {
  const user = await getCurrentUser();
  const role = user?.role;

  if (!user) {
    redirect("/login");
  }

  // Fetch the specific exam with all details
  const exam = await prisma.exam.findUnique({
    where: { id: parseInt(params.id) },
    include: {
      grade: true,
      examSubjects: {
        include: {
          subject: true,
          teacher: {
            select: {
              id: true,
              name: true,
              surname: true,
            },
          },
        },
        orderBy: {
          examDate: "asc",
        },
      },
    },
  });

  if (!exam) {
    return (
      <div className="bg-white p-8 rounded-md flex-1 m-4 mt-0">
        <div className="flex flex-col items-center justify-center h-64">
          <Image src="/exam.png" alt="Not found" width={64} height={64} className="opacity-50" />
          <h3 className="text-lg font-semibold text-gray-700 mt-4">Exam Not Found</h3>
          <p className="text-gray-500 mt-2">The requested exam does not exist.</p>
          <Link href="/list/exams">
            <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
              Back to Exams
            </button>
          </Link>
        </div>
      </div>
    );
  }

  // Check permissions
  if (role === "student") {
    if (exam.status !== "PUBLISHED") {
      redirect("/list/exams");
    }
    const student = await prisma.student.findUnique({
      where: { id: user.id },
      include: { class: true },
    });
    if (student?.class?.gradeId !== exam.gradeId) {
      redirect("/list/exams");
    }
  } else if (role === "parent") {
    if (exam.status !== "PUBLISHED") {
      redirect("/list/exams");
    }
    const parent = await prisma.parent.findUnique({
      where: { id: user.id },
      include: {
        students: {
          include: { class: true },
        },
      },
    });
    const childGradeIds = parent?.students.map((s) => s.class?.gradeId) || [];
    if (!childGradeIds.includes(exam.gradeId)) {
      redirect("/list/exams");
    }
  }

  // Helper functions for formatting
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (timeString: string | null) => {
    if (!timeString) return "N/A";
    const [hours, minutes] = timeString.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const calculateDuration = (startTime: string | null, endTime: string | null) => {
    if (!startTime || !endTime) return "N/A";
    const [startHour, startMin] = startTime.split(":").map(Number);
    const [endHour, endMin] = endTime.split(":").map(Number);
    const totalMinutes = endHour * 60 + endMin - (startHour * 60 + startMin);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h`;
    return `${minutes}m`;
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string; label: string }> = {
      PUBLISHED: { bg: "bg-green-100", text: "text-green-800", label: "Published" },
      DRAFT: { bg: "bg-yellow-100", text: "text-yellow-800", label: "Draft" },
      ONGOING: { bg: "bg-blue-100", text: "text-blue-800", label: "Ongoing" },
      COMPLETED: { bg: "bg-purple-100", text: "text-purple-800", label: "Completed" },
      CANCELLED: { bg: "bg-red-100", text: "text-red-800", label: "Cancelled" },
    };
    const badge = badges[status] || badges.DRAFT;
    return (
      <span className={`${badge.bg} ${badge.text} px-3 py-1 rounded-full text-sm font-semibold`}>
        {badge.label}
      </span>
    );
  };

  const getDayBadge = (dateString: string) => {
    const date = new Date(dateString);
    const dayName = date.toLocaleDateString("en-US", { weekday: "long" });
    const dayColors: Record<string, string> = {
      Monday: "bg-blue-100 text-blue-800",
      Tuesday: "bg-green-100 text-green-800",
      Wednesday: "bg-purple-100 text-purple-800",
      Thursday: "bg-orange-100 text-orange-800",
      Friday: "bg-pink-100 text-pink-800",
      Saturday: "bg-indigo-100 text-indigo-800",
      Sunday: "bg-teal-100 text-teal-800",
    };
    return (
      <span className={`${dayColors[dayName] || "bg-gray-100 text-gray-800"} px-2 py-1 rounded text-xs font-medium`}>
        {dayName}
      </span>
    );
  };

  // Calculate exam period
  const examDates = exam.examSubjects.map((es) => new Date(es.examDate));
  const startDate = examDates.length > 0 ? new Date(Math.min(...examDates.map((d) => d.getTime()))) : null;
  const endDate = examDates.length > 0 ? new Date(Math.max(...examDates.map((d) => d.getTime()))) : null;

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/list/exams">
            <button className="p-2 rounded-full hover:bg-gray-100">
              <Image src="/back.png" alt="Back" width={20} height={20} />
            </button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Exam Timetable</h1>
            <p className="text-gray-600 text-sm mt-1">Detailed exam schedule and information</p>
          </div>
        </div>
        <Link href="/list/exams">
          <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md flex items-center gap-2">
            <Image src="/exam.png" alt="" width={16} height={16} />
            Back to Exams
          </button>
        </Link>
      </div>

      {/* Exam Header Card */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 mb-6 border border-blue-200">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <h2 className="text-2xl font-bold text-gray-800">{exam.title}</h2>
              {getStatusBadge(exam.status)}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-600 font-medium">Grade</p>
                <p className="text-lg font-semibold text-gray-800">Grade {exam.grade.level}</p>
              </div>
              <div>
                <p className="text-gray-600 font-medium">Year</p>
                <p className="text-lg font-semibold text-gray-800">{exam.year}</p>
              </div>
              <div>
                <p className="text-gray-600 font-medium">Term</p>
                <p className="text-lg font-semibold text-gray-800">Term {exam.term}</p>
              </div>
              <div>
                <p className="text-gray-600 font-medium">Total Subjects</p>
                <p className="text-lg font-semibold text-gray-800">{exam.examSubjects.length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Exam Period Info */}
      {startDate && endDate && (
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
          <div className="flex items-center gap-2">
            <Image src="/calendar.png" alt="Period" width={20} height={20} />
            <div>
              <p className="text-sm font-semibold text-blue-900">Exam Period</p>
              <p className="text-sm text-blue-800">
                {formatDate(startDate.toISOString())} - {formatDate(endDate.toISOString())}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Timetable Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  #
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Subject
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Day
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Time
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Duration
                </th>
                {(role === "admin" || role === "teacher") && (
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Invigilator
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {exam.examSubjects.map((examSubject, index) => (
                <tr key={examSubject.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-4 text-sm text-gray-600">{index + 1}</td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <Image src="/subject.png" alt="" width={16} height={16} />
                      </div>
                      <span className="font-semibold text-gray-800">{examSubject.subject.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-700">{formatDate(examSubject.examDate)}</td>
                  <td className="px-4 py-4">{getDayBadge(examSubject.examDate)}</td>
                  <td className="px-4 py-4 text-sm">
                    <div className="flex items-center gap-1 text-gray-700">
                      <Image src="/date.png" alt="" width={14} height={14} />
                      {formatTime(examSubject.startTime)} - {formatTime(examSubject.endTime)}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                      {calculateDuration(examSubject.startTime, examSubject.endTime)}
                    </span>
                  </td>
                  {(role === "admin" || role === "teacher") && (
                    <td className="px-4 py-4 text-sm text-gray-700">
                      {examSubject.teacher ? `${examSubject.teacher.name} ${examSubject.teacher.surname}` : "-"}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {exam.examSubjects.length === 0 && (
          <div className="text-center py-12">
            <Image src="/exam.png" alt="No subjects" width={48} height={48} className="mx-auto opacity-50 mb-3" />
            <p className="text-gray-500">No subjects scheduled for this exam yet.</p>
          </div>
        )}
      </div>

      {/* Footer Info */}
      {exam.examSubjects.length > 0 && (
        <div className="mt-6 bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-6">
              <div>
                <span className="text-gray-600">Total Subjects: </span>
                <span className="font-semibold text-gray-800">{exam.examSubjects.length}</span>
              </div>
              {startDate && endDate && (
                <div>
                  <span className="text-gray-600">Duration: </span>
                  <span className="font-semibold text-gray-800">
                    {Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1} days
                  </span>
                </div>
              )}
            </div>
            <div className="text-gray-500 text-xs">
              Created: {new Date(exam.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamTimetableDetailPage;
