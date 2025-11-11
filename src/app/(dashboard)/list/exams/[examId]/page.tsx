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

  const totalStudentsWithResults = examData.examSummaries.length;
  const totalSubjects = examData.examSubjects.length;
  const completionPercentage = totalSubjects > 0 ? (totalStudentsWithResults / totalSubjects) * 100 : 0;

  return (
    <div className="bg-white p-6 rounded-md flex-1 m-4 mt-0 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{examData.title}</h1>
          <div className="flex items-center gap-4 mt-2">
            <span className="text-gray-600">Grade {examData.grade.level}</span>
            <span className={getExamTypeBadge(examData.examTypeEnum)}>
              {examData.examTypeEnum.replace("_", " ")}
            </span>
            <span className={getStatusBadge(examData.status)}>
              {examData.status}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/list/exams"
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md"
          >
            Back to Exams
          </Link>
          {examData.status === "DRAFT" ? (
            <button
              onClick={handlePublishExam}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md"
            >
              Publish Exam
            </button>
          ) : (
            <button
              onClick={handleUnpublishExam}
              className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-md"
            >
              Unpublish Exam
            </button>
          )}
        </div>
      </div>

      {/* Exam Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-blue-600 text-sm font-medium">Year & Term</div>
          <div className="text-xl font-bold text-blue-900">{examData.year} - Term {examData.term}</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-green-600 text-sm font-medium">Total Subjects</div>
          <div className="text-xl font-bold text-green-900">{totalSubjects}</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="text-purple-600 text-sm font-medium">Students with Results</div>
          <div className="text-xl font-bold text-purple-900">{totalStudentsWithResults}</div>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg">
          <div className="text-orange-600 text-sm font-medium">Created Date</div>
          <div className="text-xl font-bold text-orange-900">
            {new Date(examData.createdAt).toLocaleDateString()}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-4">Report Card Workflow</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href={`/list/exams/${examData.id}/marks-entry-workflow`}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md flex items-center gap-2"
          >
            <Image src="/update.png" alt="" width={16} height={16} />
            Subject Marks Entry
          </Link>
          <Link
            href={`/list/exams/${examData.id}/report-workflow`}
            className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-md flex items-center gap-2"
          >
            <Image src="/result.png" alt="" width={16} height={16} />
            Report Card Workflow
          </Link>
          <Link
            href={`/list/results?examId=${examData.id}`}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-md flex items-center gap-2"
          >
            <Image src="/view.png" alt="" width={16} height={16} />
            View All Results
          </Link>
          <Link
            href={`/list/exams/${examData.id}/marks-entry-simple`}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md flex items-center gap-2"
          >
            <Image src="/update.png" alt="" width={16} height={16} />
            Legacy Marks Entry
          </Link>
        </div>
      </div>

      {/* Subjects */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Exam Subjects ({totalSubjects})</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-200 px-4 py-2 text-left">Subject</th>
                <th className="border border-gray-200 px-4 py-2 text-left">Teacher</th>
                <th className="border border-gray-200 px-4 py-2 text-left">Max Marks</th>
                <th className="border border-gray-200 px-4 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {examData.examSubjects.map((examSubject) => (
                <tr key={examSubject.id} className="hover:bg-gray-50">
                  <td className="border border-gray-200 px-4 py-2">
                    <div className="font-medium">{examSubject.subject.name}</div>
                    {examSubject.subject.code && (
                      <div className="text-sm text-gray-500">{examSubject.subject.code}</div>
                    )}
                  </td>
                  <td className="border border-gray-200 px-4 py-2">
                    {examSubject.teacher ? (
                      `${examSubject.teacher.name} ${examSubject.teacher.surname}`
                    ) : (
                      <span className="text-gray-500 italic">No teacher assigned</span>
                    )}
                  </td>
                  <td className="border border-gray-200 px-4 py-2">
                    {examSubject.maxMarks}
                  </td>
                  <td className="border border-gray-200 px-4 py-2">
                    {examSubject.teacher ? (
                      <Link
                        href={`/list/exams/${examData.id}/marks-entry-simple?subject=${examSubject.subject.id}`}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                      >
                        Enter Marks
                      </Link>
                    ) : (
                      <span className="text-gray-400 text-sm">Assign teacher first</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Results Summary */}
      {examData.examSummaries.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">
            Results Summary ({examData.examSummaries.length} students)
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-200 px-4 py-2 text-left">Rank</th>
                  <th className="border border-gray-200 px-4 py-2 text-left">Student</th>
                  <th className="border border-gray-200 px-4 py-2 text-left">Total Marks</th>
                  <th className="border border-gray-200 px-4 py-2 text-left">Percentage</th>
                  <th className="border border-gray-200 px-4 py-2 text-left">Grade</th>
                </tr>
              </thead>
              <tbody>
                {examData.examSummaries.slice(0, 10).map((summary) => (
                  <tr key={summary.id} className="hover:bg-gray-50">
                    <td className="border border-gray-200 px-4 py-2 font-medium">
                      #{summary.classRank}
                    </td>
                    <td className="border border-gray-200 px-4 py-2">
                      {summary.student.name} {summary.student.surname}
                    </td>
                    <td className="border border-gray-200 px-4 py-2">
                      {summary.totalMarks}
                    </td>
                    <td className="border border-gray-200 px-4 py-2">
                      {summary.percentage.toFixed(1)}%
                    </td>
                    <td className="border border-gray-200 px-4 py-2">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm font-medium">
                        {summary.grade}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {examData.examSummaries.length > 10 && (
              <div className="mt-4 text-center">
                <Link
                  href={`/list/results?examId=${examData.id}`}
                  className="text-blue-600 hover:text-blue-800"
                >
                  View all {examData.examSummaries.length} results →
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* No Results Message */}
      {examData.examSummaries.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <div className="text-yellow-800 text-lg font-medium mb-2">
            No Results Available
          </div>
          <div className="text-yellow-600 mb-4">
            This exam doesn't have any results yet. Start by entering marks for each subject.
          </div>
          <Link
            href={`/list/exams/${examData.id}/marks-entry-simple`}
            className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-md"
          >
            Start Marks Entry
          </Link>
        </div>
      )}
    </div>
  );
};

export default ExamDetailPage;
