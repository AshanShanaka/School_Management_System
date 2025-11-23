"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { exportReportCardsToExcel } from "@/lib/utils/reportCardExport";
import { exportReportCardsToPDF } from "@/lib/utils/reportCardPDFExport";

interface ReportCard {
  id: number;
  examId: number;
  classId: number;
  studentId: string;
  status: string;
  totalMarks: number;
  maxMarks: number;
  percentage: number;
  overallGrade: string;
  classRank: number;
  generatedAt: string;
  student: {
    id: string;
    name: string;
    surname: string;
  };
}

interface Generation {
  id: string;
  label: string;
  examTitle: string;
  examYear: number;
  examTerm: number;
  examType: string;
  className: string;
  gradeLevel: number;
  totalStudents: number;
  averagePercentage: number;
  generatedAt: string;
}

const ViewGeneratedReportCards: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const generationId = params.id as string;

  const [generation, setGeneration] = useState<Generation | null>(null);
  const [reportCards, setReportCards] = useState<ReportCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (generationId) {
      fetchReportCards();
    }
  }, [generationId]);

  const fetchReportCards = async () => {
    try {
      setLoading(true);
      setError("");

      // Fetch generation details and report cards
      const response = await fetch(`/api/report-cards?generationId=${generationId}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch report cards");
      }

      const data = await response.json();
      console.log("Fetched report cards:", data);

      // Extract generation info from first report card
      if (data.reportCards && data.reportCards.length > 0) {
        const firstCard = data.reportCards[0];
        setGeneration({
          id: generationId,
          label: firstCard.generation?.label || "Report Cards",
          examTitle: firstCard.exam?.title || "",
          examYear: firstCard.exam?.year || 0,
          examTerm: firstCard.exam?.term || 0,
          examType: firstCard.exam?.examType?.name || "",
          className: firstCard.class?.name || "",
          gradeLevel: firstCard.class?.grade?.level || 0,
          totalStudents: data.reportCards.length,
          averagePercentage: data.reportCards.reduce((sum: number, card: any) => sum + card.percentage, 0) / data.reportCards.length,
          generatedAt: firstCard.generatedAt,
        });
      }

      setReportCards(data.reportCards || []);
    } catch (err: any) {
      console.error("Error fetching report cards:", err);
      setError(err.message || "Failed to load report cards");
      toast.error(err.message || "Failed to load report cards");
    } finally {
      setLoading(false);
    }
  };

  const exportToPDF = async () => {
    if (!reportCards.length || !generation) return;

    try {
      toast.loading("Generating PDF...");

      // Format data for PDF export
      const formattedData = reportCards.map((card) => ({
        studentId: card.studentId,
        studentName: card.student.name,
        studentSurname: card.student.surname,
        className: generation.className,
        examTitle: generation.examTitle,
        year: generation.examYear,
        term: generation.examTerm,
        subjects: [], // No subject details in this view
        totalMarks: card.totalMarks,
        totalMaxMarks: card.maxMarks,
        percentage: card.percentage,
        average: generation.averagePercentage,
        overallGrade: card.overallGrade,
        classRank: card.classRank,
        classSize: generation.totalStudents,
      }));

      await exportReportCardsToPDF(formattedData);
      toast.dismiss();
      toast.success("PDF exported successfully!");
    } catch (error: any) {
      toast.dismiss();
      console.error("Error exporting to PDF:", error);
      toast.error(error.message || "Failed to export to PDF");
    }
  };

  const exportToExcel = async () => {
    if (!reportCards.length || !generation) return;

    try {
      toast.loading("Generating Excel file...");

      // Format data for Excel export
      const formattedData = reportCards.map((card) => ({
        studentId: card.studentId,
        studentName: card.student.name,
        studentSurname: card.student.surname,
        className: generation.className,
        examTitle: generation.examTitle,
        year: generation.examYear,
        term: generation.examTerm,
        subjects: [], // No subject details in this view
        totalMarks: card.totalMarks,
        totalMaxMarks: card.maxMarks,
        percentage: card.percentage,
        average: generation.averagePercentage,
        overallGrade: card.overallGrade,
        classRank: card.classRank,
        classSize: generation.totalStudents,
      }));

      await exportReportCardsToExcel(formattedData);
      toast.dismiss();
      toast.success("Excel file exported successfully!");
    } catch (error: any) {
      toast.dismiss();
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

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <span className="text-yellow-500 text-xl">🥇</span>;
    if (rank === 2) return <span className="text-gray-400 text-xl">🥈</span>;
    if (rank === 3) return <span className="text-orange-600 text-xl">🥉</span>;
    return null;
  };

  if (loading) {
    return (
      <div className="bg-white p-8 rounded-xl shadow-sm">
        <div className="flex items-center justify-center py-12">
          <svg
            className="animate-spin h-10 w-10 text-indigo-600"
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
          <span className="ml-3 text-lg text-gray-600">Loading report cards...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-8 rounded-xl shadow-sm">
        <div className="text-center py-12">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Report Cards</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.back()}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!generation || reportCards.length === 0) {
    return (
      <div className="bg-white p-8 rounded-xl shadow-sm">
        <div className="text-center py-12">
          <div className="text-gray-300 text-6xl mb-4">📋</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Report Cards Found</h3>
          <p className="text-gray-600 mb-6">This generation has no report cards.</p>
          <button
            onClick={() => router.back()}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 rounded-xl shadow-lg text-white">
        <button
          onClick={() => router.back()}
          className="mb-4 flex items-center gap-2 text-white/90 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Generated Reports
        </button>
        <div>
          <h1 className="text-3xl font-bold mb-2">{generation.label}</h1>
          <div className="flex items-center gap-6 text-indigo-100">
            <span>📚 {generation.className}</span>
            <span>📝 {generation.examType}</span>
            <span>📅 {generation.examYear} - Term {generation.examTerm}</span>
            <span>👥 {generation.totalStudents} Students</span>
            <span>📊 Avg: {generation.averagePercentage.toFixed(1)}%</span>
          </div>
        </div>
      </div>

      {/* Export Buttons */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Generated on {new Date(generation.generatedAt).toLocaleString()}
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportToExcel}
            className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
            Export Excel
          </button>
          <button
            onClick={exportToPDF}
            className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
            Export PDF
          </button>
        </div>
      </div>

      {/* Report Cards Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Rank
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Total Marks
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Percentage
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Grade
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {reportCards.map((card) => (
                <tr key={card.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {getRankBadge(card.classRank)}
                      <span className="text-lg font-bold text-gray-900">#{card.classRank}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="font-semibold text-gray-900">
                        {card.student.name} {card.student.surname}
                      </div>
                      <div className="text-sm text-gray-500">{card.studentId}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="font-semibold text-gray-900">
                      {card.totalMarks}/{card.maxMarks}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="text-lg font-bold text-indigo-600">
                      {card.percentage.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span
                      className={`px-4 py-2 text-lg font-bold rounded-lg border ${getGradeColor(
                        card.overallGrade
                      )}`}
                    >
                      {card.overallGrade}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-semibold rounded-full">
                      {card.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ViewGeneratedReportCards;
