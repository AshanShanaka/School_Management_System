"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "react-hot-toast";

interface ReportCard {
  id: string;
  student: {
    id: string;
    name: string;
    surname: string;
    username: string;
  };
  totalMarks: number;
  maxTotalMarks: number;
  percentage: number;
  overallGrade: string;
  classRank: number;
  remarks?: string;
  qrCode?: string;
  subjects: {
    subject: {
      name: string;
      code?: string;
    };
    marks: number;
    maxMarks: number;
    grade: string;
    percentage: number;
  }[];
}

interface ClassInfo {
  id: number;
  name: string;
  grade: {
    level: number;
  };
}

const ReportCardsPage = () => {
  const params = useParams();
  const router = useRouter();
  const examId = params.examId as string;
  const classId = params.classId as string;

  const [reportCards, setReportCards] = useState<ReportCard[]>([]);
  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);

  useEffect(() => {
    const fetchReportCards = async () => {
      try {
        // Fetch class info
        const classResponse = await fetch(`/api/classes/${classId}`);
        if (!classResponse.ok) throw new Error("Failed to fetch class info");
        const classData = await classResponse.json();
        setClassInfo(classData);

        // Fetch report cards
        const response = await fetch(`/api/report-cards/generate/${examId}/${classId}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to fetch report cards");
        }

        const data = await response.json();
        setReportCards(data.reportCards || []);

      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    if (examId && classId) {
      fetchReportCards();
    }
  }, [examId, classId]);

  const handleDownloadPDF = async (studentId: string) => {
    try {
      const response = await fetch(`/api/report-cards/pdf/${examId}/${classId}/${studentId}`);
      if (!response.ok) throw new Error("Failed to generate PDF");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `report-card-${studentId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast.success("PDF downloaded successfully");
    } catch (err) {
      toast.error("Failed to download PDF");
    }
  };

  const handleDownloadAllPDFs = async () => {
    try {
      const response = await fetch(`/api/report-cards/pdf/${examId}/${classId}/bulk`);
      if (!response.ok) throw new Error("Failed to generate bulk PDF");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `report-cards-${classInfo?.name || 'class'}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast.success("All PDFs downloaded successfully");
    } catch (err) {
      toast.error("Failed to download PDFs");
    }
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case "A":
        return "text-green-600 bg-green-50";
      case "B":
        return "text-blue-600 bg-blue-50";
      case "C":
        return "text-yellow-600 bg-yellow-50";
      case "S":
        return "text-orange-600 bg-orange-50";
      case "F":
        return "text-red-600 bg-red-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-md flex-1 m-4 mt-0">
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">Loading report cards...</div>
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

  const selectedReportCard = selectedStudent 
    ? reportCards.find(rc => rc.student.id === selectedStudent)
    : null;

  return (
    <div className="bg-white p-6 rounded-md flex-1 m-4 mt-0 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Report Cards - {classInfo?.name}
          </h1>
          <p className="text-gray-600 mt-1">
            View and download individual report cards
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleDownloadAllPDFs}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md"
          >
            Download All PDFs
          </button>
          <Link
            href={`/list/exams/${examId}/report-workflow`}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md"
          >
            Back to Workflow
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Student List */}
        <div className="lg:col-span-1">
          <div className="bg-gray-50 rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-4">Students</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {reportCards.map((reportCard) => (
                <button
                  key={reportCard.student.id}
                  onClick={() => setSelectedStudent(reportCard.student.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selectedStudent === reportCard.student.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="font-medium">
                    {reportCard.student.name} {reportCard.student.surname}
                  </div>
                  <div className="text-sm text-gray-600">
                    ID: {reportCard.student.username}
                  </div>
                  <div className="text-sm mt-1">
                    <span className={`px-2 py-1 rounded-full text-xs ${getGradeColor(reportCard.overallGrade)}`}>
                      Grade: {reportCard.overallGrade}
                    </span>
                    <span className="ml-2 text-gray-600">
                      Rank: #{reportCard.classRank}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Report Card Details */}
        <div className="lg:col-span-2">
          {selectedReportCard ? (
            <div className="space-y-6">
              {/* Student Header */}
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {selectedReportCard.student.name} {selectedReportCard.student.surname}
                    </h2>
                    <p className="text-gray-600">Student ID: {selectedReportCard.student.username}</p>
                    <p className="text-gray-600">Class: {classInfo?.name}</p>
                  </div>
                  <button
                    onClick={() => handleDownloadPDF(selectedReportCard.student.id)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
                  >
                    Download PDF
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {selectedReportCard.totalMarks}
                    </div>
                    <div className="text-sm text-gray-600">Total Marks</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {selectedReportCard.percentage.toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-600">Percentage</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-2xl font-bold px-3 py-1 rounded-lg ${getGradeColor(selectedReportCard.overallGrade)}`}>
                      {selectedReportCard.overallGrade}
                    </div>
                    <div className="text-sm text-gray-600">Overall Grade</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      #{selectedReportCard.classRank}
                    </div>
                    <div className="text-sm text-gray-600">Class Rank</div>
                  </div>
                </div>
              </div>

              {/* Subject Marks */}
              <div className="bg-white border rounded-lg">
                <div className="p-4 border-b">
                  <h3 className="text-lg font-semibold">Subject-wise Performance</h3>
                </div>
                <div className="p-4">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4">Subject</th>
                          <th className="text-center py-3 px-4">Marks</th>
                          <th className="text-center py-3 px-4">Percentage</th>
                          <th className="text-center py-3 px-4">Grade</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedReportCard.subjects.map((subject, index) => (
                          <tr key={index} className="border-b last:border-b-0">
                            <td className="py-3 px-4 font-medium">
                              {subject.subject.name}
                            </td>
                            <td className="text-center py-3 px-4">
                              {subject.marks} / {subject.maxMarks}
                            </td>
                            <td className="text-center py-3 px-4">
                              {subject.percentage.toFixed(1)}%
                            </td>
                            <td className="text-center py-3 px-4">
                              <span className={`px-3 py-1 rounded-full text-sm ${getGradeColor(subject.grade)}`}>
                                {subject.grade}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Remarks */}
              {selectedReportCard.remarks && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="font-semibold text-yellow-800 mb-2">Remarks</h3>
                  <p className="text-yellow-700">{selectedReportCard.remarks}</p>
                </div>
              )}

              {/* QR Code */}
              {selectedReportCard.qrCode && (
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <h3 className="font-semibold mb-2">Verification QR Code</h3>
                  <div className="inline-block p-4 bg-white rounded-lg">
                    <img 
                      src={selectedReportCard.qrCode} 
                      alt="Verification QR Code"
                      className="w-32 h-32"
                    />
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    Scan to verify authenticity
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
              <div className="text-center">
                <div className="text-gray-400 text-lg mb-2">No student selected</div>
                <div className="text-gray-600">Select a student from the list to view their report card</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Class Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-700">
              {reportCards.length}
            </div>
            <div className="text-sm text-gray-600">Total Students</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {reportCards.filter(rc => rc.overallGrade === "A").length}
            </div>
            <div className="text-sm text-gray-600">Grade A</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {reportCards.filter(rc => rc.overallGrade === "B").length}
            </div>
            <div className="text-sm text-gray-600">Grade B</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {reportCards.filter(rc => rc.overallGrade === "C").length}
            </div>
            <div className="text-sm text-gray-600">Grade C</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {reportCards.filter(rc => rc.overallGrade === "F").length}
            </div>
            <div className="text-sm text-gray-600">Grade F</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportCardsPage;
