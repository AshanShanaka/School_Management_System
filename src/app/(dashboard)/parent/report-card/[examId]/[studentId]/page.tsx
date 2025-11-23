"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import LanguageSwitcher from "@/components/LanguageSwitcher";

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

const ParentReportCardDetailPage = () => {
  const router = useRouter();
  const params = useParams();
  const { t } = useLanguage();
  const examId = params.examId as string;
  const studentId = params.studentId as string;
  
  const [reportData, setReportData] = useState<ReportCardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (examId && studentId) {
      fetchReportCard();
    }
  }, [examId, studentId]);

  const fetchReportCard = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/parent/report-cards/${examId}/${studentId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setError("Report card not found or results not available yet.");
        } else if (response.status === 403) {
          setError("You don't have access to this report card.");
        } else {
          throw new Error("Failed to fetch report card");
        }
        return;
      }
      
      const data = await response.json();
      
      // Generate simple index number
      const generateIndexNo = (studentId: string) => {
        let hash = 0;
        for (let i = 0; i < studentId.length; i++) {
          hash = ((hash << 5) - hash) + studentId.charCodeAt(i);
          hash = hash & hash;
        }
        return String(Math.abs(hash) % 1000).padStart(3, '0');
      };
      
      const studentName = data.reportCard?.student?.name || '';
      const studentSurname = data.reportCard?.student?.surname || '';
      const examStartDate = data.reportCard?.exam?.startDate;
      const examYear = examStartDate ? new Date(examStartDate).getFullYear() : 2025;
      const gradeLevel = data.reportCard?.class?.grade?.level || 
                        data.reportCard?.exam?.grade?.level || 10;
      
      const rank = data.examSummary?.rank || data.examSummary?.classRank || 0;
      const classSize = data.examSummary?.classSize || 0;
      const average = data.examSummary?.average || 0;
      const classAverage = data.examSummary?.classAverage || average;
      
      // Calculate subjects average
      let subjectsAverage = 0;
      if (data.subjects && data.subjects.length > 0) {
        const totalPercentage = data.subjects.reduce((sum: number, subj: any) => {
          return sum + (parseFloat(subj.percentage) || 0);
        }, 0);
        subjectsAverage = totalPercentage / data.subjects.length;
      }
      
      const transformedData: ReportCardData = {
        student: {
          id: data.reportCard?.studentId || '',
          firstName: studentName,
          lastName: studentSurname,
          studentId: generateIndexNo(data.reportCard?.studentId || '001'),
          grade: {
            level: gradeLevel
          }
        },
        exam: {
          id: String(data.reportCard?.examId || ''),
          title: data.reportCard?.exam?.title || 'Examination',
          year: examYear,
          term: data.reportCard?.exam?.term || 'Term 1',
          examDate: examStartDate || new Date().toISOString()
        },
        results: data.subjects?.map((subj: any) => ({
          subject: {
            name: subj.subjectName,
            code: subj.subjectName.substring(0, 3).toUpperCase()
          },
          score: parseFloat(subj.percentage) || 0,
          grade: subj.grade || 'N/A'
        })) || [],
        totalMarks: data.examSummary?.totalMaxMarks || 0,
        totalObtained: data.examSummary?.totalMarks || 0,
        percentage: subjectsAverage || average,
        overallGrade: data.examSummary?.overallGrade || 'N/A',
        classRank: rank > 0 ? rank : 0,
        totalStudents: classSize,
        classAverage: subjectsAverage || classAverage
      };
      
      setReportData(transformedData);
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
      'A': 'text-green-600 bg-green-50',
      'B': 'text-blue-600 bg-blue-50',
      'C': 'text-yellow-600 bg-yellow-50',
      'S': 'text-orange-600 bg-orange-50',
      'W': 'text-red-600 bg-red-50',
      'AB': 'text-gray-600 bg-gray-50',
    };
    return colors[grade] || 'text-gray-600 bg-gray-50';
  };

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-md shadow-md">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          <span className="ml-2 text-gray-600">{t("reportCard.loading")}</span>
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
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 mr-4"
          >
            {t("reportCard.goBack")}
          </button>
          <button
            onClick={fetchReportCard}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            {t("reportCard.tryAgain")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 print:p-0 print:bg-white">
      {/* Language Switcher - Hidden when printing */}
      <div className="mb-4 print:hidden flex justify-end">
        <LanguageSwitcher />
      </div>

      {/* Print/Back Controls - Hidden when printing */}
      <div className="mb-4 print:hidden">
        <div className="flex justify-between items-center">
          <button
            onClick={() => router.back()}
            className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 font-medium transition-colors shadow-md"
          >
            {t("reportCard.backButton")}
          </button>
          <button
            onClick={handlePrint}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-800 text-white rounded-lg hover:from-purple-700 hover:to-purple-900 font-medium transition-colors shadow-md"
          >
            {t("reportCard.printButton")}
          </button>
        </div>
      </div>

      {/* Report Card */}
      <div className="max-w-4xl mx-auto bg-white shadow-lg print:shadow-none print:max-w-none border-4 border-purple-600">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white p-6 print:bg-purple-700">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-1">{t("reportCard.header")}</h1>
            <p className="text-lg">{t("reportCard.academicYear")} {reportData.exam.year}</p>
          </div>
        </div>

        {/* Student & Exam Information */}
        <div className="p-6 border-b-2 border-gray-300">
          <div className="grid grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-3">
              <div className="flex border-b border-gray-300 pb-2">
                <span className="font-semibold text-gray-700 w-32">{t("reportCard.name")}</span>
                <span className="text-gray-900 font-medium flex-1 border-b border-dotted border-gray-400">
                  {reportData.student.firstName} {reportData.student.lastName}
                </span>
              </div>
              <div className="flex border-b border-gray-300 pb-2">
                <span className="font-semibold text-gray-700 w-32">{t("reportCard.indexNo")}</span>
                <span className="text-gray-900 font-medium flex-1 border-b border-dotted border-gray-400">
                  {reportData.student.studentId}
                </span>
              </div>
              <div className="flex border-b border-gray-300 pb-2">
                <span className="font-semibold text-gray-700 w-32">{t("reportCard.grade")}</span>
                <span className="text-gray-900 font-medium flex-1 border-b border-dotted border-gray-400">
                  {t("reportCard.grade")} {reportData.student.grade.level}
                </span>
              </div>
            </div>
            
            {/* Right Column */}
            <div className="space-y-3">
              <div className="flex border-b border-gray-300 pb-2">
                <span className="font-semibold text-gray-700 w-32">{t("reportCard.examination")}</span>
                <span className="text-gray-900 font-medium flex-1 border-b border-dotted border-gray-400">
                  {reportData.exam.title}
                </span>
              </div>
              <div className="flex border-b border-gray-300 pb-2">
                <span className="font-semibold text-gray-700 w-32">{t("reportCard.year")}</span>
                <span className="text-gray-900 font-medium flex-1 border-b border-dotted border-gray-400">
                  {reportData.exam.year}
                </span>
              </div>
              <div className="flex border-b border-gray-300 pb-2">
                <span className="font-semibold text-gray-700 w-32">{t("reportCard.term")}</span>
                <span className="text-gray-900 font-medium flex-1 border-b border-dotted border-gray-400">
                  {reportData.exam.term}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Results Table */}
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full border-2 border-gray-800">
              <thead>
                <tr className="bg-gray-200 border-2 border-gray-800">
                  <th className="border-2 border-gray-800 px-4 py-3 text-left font-bold text-gray-900">{t("reportCard.subject")}</th>
                  <th className="border-2 border-gray-800 px-4 py-3 text-center font-bold text-gray-900">{t("reportCard.marks")}</th>
                  <th className="border-2 border-gray-800 px-4 py-3 text-center font-bold text-gray-900">{t("reportCard.gradeColumn")}</th>
                </tr>
              </thead>
              <tbody>
                {reportData.results.map((result, index) => (
                  <tr key={index} className="border-2 border-gray-800">
                    <td className="border-2 border-gray-800 px-4 py-3 font-medium text-gray-900">{result.subject.name}</td>
                    <td className="border-2 border-gray-800 px-4 py-3 text-center font-bold text-lg">{Number(result.score || 0).toFixed(1)}</td>
                    <td className="border-2 border-gray-800 px-4 py-3 text-center">
                      <span className="font-bold text-lg text-gray-900">
                        {result.grade}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary Section */}
        <div className="p-6 border-t-2 border-gray-800 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Performance Metrics */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900 border-b-2 border-purple-600 pb-2">{t("reportCard.performanceSummary")}</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center bg-white p-3 rounded border border-gray-300">
                  <span className="font-semibold text-gray-700">{t("reportCard.totalMarksObtained")}</span>
                  <span className="font-bold text-xl text-purple-700">{reportData.totalObtained} / {reportData.totalMarks}</span>
                </div>
                <div className="flex justify-between items-center bg-white p-3 rounded border border-gray-300">
                  <span className="font-semibold text-gray-700">{t("reportCard.averagePercentage")}</span>
                  <span className="font-bold text-xl text-green-700">{reportData.percentage?.toFixed(1) || '0.0'}%</span>
                </div>
              </div>
            </div>
            
            {/* Class Position */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900 border-b-2 border-purple-600 pb-2">{t("reportCard.classPosition")}</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center bg-white p-3 rounded border border-gray-300">
                  <span className="font-semibold text-gray-700">{t("reportCard.classRank")}</span>
                  <span className="font-bold text-2xl text-purple-700">
                    {reportData.classRank > 0 ? `#${reportData.classRank}` : t("reportCard.notRankedYet")}
                  </span>
                </div>
                <div className="flex justify-between items-center bg-white p-3 rounded border border-gray-300">
                  <span className="font-semibold text-gray-700">{t("reportCard.totalStudents")}</span>
                  <span className="font-bold text-xl text-gray-800">{reportData.totalStudents || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center bg-white p-3 rounded border border-gray-300">
                  <span className="font-semibold text-gray-700">{t("reportCard.subjectsAverage")}</span>
                  <span className="font-bold text-xl text-blue-700">{reportData.classAverage?.toFixed(1) || '0.0'}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-gradient-to-r from-purple-600 to-purple-800 text-white text-center print:bg-purple-700">
          <p className="text-sm">
            {t("reportCard.reportGenerated")}: {new Date().toLocaleDateString('en-GB')} | {t("reportCard.keepStriving")}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ParentReportCardDetailPage;
