"use client";

import React, { useState } from "react";
import { toast } from "react-hot-toast";
import { exportReportCardsToExcel } from "@/lib/utils/reportCardExport";
import { exportReportCardsToPDF } from "@/lib/utils/reportCardPDFExport";

interface Class {
  id: number;
  name: string;
  grade: {
    id: number;
    level: number;
  };
  _count: {
    students: number;
  };
}

interface Exam {
  id: number;
  title: string;
  year: number;
  term: number;
  status: string;
  grade: {
    id: number;
    level: number;
  };
  examType: {
    id: number;
    name: string;
  };
}

interface ReportCardData {
  studentId: string;
  studentName: string;
  studentSurname: string;
  className: string;
  examTitle: string;
  year: number;
  term: number;
  subjects: any[];
  totalMarks: number;
  totalMaxMarks: number;
  percentage: number;
  average: number;
  overallGrade: string;
  classRank: number;
  classSize: number;
}

interface ReportCardGeneratorClientProps {
  classes: Class[];
  exams: Exam[];
  userRole: string;
}

const ReportCardGeneratorClient: React.FC<ReportCardGeneratorClientProps> = ({
  classes,
  exams,
  userRole,
}) => {
  // Auto-select class for class teachers (they should only have one class)
  const isClassTeacher = userRole === "teacher" && classes.length === 1;
  const initialClassId = isClassTeacher ? classes[0]?.id || null : null;
  
  const [selectedClassId, setSelectedClassId] = useState<number | null>(initialClassId);
  const [selectedExamId, setSelectedExamId] = useState<number | null>(null);
  const [generating, setGenerating] = useState(false);
  const [reportCards, setReportCards] = useState<ReportCardData[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [generationInfo, setGenerationInfo] = useState<any>(null);

  const selectedClass = classes.find((cls) => cls.id === selectedClassId);
  const selectedExam = exams.find((exam) => exam.id === selectedExamId);

  // Filter exams based on selected class grade
  const filteredExams = selectedClassId
    ? exams.filter((exam) => exam.grade.id === selectedClass?.grade.id)
    : exams;

  const handleGenerate = async () => {
    if (!selectedClassId || !selectedExamId) {
      toast.error("Please select both a class and an exam");
      return;
    }

    setGenerating(true);
    setShowResults(false);

    try {
      const response = await fetch("/api/report-cards/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          examId: selectedExamId,
          classId: selectedClassId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate report cards");
      }

      setReportCards(data.reportCards);
      setGenerationInfo(data.generation);
      setShowResults(true);
      
      // Show success message with generation label
      toast.success(
        <div>
          <div className="font-bold">Report Cards Generated!</div>
          <div className="text-sm mt-1">{data.generation?.label}</div>
          <div className="text-xs text-gray-600 mt-1">
            {data.count} students • Avg: {data.generation?.averagePercentage?.toFixed(1)}%
          </div>
        </div>,
        { duration: 5000 }
      );
    } catch (error: any) {
      console.error("Error generating report cards:", error);
      toast.error(error.message || "Failed to generate report cards");
    } finally {
      setGenerating(false);
    }
  };

  const exportToPDF = async () => {
    try {
      if (reportCards.length === 0) {
        toast.error("No report cards to export");
        return;
      }
      exportReportCardsToPDF(reportCards);
      toast.success("PDF file downloaded successfully!");
    } catch (error: any) {
      console.error("Error exporting to PDF:", error);
      toast.error(error.message || "Failed to export to PDF");
    }
  };

  const exportToExcel = async () => {
    try {
      if (reportCards.length === 0) {
        toast.error("No report cards to export");
        return;
      }
      exportReportCardsToExcel(reportCards);
      toast.success("Excel file downloaded successfully!");
    } catch (error: any) {
      console.error("Error exporting to Excel:", error);
      toast.error(error.message || "Failed to export to Excel");
    }
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case "A":
        return "bg-green-100 text-green-800 border-green-200";
      case "B":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "C":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "S":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "W":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Selection Section */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 mb-4">
          {isClassTeacher ? "Generate Report Cards for Your Class" : "Select Class and Exam"}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Class Selection - Show info card for class teachers, dropdown for admin */}
          {isClassTeacher ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Assigned Class
              </label>
              <div className="w-full px-4 py-3 border-2 border-indigo-200 bg-indigo-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-indigo-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                  </svg>
                  <div>
                    <div className="font-semibold text-gray-900">
                      {selectedClass?.name}
                    </div>
                    <div className="text-sm text-gray-600">
                      Grade {selectedClass?.grade.level} • {selectedClass?._count.students} students
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Class
              </label>
              <select
                value={selectedClassId || ""}
                onChange={(e) => {
                  setSelectedClassId(e.target.value ? Number(e.target.value) : null);
                  setSelectedExamId(null);
                  setShowResults(false);
                }}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="">Select a class</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} (Grade {cls.grade.level}) - {cls._count.students} students
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Exam
            </label>
            <select
              value={selectedExamId || ""}
              onChange={(e) => {
                setSelectedExamId(e.target.value ? Number(e.target.value) : null);
                setShowResults(false);
              }}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
              disabled={!selectedClassId}
            >
              <option value="">Select an exam</option>
              {filteredExams.map((exam) => (
                <option key={exam.id} value={exam.id}>
                  {exam.title} - Year {exam.year}, Term {exam.term}
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedClassId && selectedExamId && (
          <div className="mt-4 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-indigo-600 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="flex-1">
                <h4 className="font-semibold text-indigo-900 mb-1">
                  Generate Report Cards for:
                </h4>
                <p className="text-sm text-indigo-700">
                  <strong>Class:</strong> {selectedClass?.name} (
                  {selectedClass?._count.students} students)
                </p>
                <p className="text-sm text-indigo-700">
                  <strong>Exam:</strong> {selectedExam?.title} - Year{" "}
                  {selectedExam?.year}, Term {selectedExam?.term}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 flex gap-3">
          <button
            onClick={handleGenerate}
            disabled={!selectedClassId || !selectedExamId || generating}
            className={`flex-1 px-6 py-3 rounded-lg font-semibold text-white transition-colors flex items-center justify-center gap-2 ${
              selectedClassId && selectedExamId && !generating
                ? "bg-indigo-600 hover:bg-indigo-700"
                : "bg-gray-400 cursor-not-allowed"
            }`}
          >
            {generating ? (
              <>
                <svg
                  className="animate-spin h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Generating...
              </>
            ) : (
              <>
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
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Generate Report Cards
              </>
            )}
          </button>
        </div>
      </div>

      {/* Results Section */}
      {showResults && reportCards.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          {/* Generation Info Banner */}
          {generationInfo && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-green-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
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
                <div className="flex-1">
                  <h3 className="font-bold text-green-900 text-lg">
                    ✓ Report Cards Generated Successfully
                  </h3>
                  <p className="text-sm text-green-700 font-medium mt-1">
                    {generationInfo.label}
                  </p>
                  <div className="flex gap-4 mt-2 text-xs text-green-600">
                    <span>
                      <strong>Students:</strong> {generationInfo.totalStudents}
                    </span>
                    <span>
                      <strong>Class Average:</strong>{" "}
                      {generationInfo.averagePercentage?.toFixed(1)}%
                    </span>
                    <span>
                      <strong>Generated:</strong>{" "}
                      {new Date(generationInfo.generatedAt).toLocaleString()}
                    </span>
                  </div>
                </div>
                <a
                  href="/teacher/generated-reports"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center gap-2 whitespace-nowrap"
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
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  View All Generated Reports
                </a>
              </div>
            </div>
          )}
          
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">
                Generated Report Cards
              </h3>
              <p className="text-indigo-100 text-sm mt-1">
                {reportCards.length} students • Click to view details
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={exportToExcel}
                className="px-4 py-2 bg-white text-indigo-600 rounded-lg font-semibold hover:bg-indigo-50 transition-colors flex items-center gap-2"
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
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Export Excel
              </button>
              <button
                onClick={exportToPDF}
                className="px-4 py-2 bg-white text-indigo-600 rounded-lg font-semibold hover:bg-indigo-50 transition-colors flex items-center gap-2"
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
                    d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
                Export PDF
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b-2 border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Rank
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Student Name
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Total Marks
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Percentage
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Grade
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Subjects
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {reportCards.map((card, index) => (
                  <tr
                    key={card.studentId}
                    className={`hover:bg-gray-50 transition-colors ${
                      index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                    }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {card.classRank <= 3 && (
                          <svg
                            className={`w-5 h-5 ${
                              card.classRank === 1
                                ? "text-yellow-500"
                                : card.classRank === 2
                                ? "text-gray-400"
                                : "text-orange-600"
                            }`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        )}
                        <span className="text-sm font-bold text-gray-900">
                          #{card.classRank}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        {card.studentName} {card.studentSurname}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="text-sm font-bold text-gray-900">
                        {card.totalMarks}
                        <span className="text-gray-500 font-normal">
                          /{card.totalMaxMarks}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="text-sm font-bold text-indigo-600">
                        {card.percentage.toFixed(1)}%
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span
                        className={`px-3 py-1 inline-flex text-sm leading-5 font-bold rounded-full border ${getGradeColor(
                          card.overallGrade
                        )}`}
                      >
                        {card.overallGrade}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="text-sm text-gray-600">
                        {card.subjects.length} subjects
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportCardGeneratorClient;
