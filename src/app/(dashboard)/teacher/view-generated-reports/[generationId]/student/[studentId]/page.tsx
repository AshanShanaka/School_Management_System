import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";

interface PageProps {
  params: {
    generationId: string;
    studentId: string;
  };
}

const IndividualReportCardPage = async ({ params }: PageProps) => {
  const { generationId, studentId } = params;

  // Fetch report card with all details
  const reportCard = await prisma.reportCard.findFirst({
    where: {
      generationId: generationId,
      studentId: studentId,
    },
    include: {
      student: {
        include: {
          class: {
            include: {
              grade: true,
            },
          },
        },
      },
      exam: {
        include: {
          examType: true,
          grade: true,
        },
      },
      class: {
        include: {
          grade: true,
        },
      },
      generation: true,
    },
  });

  if (!reportCard) {
    notFound();
  }

  // Fetch exam results for subject breakdown
  const examResults = await prisma.examResult.findMany({
    where: {
      examId: reportCard.examId,
      studentId: studentId,
    },
    include: {
      examSubject: {
        include: {
          subject: true,
          teacher: true,
        },
      },
    },
    orderBy: {
      examSubject: {
        subject: {
          name: "asc",
        },
      },
    },
  });

  // Calculate grade function
  const calculateGrade = (percentage: number): string => {
    if (percentage >= 75) return "A";
    if (percentage >= 65) return "B";
    if (percentage >= 50) return "C";
    if (percentage >= 35) return "S";
    return "F";
  };

  // Calculate average
  const average = examResults.length > 0
    ? examResults.reduce((sum, result) => {
        const percentage = (result.marks / result.examSubject.maxMarks) * 100;
        return sum + percentage;
      }, 0) / examResults.length
    : 0;

  return (
    <div className="flex-1 p-4 overflow-y-auto">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 rounded-xl shadow-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Student Report Card</h1>
              <p className="text-indigo-100">
                {reportCard.exam.title} - {reportCard.generation?.label}
              </p>
            </div>
            <a
              href={`/teacher/view-generated-reports/${generationId}`}
              className="px-6 py-3 bg-white text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors font-semibold flex items-center gap-2"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Back to Table
            </a>
          </div>
        </div>

        {/* Student Info Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-6">
            {reportCard.student.img ? (
              <img
                className="h-24 w-24 rounded-full object-cover border-4 border-indigo-100"
                src={reportCard.student.img}
                alt={reportCard.student.name}
              />
            ) : (
              <div className="h-24 w-24 rounded-full bg-indigo-100 flex items-center justify-center border-4 border-indigo-200">
                <svg className="w-12 h-12 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
            )}
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900">
                {reportCard.student.name} {reportCard.student.surname}
              </h2>
              <div className="grid grid-cols-2 gap-4 mt-3">
                <div>
                  <div className="text-sm text-gray-600">Index Number</div>
                  <div className="text-base font-semibold text-indigo-600">
                    {reportCard.student.username}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Class</div>
                  <div className="text-base font-semibold text-gray-900">
                    {reportCard.class.name}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Rank</div>
                  <div className="text-base font-semibold text-gray-900">
                    #{reportCard.classRank} {reportCard.classRank === 1 ? "🥇" : reportCard.classRank === 2 ? "🥈" : reportCard.classRank === 3 ? "🥉" : ""}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Percentage</div>
                  <div className="text-base font-semibold text-indigo-600">
                    {reportCard.percentage.toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Subject Breakdown */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200 bg-gray-50">
            <h3 className="text-xl font-bold text-gray-900">Subject Breakdown</h3>
            <p className="text-gray-600 mt-1">Detailed marks for each subject</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Subject
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Percentage
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Grade
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {examResults.map((result) => {
                  const percentage = (result.marks / result.examSubject.maxMarks) * 100;
                  const grade = calculateGrade(percentage);
                  const isPassed = percentage >= 35;

                  const getGradeColor = (grade: string) => {
                    switch (grade) {
                      case "A":
                        return "bg-green-100 text-green-800";
                      case "B":
                        return "bg-blue-100 text-blue-800";
                      case "C":
                        return "bg-yellow-100 text-yellow-800";
                      case "S":
                        return "bg-orange-100 text-orange-800";
                      case "W":
                        return "bg-red-100 text-red-800";
                      default:
                        return "bg-gray-100 text-gray-800";
                    }
                  };

                  return (
                    <tr key={result.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-gray-900">
                          {result.examSubject.subject.name}
                        </div>
                        {result.examSubject.teacher && (
                          <div className="text-xs text-gray-500">
                            Teacher: {result.examSubject.teacher.name} {result.examSubject.teacher.surname}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="text-sm font-bold text-indigo-600">
                          {percentage.toFixed(1)}%
                        </div>
                        <div className="text-xs text-gray-500">
                          {result.marks} / {result.examSubject.maxMarks}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex items-center px-4 py-1.5 rounded-full text-sm font-bold ${getGradeColor(
                            grade
                          )}`}
                        >
                          {grade}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                            isPassed
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {isPassed ? "✓ Pass" : "✗ Fail"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-indigo-50 border-t-2 border-indigo-200">
                <tr>
                  <td className="px-6 py-4 font-bold text-gray-900">AVERAGE</td>
                  <td className="px-6 py-4 text-center font-bold text-indigo-600">
                    {average.toFixed(1)}%
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`inline-flex items-center px-4 py-1.5 rounded-full text-sm font-bold ${
                        (() => {
                          const overallGrade = calculateGrade(average);
                          switch (overallGrade) {
                            case "A":
                              return "bg-green-100 text-green-800";
                            case "B":
                              return "bg-blue-100 text-blue-800";
                            case "C":
                              return "bg-yellow-100 text-yellow-800";
                            case "S":
                              return "bg-orange-100 text-orange-800";
                            case "W":
                              return "bg-red-100 text-red-800";
                            default:
                              return "bg-gray-100 text-gray-800";
                          }
                        })()
                      }`}
                    >
                      {calculateGrade(average)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                        average >= 35
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {average >= 35 ? "✓ PASS" : "✗ FAIL"}
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Summary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                  <path
                    fillRule="evenodd"
                    d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <div className="text-sm text-gray-600">Total Subjects</div>
                <div className="text-2xl font-bold text-gray-900">
                  {examResults.length}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <div className="text-sm text-gray-600">Subjects Passed</div>
                <div className="text-2xl font-bold text-gray-900">
                  {
                    examResults.filter(
                      (r) => (r.marks / r.examSubject.maxMarks) * 100 >= 35
                    ).length
                  }
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <svg
                  className="w-6 h-6 text-yellow-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
              <div>
                <div className="text-sm text-gray-600">Class Rank</div>
                <div className="text-2xl font-bold text-gray-900">
                  #{reportCard.classRank}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IndividualReportCardPage;
