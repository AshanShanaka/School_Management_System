import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { getCurrentUser } from "@/lib/auth";

interface ExamType {
  id: number;
  name: string;
}

interface Grade {
  id: number;
  level: number;
}

interface Subject {
  id: number;
  name: string;
  code?: string;
}

interface Teacher {
  id: string;
  name: string;
  surname: string;
}

interface ExamSubject {
  id: number;
  subject: Subject;
  teacher: Teacher;
  maxMarks: number;
}

interface Exam {
  id: number;
  title: string;
  year: number;
  term: number;
  examTypeEnum: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  grade: Grade;
  examType: ExamType;
  examSubjects: ExamSubject[];
  _count?: {
    results: number;
    examSummaries: number;
  };
}

const ExamListPage = () => {
  const { user, loading: authLoading } = useAuth();
  const [exams, setExams] = useState<Exam[]>([]);
  const [examTypes, setExamTypes] = useState<ExamType[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    gradeId: "",
    examTypeId: "",
    year: "",
    term: "",
    status: ""
  });

  useEffect(() => {
    fetchExams();
    fetchExamTypes();
    fetchGrades();
  }, [filters]);

  const fetchExams = async () => {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });
      
      const response = await fetch(`/api/exams?${queryParams.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setExams(data);
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to fetch exams");
      }
    } catch (error) {
      toast.error("Failed to fetch exams");
    } finally {
      setLoading(false);
    }
  };

  const fetchExamTypes = async () => {
    try {
      const response = await fetch("/api/exam-types");
      if (response.ok) {
        const data = await response.json();
        setExamTypes(data);
      }
    } catch (error) {
      console.error("Failed to fetch exam types:", error);
    }
  };

  const fetchGrades = async () => {
    try {
      const response = await fetch("/api/grades");
      if (response.ok) {
        const data = await response.json();
        setGrades(data);
      }
    } catch (error) {
      console.error("Failed to fetch grades:", error);
    }
  };

  const handlePublishExam = async (examId: number) => {
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
        fetchExams();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to publish exam");
      }
    } catch (error) {
      toast.error("Failed to publish exam");
    }
  };

  const handleUnpublishExam = async (examId: number) => {
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
        fetchExams();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to unpublish exam");
      }
    } catch (error) {
      toast.error("Failed to unpublish exam");
    }
  };

  const handleDeleteExam = async (examId: number) => {
    if (!confirm("Are you sure you want to delete this exam? This action cannot be undone.")) {
      return;
    }

    try {
      const response = await fetch(`/api/exams/${examId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Exam deleted successfully");
        fetchExams();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to delete exam");
      }
    } catch (error) {
      toast.error("Failed to delete exam");
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-2 py-1 text-xs font-medium rounded-full";
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
    const baseClasses = "px-2 py-1 text-xs font-medium rounded";
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

  if (loading || authLoading) {
    return (
      <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">Loading exams...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold">Exam Management</h1>
        {user?.role === "admin" && (
          <Link
            href="/list/exams/create"
            className="bg-skyBlue hover:bg-blue-600 text-white px-4 py-2 rounded-md flex items-center gap-2"
          >
            <Image src="/create.png" alt="" width={14} height={14} />
            Create New Exam
          </Link>
        )}
      </div>

      {/* FILTERS */}
      <div className="flex flex-wrap gap-4 mb-6 p-4 bg-gray-50 rounded-md">
        <select
          value={filters.gradeId}
          onChange={(e) => setFilters({ ...filters, gradeId: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded-md"
        >
          <option value="">All Grades</option>
          {grades.map((grade) => (
            <option key={grade.id} value={grade.id}>
              Grade {grade.level}
            </option>
          ))}
        </select>

        <select
          value={filters.examTypeId}
          onChange={(e) => setFilters({ ...filters, examTypeId: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded-md"
        >
          <option value="">All Exam Types</option>
          {examTypes.map((type) => (
            <option key={type.id} value={type.id}>
              {type.name}
            </option>
          ))}
        </select>

        <select
          value={filters.year}
          onChange={(e) => setFilters({ ...filters, year: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded-md"
        >
          <option value="">All Years</option>
          <option value="2025">2025</option>
          <option value="2024">2024</option>
          <option value="2023">2023</option>
        </select>

        <select
          value={filters.term}
          onChange={(e) => setFilters({ ...filters, term: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded-md"
        >
          <option value="">All Terms</option>
          <option value="1">Term 1</option>
          <option value="2">Term 2</option>
          <option value="3">Term 3</option>
        </select>

        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded-md"
        >
          <option value="">All Status</option>
          <option value="DRAFT">Draft</option>
          <option value="PUBLISHED">Published</option>
        </select>
      </div>

      {/* EXAM LIST */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left p-3 font-medium text-gray-600">Exam</th>
              <th className="text-left p-3 font-medium text-gray-600">Grade</th>
              <th className="text-left p-3 font-medium text-gray-600">Type</th>
              <th className="text-left p-3 font-medium text-gray-600">Year/Term</th>
              <th className="text-left p-3 font-medium text-gray-600">Status</th>
              <th className="text-left p-3 font-medium text-gray-600">Subjects</th>
              <th className="text-left p-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {exams.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center p-8 text-gray-500">
                  No exams found. Create your first exam!
                </td>
              </tr>
            ) : (
              exams.map((exam) => (
                <tr key={exam.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-3">
                    <div>
                      <div className="font-medium text-gray-900">{exam.title}</div>
                      <div className="text-sm text-gray-500">
                        Created: {new Date(exam.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </td>
                  <td className="p-3">
                    <span className="text-gray-900">Grade {exam.grade?.level}</span>
                  </td>
                  <td className="p-3">
                    <span className={getExamTypeBadge(exam.examTypeEnum)}>
                      {exam.examTypeEnum.replace("_", " ")}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="text-gray-900">{exam.year}</div>
                    <div className="text-sm text-gray-500">Term {exam.term}</div>
                  </td>
                  <td className="p-3">
                    <span className={getStatusBadge(exam.status)}>
                      {exam.status}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="text-gray-900">{exam.examSubjects?.length || 0} subjects</div>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/list/exams/${exam.id}`}
                        className="p-2 rounded-full bg-sky-200 hover:bg-sky-300"
                        title="View Details"
                      >
                        <Image src="/view.png" alt="" width={16} height={16} />
                      </Link>
                      
                      <Link
                        href={`/list/exams/${exam.id}/edit`}
                        className="p-2 rounded-full bg-yellow-200 hover:bg-yellow-300"
                        title="Edit"
                      >
                        <Image src="/update.png" alt="" width={16} height={16} />
                      </Link>

                      {exam.status === "DRAFT" ? (
                        <button
                          onClick={() => handlePublishExam(exam.id)}
                          className="p-2 rounded-full bg-green-200 hover:bg-green-300"
                          title="Publish Exam"
                        >
                          <Image src="/create.png" alt="" width={16} height={16} />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUnpublishExam(exam.id)}
                          className="p-2 rounded-full bg-orange-200 hover:bg-orange-300"
                          title="Unpublish Exam"
                        >
                          <Image src="/close.png" alt="" width={16} height={16} />
                        </button>
                      )}

                      <button
                        onClick={() => handleDeleteExam(exam.id)}
                        className="p-2 rounded-full bg-red-200 hover:bg-red-300"
                        title="Delete"
                      >
                        <Image src="/delete.png" alt="" width={16} height={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ExamListPage;
