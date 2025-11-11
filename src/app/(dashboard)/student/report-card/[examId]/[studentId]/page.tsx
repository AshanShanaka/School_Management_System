import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

interface ReportCardPageProps {
  params: {
    examId: string;
    studentId: string;
  };
}

const ReportCardPage = async ({ params }: ReportCardPageProps) => {
  const user = await getCurrentUser();
  
  if (!user || (user.role !== "student" && user.role !== "parent" && user.role !== "admin")) {
    redirect("/sign-in");
  }

  const examId = parseInt(params.examId);
  const studentId = params.studentId;

  // Verify access permissions
  if (user.role === "student" && user.id !== studentId) {
    redirect("/dashboard");
  }

  if (user.role === "parent") {
    const parent = await prisma.parent.findUnique({
      where: { id: user.id },
      include: { students: true },
    });

    if (!parent?.students.some(s => s.id === studentId)) {
      redirect("/dashboard");
    }
  }

  // Fetch report card data
  const reportCard = await prisma.reportCard.findUnique({
    where: {
      examId_studentId: {
        examId,
        studentId,
      },
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
      subjects: {
        include: {
          subject: true,
        },
        orderBy: {
          subject: {
            name: "asc",
          },
        },
      },
    },
  });

  if (!reportCard) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Image src="/result.png" alt="No report card" width={64} height={64} className="mx-auto opacity-50" />
          </div>
          <h3 className="text-lg font-medium text-gray-500 mb-2">Report Card Not Available</h3>
          <p className="text-gray-400">
            The report card for this exam is not yet available or has not been published.
          </p>
          <Link 
            href="/student/my-results"
            className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Back to Results
          </Link>
        </div>
      </div>
    );
  }

  const getGradeBadgeClass = (grade: string) => {
    const baseClasses = "px-2 py-1 rounded text-xs font-medium";
    switch (grade) {
      case "A+":
      case "A":
        return `${baseClasses} bg-green-100 text-green-800`;
      case "B+":
      case "B":
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case "C+":
      case "C":
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case "D":
        return `${baseClasses} bg-orange-100 text-orange-800`;
      case "F":
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const getRankSuffix = (rank: number) => {
    if (rank >= 11 && rank <= 13) return "th";
    switch (rank % 10) {
      case 1: return "st";
      case 2: return "nd";
      case 3: return "rd";
      default: return "th";
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6 print:hidden">
        <div className="flex items-center justify-between mb-4">
          <Link 
            href="/student/my-results"
            className="flex items-center text-blue-600 hover:text-blue-800"
          >
            ← Back to Results
          </Link>
          <div className="flex gap-2">
            <button 
              onClick={() => window.print()}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm"
            >
              🖨️ Print
            </button>
            <Link 
              href={`/student/report-card/${examId}/${studentId}/download`}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 text-sm"
            >
              📄 Download PDF
            </Link>
          </div>
        </div>
      </div>

      {/* Report Card */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg print:shadow-none print:border-0">
        {/* School Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-8 rounded-t-lg print:bg-blue-600">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Image src="/logo.png" alt="School Logo" width={60} height={60} className="mr-4" />
              <div>
                <h1 className="text-3xl font-bold">School Management System</h1>
                <p className="text-blue-100">Academic Report Card</p>
              </div>
            </div>
          </div>
        </div>

        {/* Student Information */}
        <div className="p-8 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Student Information</h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Name:</span>
                  <span className="font-medium">{reportCard.student.user.name} {reportCard.student.user.surname}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Student ID:</span>
                  <span className="font-medium">{reportCard.student.user.username}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Class:</span>
                  <span className="font-medium">{reportCard.student.class.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Grade:</span>
                  <span className="font-medium">Grade {reportCard.student.class.grade.level}</span>
                </div>
              </div>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Exam Information</h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Exam:</span>
                  <span className="font-medium">{reportCard.exam.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Type:</span>
                  <span className="font-medium">{reportCard.exam.examType.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Academic Year:</span>
                  <span className="font-medium">{reportCard.exam.year}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Term:</span>
                  <span className="font-medium">Term {reportCard.exam.term}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Generated:</span>
                  <span className="font-medium">{new Date(reportCard.generatedAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Overall Performance Summary */}
        <div className="p-8 border-b border-gray-200 bg-gray-50">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Overall Performance</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{reportCard.totalMarks}</div>
              <div className="text-sm text-gray-600">Total Marks</div>
              <div className="text-xs text-gray-500">out of {reportCard.maxMarks}</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {reportCard.percentage ? Math.round(reportCard.percentage * 100) / 100 : 0}%
              </div>
              <div className="text-sm text-gray-600">Percentage</div>
            </div>
            <div className="text-center">
              <div className="flex justify-center mb-2">
                {reportCard.overallGrade && (
                  <span className={getGradeBadgeClass(reportCard.overallGrade)}>
                    {reportCard.overallGrade}
                  </span>
                )}
              </div>
              <div className="text-sm text-gray-600">Overall Grade</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">
                #{reportCard.classRank}{getRankSuffix(reportCard.classRank || 0)}
              </div>
              <div className="text-sm text-gray-600">Class Rank</div>
              <div className="text-xs text-gray-500">
                Class Average: {reportCard.classAverage ? Math.round(reportCard.classAverage * 100) / 100 : 0}%
              </div>
            </div>
          </div>
        </div>

        {/* Subject-wise Results */}
        <div className="p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Subject-wise Performance</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Subject</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Marks Obtained</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Max Marks</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Percentage</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Grade</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Class Average</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {reportCard.subjects.map((subject, index) => {
                  const percentage = (subject.marks / subject.maxMarks) * 100;
                  const performance = subject.classAverage 
                    ? percentage > subject.classAverage ? "Above Average" 
                    : percentage === subject.classAverage ? "Average"
                    : "Below Average"
                    : "N/A";
                  
                  return (
                    <tr key={subject.id} className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                      <td className="py-3 px-4 font-medium text-gray-900">{subject.subject.name}</td>
                      <td className="py-3 px-4 text-center">{subject.marks}</td>
                      <td className="py-3 px-4 text-center">{subject.maxMarks}</td>
                      <td className="py-3 px-4 text-center font-medium">
                        {Math.round(percentage * 100) / 100}%
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={getGradeBadgeClass(subject.grade)}>
                          {subject.grade}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {subject.classAverage ? Math.round(subject.classAverage * 100) / 100 : "N/A"}%
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {subject.remarks || performance}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Comments Section */}
        {(reportCard.teacherComment || reportCard.principalComment) && (
          <div className="p-8 border-t border-gray-200 bg-gray-50">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Comments</h2>
            <div className="space-y-4">
              {reportCard.teacherComment && (
                <div>
                  <h3 className="font-medium text-gray-700 mb-2">Class Teacher's Comment:</h3>
                  <p className="text-gray-600 bg-white p-4 rounded border">
                    {reportCard.teacherComment}
                  </p>
                </div>
              )}
              {reportCard.principalComment && (
                <div>
                  <h3 className="font-medium text-gray-700 mb-2">Principal's Comment:</h3>
                  <p className="text-gray-600 bg-white p-4 rounded border">
                    {reportCard.principalComment}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Grade Distribution */}
        <div className="p-8 border-t border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Grade Distribution</h2>
          <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
            {["A+", "A", "B+", "B", "C+", "C", "D", "F"].map(grade => {
              const count = reportCard.subjects.filter(s => s.grade === grade).length;
              return (
                <div key={grade} className="text-center">
                  <div className={`${getGradeBadgeClass(grade)} text-lg font-bold mb-1 mx-auto`}>
                    {grade}
                  </div>
                  <div className="text-2xl font-bold text-gray-800">{count}</div>
                  <div className="text-xs text-gray-500">subjects</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-8 border-t border-gray-200 text-center text-sm text-gray-500">
          <p>This is a computer-generated report card. No signature is required.</p>
          <p className="mt-2">
            Generated on {new Date(reportCard.generatedAt).toLocaleDateString()} 
            at {new Date(reportCard.generatedAt).toLocaleTimeString()}
          </p>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          .print\\:hidden {
            display: none !important;
          }
          .print\\:bg-blue-600 {
            background-color: #2563eb !important;
            -webkit-print-color-adjust: exact;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          .print\\:border-0 {
            border: none !important;
          }
          body {
            -webkit-print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  );
};

export default ReportCardPage;
