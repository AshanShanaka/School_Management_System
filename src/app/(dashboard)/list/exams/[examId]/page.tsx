"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { toast } from "react-hot-toast";

interface ExamSubject {
  id: number;
  subject: {
    id: number;
    name: string;
    code?: string;
  };
  teacher: {
    id: string;
    name: string;
    surname: string;
  } | null;
  maxMarks: number;
}

interface ExamResult {
  id: number;
  student: {
    id: string;
    name: string;
    surname: string;
  };
  marks: number;
  grade?: string;
}

interface ExamSummary {
  id: number;
  student: {
    id: string;
    name: string;
    surname: string;
  };
  totalMarks: number;
  percentage: number;
  grade: string;
  classRank: number;
  gradeRank?: number;
}

interface ExamData {
  id: number;
  title: string;
  year: number;
  term: number;
  examTypeEnum: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  grade: {
    id: number;
    level: number;
  };
  examType: {
    id: number;
    name: string;
  };
  examSubjects: ExamSubject[];
  results: ExamResult[];
  examSummaries: ExamSummary[];
  totalStudents?: number;
}

const ExamDetailPage = () => {
  const { examId } = useParams();
  const router = useRouter();
  const [examData, setExamData] = useState<ExamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchExamData = async () => {
      try {
        const response = await fetch(`/api/exams/${examId}`);
        if (!response.ok) {
          if (response.status === 404) {
            setError("Exam not found");
          } else {
            throw new Error("Failed to fetch exam data");
          }
          return;
        }
        const data = await response.json();
        setExamData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    if (examId) {
      fetchExamData();
    }
  }, [examId]);

  const handlePublishExam = async () => {
    try {
      const response = await fetch(`/api/exams/${examId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "PUBLISHED" }),
      });

      if (response.ok) {
        toast.success("Exam published successfully");
        // Refresh data
        const updatedData = await response.json();
        setExamData(updatedData);
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to publish exam");
      }
    } catch (error) {
      toast.error("Failed to publish exam");
    }
  };

  const handleUnpublishExam = async () => {
    try {
      const response = await fetch(`/api/exams/${examId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "DRAFT" }),
      });

      if (response.ok) {
        toast.success("Exam unpublished successfully");
        // Refresh data
        const updatedData = await response.json();
        setExamData(updatedData);
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to unpublish exam");
      }
    } catch (error) {
      toast.error("Failed to unpublish exam");
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-3 py-1 text-sm font-medium rounded-full";
    switch (status) {
      case "PUBLISHED":
        return `${baseClasses} bg-green-100 text-green-800`;
      case "DRAFT":
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const getExamTypeBadge = (examType: string) => {
    const baseClasses = "px-3 py-1 text-sm font-medium rounded";
    switch (examType) {
      case "UNIT":
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case "TERM":
        return `${baseClasses} bg-purple-100 text-purple-800`;
      case "TRIAL_OL":
        return `${baseClasses} bg-orange-100 text-orange-800`;
      case "NATIONAL_OL":
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const getGradeBadge = (grade: string) => {
    const baseClasses = "px-3 py-1.5 text-sm font-bold rounded-lg";
    switch (grade) {
      case "A":
        return `${baseClasses} bg-green-100 text-green-800 border-2 border-green-300`;
      case "B":
        return `${baseClasses} bg-blue-100 text-blue-800 border-2 border-blue-300`;
      case "C":
        return `${baseClasses} bg-yellow-100 text-yellow-800 border-2 border-yellow-300`;
      case "S":
        return `${baseClasses} bg-orange-100 text-orange-800 border-2 border-orange-300`;
      case "F":
        return `${baseClasses} bg-red-100 text-red-800 border-2 border-red-300`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800 border-2 border-gray-300`;
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-md flex-1 m-4 mt-0">
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">Loading exam details...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-md flex-1 m-4 mt-0">
        <div className="flex flex-col items-center justify-center h-64">
          <div className="text-red-600 text-lg mb-4">Error: {error}</div>
          <button
            onClick={() => router.back()}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!examData) {
    return (
      <div className="bg-white p-6 rounded-md flex-1 m-4 mt-0">
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">No exam data found</div>
        </div>
      </div>
    );
  }

  const totalStudentsWithResults = examData.examSummaries?.length || 0;
  const totalSubjects = examData.examSubjects?.length || 0;
  const completionPercentage = totalSubjects > 0 ? (totalStudentsWithResults / totalSubjects) * 100 : 0;

  return (
    <div className="bg-white p-6 rounded-md flex-1 m-4 mt-0 space-y-6">
      {/* Header with Breadcrumb */}
      <div className="mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
          <Link href="/list/exams" className="hover:text-blue-600">Exams</Link>
          <span>/</span>
          <span className="text-gray-800 font-medium">{examData.title}</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{examData.title}</h1>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                Grade {examData.grade.level}
              </span>
              <span className={getExamTypeBadge(examData.examTypeEnum)}>
                {examData.examTypeEnum.replace("_", " ")}
              </span>
              <span className={getStatusBadge(examData.status)}>
                {examData.status}
              </span>
              <span className="text-gray-600">|</span>
              <span className="text-gray-700 font-medium">Year {examData.year} - Term {examData.term}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/list/exams"
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <span>←</span>
              Back to Exams
            </Link>
            {examData.status === "DRAFT" ? (
              <button
                onClick={handlePublishExam}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
              >
                <span>📢</span>
                Publish Exam
              </button>
            ) : (
              <button
                onClick={handleUnpublishExam}
                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
              >
                <span>🔒</span>
                Unpublish Exam
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-5 rounded-xl border border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <div className="text-blue-600 text-sm font-semibold">SUBJECTS</div>
            <Image src="/subject.png" alt="" width={24} height={24} />
          </div>
          <div className="text-3xl font-bold text-blue-900">{totalSubjects}</div>
          <div className="text-xs text-blue-700 mt-1">Total exam subjects</div>
        </div>
        
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-5 rounded-xl border border-green-200">
          <div className="flex items-center justify-between mb-2">
            <div className="text-green-600 text-sm font-semibold">STUDENTS</div>
            <Image src="/student.png" alt="" width={24} height={24} />
          </div>
          <div className="text-3xl font-bold text-green-900">{examData.totalStudents || 0}</div>
          <div className="text-xs text-green-700 mt-1">Total students in grade</div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-5 rounded-xl border border-purple-200">
          <div className="flex items-center justify-between mb-2">
            <div className="text-purple-600 text-sm font-semibold">RESULTS</div>
            <Image src="/result.png" alt="" width={24} height={24} />
          </div>
          <div className="text-3xl font-bold text-purple-900">{examData.results?.length || 0}</div>
          <div className="text-xs text-purple-700 mt-1">Total result entries</div>
        </div>
        
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-5 rounded-xl border border-orange-200">
          <div className="flex items-center justify-between mb-2">
            <div className="text-orange-600 text-sm font-semibold">CREATED</div>
            <Image src="/calendar.png" alt="" width={24} height={24} />
          </div>
          <div className="text-xl font-bold text-orange-900">
            {new Date(examData.createdAt).toLocaleDateString()}
          </div>
          <div className="text-xs text-orange-700 mt-1">Exam creation date</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-xl border border-indigo-200">
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span>⚡</span>
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <Link
            href={`/list/exams/timetable/${examData.id}`}
            className="bg-white hover:bg-blue-50 text-blue-700 px-4 py-3 rounded-lg flex items-center gap-3 border border-blue-200 hover:border-blue-400 transition-all"
          >
            <Image src="/calendar.png" alt="" width={20} height={20} />
            <div>
              <div className="font-semibold">Exam Timetable</div>
              <div className="text-xs text-gray-600">View schedule</div>
            </div>
          </Link>
          
          <Link
            href={`/list/exams/${examData.id}/marks-entry-workflow`}
            className="bg-white hover:bg-green-50 text-green-700 px-4 py-3 rounded-lg flex items-center gap-3 border border-green-200 hover:border-green-400 transition-all"
          >
            <Image src="/update.png" alt="" width={20} height={20} />
            <div>
              <div className="font-semibold">Enter Marks</div>
              <div className="text-xs text-gray-600">Subject-wise entry</div>
            </div>
          </Link>
          
          <Link
            href={`/list/exams/${examData.id}`}
            className="bg-white hover:bg-blue-50 text-blue-700 px-4 py-3 rounded-lg flex items-center gap-3 border border-blue-200 hover:border-blue-400 transition-all"
          >
            <Image src="/view.png" alt="" width={20} height={20} />
            <div>
              <div className="font-semibold">View Details</div>
              <div className="text-xs text-gray-600">Complete exam info</div>
            </div>
          </Link>
          
          <Link
            href={`/list/exam-results?examId=${examData.id}`}
            className="bg-white hover:bg-amber-50 text-amber-700 px-4 py-3 rounded-lg flex items-center gap-3 border border-amber-200 hover:border-amber-400 transition-all"
          >
            <Image src="/view.png" alt="" width={20} height={20} />
            <div>
              <div className="font-semibold">View Results</div>
              <div className="text-xs text-gray-600">All student results</div>
            </div>
          </Link>
        </div>
      </div>

      {/* Results Summary */}
      {examData.examSummaries && examData.examSummaries.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <Image src="/result.png" alt="" width={20} height={20} />
                  Student Results Overview
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Top performing students - Showing {Math.min(examData.examSummaries.length, 10)} of {examData.examSummaries.length} students
                </p>
              </div>
              <Link
                href={`/list/exam-results?examId=${examData.id}`}
                className="bg-white hover:bg-green-50 text-green-700 px-4 py-2 rounded-lg border border-green-200 hover:border-green-400 transition-all flex items-center gap-2 text-sm font-semibold"
              >
                <span>👁️</span>
                View All {examData.examSummaries.length} Results
              </Link>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Rank</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Student</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Total Marks</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Average</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Percentage</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Grade</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Performance</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {examData.examSummaries.slice(0, 10).map((summary, index) => {
                  const isTopThree = summary.classRank <= 3;
                  const rankColors = ['bg-yellow-100 text-yellow-800 border-yellow-300', 'bg-gray-200 text-gray-800 border-gray-400', 'bg-orange-100 text-orange-800 border-orange-300'];
                  
                  return (
                    <tr key={summary.id} className="hover:bg-green-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full font-bold text-lg border-2 ${isTopThree ? rankColors[summary.classRank - 1] : 'bg-blue-100 text-blue-800 border-blue-300'}`}>
                          {summary.classRank === 1 && '🥇'}
                          {summary.classRank === 2 && '🥈'}
                          {summary.classRank === 3 && '🥉'}
                          {summary.classRank > 3 && summary.classRank}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                            {summary.student.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">
                              {summary.student.name} {summary.student.surname}
                            </div>
                            <div className="text-xs text-gray-500">ID: {summary.student.id.slice(0, 10)}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        <div className="text-2xl font-bold text-gray-900">{summary.totalMarks}</div>
                        <div className="text-xs text-gray-500">marks</div>
                      </td>
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        <div className="text-lg font-semibold text-blue-900">
                          {(summary.totalMarks / examData.examSubjects.length).toFixed(1)}
                        </div>
                        <div className="text-xs text-gray-500">avg per subject</div>
                      </td>
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        <div className="inline-flex flex-col items-center">
                          <div className="text-xl font-bold text-blue-900">{summary.percentage.toFixed(1)}%</div>
                          <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden mt-1">
                            <div 
                              className={`h-full transition-all ${summary.percentage >= 75 ? 'bg-green-500' : summary.percentage >= 50 ? 'bg-blue-500' : summary.percentage >= 35 ? 'bg-orange-500' : 'bg-red-500'}`}
                              style={{ width: `${Math.min(summary.percentage, 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        <span className={getGradeBadge(summary.grade)}>
                          {summary.grade}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          {summary.percentage >= 75 && (
                            <span className="inline-flex items-center gap-1 text-green-700 font-semibold">
                              <span>🌟</span> Excellent
                            </span>
                          )}
                          {summary.percentage >= 50 && summary.percentage < 75 && (
                            <span className="inline-flex items-center gap-1 text-blue-700 font-semibold">
                              <span>👍</span> Good
                            </span>
                          )}
                          {summary.percentage >= 35 && summary.percentage < 50 && (
                            <span className="inline-flex items-center gap-1 text-orange-700 font-semibold">
                              <span>📚</span> Average
                            </span>
                          )}
                          {summary.percentage < 35 && (
                            <span className="inline-flex items-center gap-1 text-red-700 font-semibold">
                              <span>⚠️</span> Needs Improvement
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {examData.examSummaries.length > 10 && (
            <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 text-center">
              <Link
                href={`/list/exam-results?examId=${examData.id}`}
                className="text-green-700 hover:text-green-800 font-semibold text-sm inline-flex items-center gap-2"
              >
                View all {examData.examSummaries.length} student results
                <span>→</span>
              </Link>
            </div>
          )}
        </div>
      )}

      {/* No Results Message */}
      {(!examData.examSummaries || examData.examSummaries.length === 0) && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-10 rounded-xl text-center border-2 border-dashed border-blue-200">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">No Results Available Yet</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Results will appear here once teachers start entering marks for each subject. 
            Use the quick actions above to begin the marks entry process.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link
              href={`/list/exams/${examData.id}/marks-entry-workflow`}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2"
            >
              <Image src="/update.png" alt="" width={16} height={16} className="brightness-0 invert" />
              Start Entering Marks
            </Link>
            <Link
              href={`/list/exams/timetable/${examData.id}`}
              className="bg-white hover:bg-gray-50 text-gray-700 px-6 py-3 rounded-lg font-semibold border border-gray-300 flex items-center gap-2"
            >
              <Image src="/calendar.png" alt="" width={16} height={16} />
              View Timetable
            </Link>
            <Link
              href={`/list/exams/${examData.id}/marks-entry-simple`}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2"
            >
              <Image src="/update.png" alt="" width={16} height={16} className="brightness-0 invert" />
              Quick Marks Entry
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamDetailPage;
