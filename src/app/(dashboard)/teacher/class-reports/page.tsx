"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

interface ExamSubject {
  id: string;
  exam: {
    id: string;
    title: string;
    year: number;
    term: string;
    examDate: string;
    grade: {
      id: string;
      level: number;
    };
  };
  subject: {
    id: string;
    name: string;
    code: string;
  };
}

const TeacherClassReportsPage = () => {
  const router = useRouter();
  const [examSubjects, setExamSubjects] = useState<ExamSubject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAssignedExams();
  }, []);

  const fetchAssignedExams = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/teacher/assigned-exams");
      
      if (!response.ok) {
        throw new Error("Failed to fetch assigned exams");
      }
      
      const data = await response.json();
      setExamSubjects(data.examSubjects);
    } catch (err) {
      console.error("Error fetching assigned exams:", err);
      setError("Failed to load assigned exams");
    } finally {
      setLoading(false);
    }
  };

  const handleViewClassReport = (examId: string) => {
    router.push(`/teacher/class-report/${examId}`);
  };

  // Group exams by exam ID to avoid duplicates
  const uniqueExams = examSubjects.reduce((acc, examSubject) => {
    const examId = examSubject.exam.id;
    if (!acc[examId]) {
      acc[examId] = {
        ...examSubject.exam,
        subjects: [],
      };
    }
    acc[examId].subjects.push(examSubject.subject);
    return acc;
  }, {} as Record<string, any>);

  const exams = Object.values(uniqueExams);

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-md shadow-md">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-lamaSky"></div>
          <span className="ml-2 text-gray-600">Loading class reports...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-white rounded-md shadow-md">
        <div className="text-center py-8">
          <div className="text-red-500 mb-4">⚠️ {error}</div>
          <button
            onClick={fetchAssignedExams}
            className="px-4 py-2 bg-lamaSky text-white rounded hover:bg-lamaSkyLight"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Class Reports</h1>
        <p className="text-gray-600">
          View detailed class performance reports for your assigned exams.
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
              📊
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Exams</p>
              <p className="text-2xl font-bold text-gray-800">{exams.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
              📚
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Subjects</p>
              <p className="text-2xl font-bold text-gray-800">{examSubjects.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600 mr-4">
              🎓
            </div>
            <div>
              <p className="text-sm text-gray-600">Grades Teaching</p>
              <p className="text-2xl font-bold text-gray-800">
                {new Set(exams.map(exam => exam.grade.level)).size}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Exams List */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-800">Available Class Reports</h2>
        </div>
        
        <div className="p-4">
          {exams.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-4">📋</div>
              <p className="text-gray-600">No exams assigned yet.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {exams.map((exam) => (
                <div
                  key={exam.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-medium text-gray-800">{exam.title}</h3>
                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                          Grade {exam.grade.level}
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-600 space-y-1">
                        <div className="flex items-center gap-4">
                          <span>📅 {new Date(exam.examDate).toLocaleDateString()}</span>
                          <span>📚 {exam.year} - {exam.term}</span>
                          <span>🎯 {exam.subjects.length} Subject{exam.subjects.length !== 1 ? 's' : ''}</span>
                        </div>
                        
                        <div className="flex flex-wrap gap-2 mt-2">
                          {exam.subjects.map((subject: any) => (
                            <span
                              key={subject.id}
                              className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                            >
                              {subject.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleViewClassReport(exam.id)}
                        className="px-4 py-2 bg-lamaSky text-white rounded hover:bg-lamaSkyLight transition-colors"
                      >
                        View Class Report
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherClassReportsPage;
