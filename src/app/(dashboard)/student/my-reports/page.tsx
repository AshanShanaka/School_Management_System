"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

interface Exam {
  id: string;
  title: string;
  year: number;
  term: string;
  examDate: string;
  status: string;
  grade: {
    id: string;
    level: number;
  };
}

const StudentReportsPage = () => {
  const router = useRouter();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchStudentExams();
  }, []);

  const fetchStudentExams = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/student/exams");
      
      if (!response.ok) {
        throw new Error("Failed to fetch exams");
      }
      
      const data = await response.json();
      setExams(data.exams);
    } catch (err) {
      console.error("Error fetching exams:", err);
      setError("Failed to load exams");
    } finally {
      setLoading(false);
    }
  };

  const handleViewReportCard = (examId: string) => {
    // Navigate to the student's report card - we need to get the student ID
    router.push(`/student/report-card/${examId}`);
  };

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-md shadow-md">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-lamaSky"></div>
          <span className="ml-2 text-gray-600">Loading your report cards...</span>
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
            onClick={fetchStudentExams}
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
        <h1 className="text-2xl font-bold text-gray-800 mb-2">My Report Cards</h1>
        <p className="text-gray-600">
          View your academic performance reports for all completed exams.
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
              ✅
            </div>
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-800">
                {exams.filter(exam => exam.status === "completed").length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600 mr-4">
              ⏳
            </div>
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-800">
                {exams.filter(exam => exam.status === "pending").length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Exams List */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-800">Available Report Cards</h2>
        </div>
        
        <div className="p-4">
          {exams.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-4">📋</div>
              <p className="text-gray-600">No exams available yet.</p>
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
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          exam.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : exam.status === "active"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}>
                          {exam.status.charAt(0).toUpperCase() + exam.status.slice(1)}
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-600 space-y-1">
                        <div className="flex items-center gap-4">
                          <span>📅 {new Date(exam.examDate).toLocaleDateString()}</span>
                          <span>🎓 Grade {exam.grade.level}</span>
                          <span>📚 {exam.year} - {exam.term}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      {exam.status === "completed" ? (
                        <button
                          onClick={() => handleViewReportCard(exam.id)}
                          className="px-4 py-2 bg-lamaSky text-white rounded hover:bg-lamaSkyLight transition-colors"
                        >
                          View Report Card
                        </button>
                      ) : (
                        <span className="px-4 py-2 bg-gray-100 text-gray-500 rounded cursor-not-allowed">
                          Results Pending
                        </span>
                      )}
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

export default StudentReportsPage;
