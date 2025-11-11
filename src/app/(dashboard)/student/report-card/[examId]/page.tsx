"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

interface ReportCardData {
  student: {
    id: string;
    firstName: string;
    lastName: string;
    studentId: string;
    grade: {
      level: number;
    };
  };
  exam: {
    id: string;
    title: string;
    year: number;
    term: string;
    examDate: string;
  };
  results: Array<{
    subject: {
      name: string;
      code: string;
    };
    score: number;
    grade: string;
  }>;
  totalMarks: number;
  totalObtained: number;
  percentage: number;
  overallGrade: string;
  classRank: number;
  totalStudents: number;
  classAverage: number;
}

const StudentReportCardPage = () => {
  const router = useRouter();
  const params = useParams();
  const examId = params.examId as string;
  
  const [reportData, setReportData] = useState<ReportCardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (examId) {
      fetchReportCard();
    }
  }, [examId]);

  const fetchReportCard = async () => {
    try {
      setLoading(true);
      // Call API without studentId, let the backend determine from the current user
      const response = await fetch(`/api/student/report-card/${examId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setError("Report card not found or results not available yet.");
        } else {
          throw new Error("Failed to fetch report card");
        }
        return;
      }
      
      const data = await response.json();
      setReportData(data);
    } catch (err) {
      console.error("Error fetching report card:", err);
      setError("Failed to load report card");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getGradeColor = (grade: string) => {
    const colors: Record<string, string> = {
      'A+': 'text-green-600 bg-green-50',
      'A': 'text-green-600 bg-green-50',
      'B+': 'text-blue-600 bg-blue-50',
      'B': 'text-blue-600 bg-blue-50',
      'C+': 'text-yellow-600 bg-yellow-50',
      'C': 'text-yellow-600 bg-yellow-50',
      'D': 'text-orange-600 bg-orange-50',
      'F': 'text-red-600 bg-red-50',
    };
    return colors[grade] || 'text-gray-600 bg-gray-50';
  };

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-md shadow-md">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-lamaSky"></div>
          <span className="ml-2 text-gray-600">Loading your report card...</span>
        </div>
      </div>
    );
  }

  if (error || !reportData) {
    return (
      <div className="p-6 bg-white rounded-md shadow-md">
        <div className="text-center py-8">
          <div className="text-red-500 mb-4">⚠️ {error}</div>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-lamaSky text-white rounded hover:bg-lamaSkyLight mr-4"
          >
            Go Back
          </button>
          <button
            onClick={fetchReportCard}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 print:p-0 print:bg-white">
      {/* Print/Back Controls - Hidden when printing */}
      <div className="mb-4 print:hidden">
        <div className="flex justify-between items-center">
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            ← Back to Reports
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-lamaSky text-white rounded hover:bg-lamaSkyLight"
          >
            🖨️ Print Report Card
          </button>
        </div>
      </div>

      {/* Report Card */}
      <div className="max-w-4xl mx-auto bg-white shadow-lg print:shadow-none print:max-w-none">
        {/* Header */}
        <div className="bg-gradient-to-r from-lamaSky to-lamaSkyLight text-white p-6 print:bg-lamaSky">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-2">ACADEMIC REPORT CARD</h1>
            <p className="text-lg opacity-90">Excellence in Education</p>
          </div>
        </div>

        {/* Student Information */}
        <div className="p-6 border-b">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Student Information</h2>
              <div className="space-y-2">
                <div className="flex">
                  <span className="font-medium text-gray-600 w-24">Name:</span>
                  <span className="text-gray-800">{reportData.student.firstName} {reportData.student.lastName}</span>
                </div>
                <div className="flex">
                  <span className="font-medium text-gray-600 w-24">ID:</span>
                  <span className="text-gray-800">{reportData.student.studentId}</span>
                </div>
                <div className="flex">
                  <span className="font-medium text-gray-600 w-24">Grade:</span>
                  <span className="text-gray-800">{reportData.student.grade.level}</span>
                </div>
              </div>
            </div>
            
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Examination Details</h2>
              <div className="space-y-2">
                <div className="flex">
                  <span className="font-medium text-gray-600 w-24">Exam:</span>
                  <span className="text-gray-800">{reportData.exam.title}</span>
                </div>
                <div className="flex">
                  <span className="font-medium text-gray-600 w-24">Period:</span>
                  <span className="text-gray-800">{reportData.exam.year} - {reportData.exam.term}</span>
                </div>
                <div className="flex">
                  <span className="font-medium text-gray-600 w-24">Date:</span>
                  <span className="text-gray-800">{new Date(reportData.exam.examDate).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Results Table */}
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Subject-wise Performance</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Subject</th>
                  <th className="border border-gray-300 px-4 py-3 text-center font-semibold">Code</th>
                  <th className="border border-gray-300 px-4 py-3 text-center font-semibold">Score</th>
                  <th className="border border-gray-300 px-4 py-3 text-center font-semibold">Grade</th>
                </tr>
              </thead>
              <tbody>
                {reportData.results.map((result, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-3">{result.subject.name}</td>
                    <td className="border border-gray-300 px-4 py-3 text-center">{result.subject.code}</td>
                    <td className="border border-gray-300 px-4 py-3 text-center font-medium">{result.score}</td>
                    <td className="border border-gray-300 px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded text-sm font-medium ${getGradeColor(result.grade)}`}>
                        {result.grade}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary */}
        <div className="p-6 bg-gray-50 border-t">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-lamaSky">{reportData.totalObtained}</div>
              <div className="text-sm text-gray-600">Total Marks Obtained</div>
              <div className="text-xs text-gray-500">out of {reportData.totalMarks}</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{reportData.percentage.toFixed(1)}%</div>
              <div className="text-sm text-gray-600">Percentage</div>
            </div>
            
            <div className="text-center">
              <div className={`text-2xl font-bold px-3 py-1 rounded ${getGradeColor(reportData.overallGrade)}`}>
                {reportData.overallGrade}
              </div>
              <div className="text-sm text-gray-600 mt-1">Overall Grade</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">#{reportData.classRank}</div>
              <div className="text-sm text-gray-600">Class Rank</div>
              <div className="text-xs text-gray-500">out of {reportData.totalStudents}</div>
            </div>
          </div>
          
          <div className="mt-6 text-center">
            <div className="text-sm text-gray-600">
              Class Average: <span className="font-medium">{reportData.classAverage.toFixed(1)}%</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-lamaSky text-white text-center print:bg-lamaSky">
          <p className="text-sm opacity-90">
            Generated on {new Date().toLocaleDateString()} | 
            Keep working hard and aim for excellence!
          </p>
        </div>
      </div>
    </div>
  );
};

export default StudentReportCardPage;
