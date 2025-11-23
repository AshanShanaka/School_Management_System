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
      console.log('[STUDENT PAGE] Fetching report card for examId:', examId);
      
      // Call API without studentId, let the backend determine from the current user
      const response = await fetch(`/api/student/report-cards/${examId}`);
      console.log('[STUDENT PAGE] Response status:', response.status);
      
      if (!response.ok) {
        if (response.status === 404) {
          setError("Report card not found or results not available yet.");
        } else {
          throw new Error("Failed to fetch report card");
        }
        return;
      }
      
      const data = await response.json();
      console.log('[STUDENT PAGE] ========== RAW API RESPONSE ==========');
      console.log('[STUDENT PAGE] Full data:', JSON.stringify(data, null, 2));
      console.log('[STUDENT PAGE] Report Card:', data.reportCard);
      console.log('[STUDENT PAGE] Student:', data.reportCard?.student);
      console.log('[STUDENT PAGE] Exam Summary:', data.examSummary);
      console.log('[STUDENT PAGE] ========================================');
      
      // Extract student name
      const studentName = data.reportCard?.student?.name || '';
      const studentSurname = data.reportCard?.student?.surname || '';
      console.log('[STUDENT PAGE] Extracted name:', studentName, studentSurname);
      
      // Generate a simple 3-digit index number from the last part of student ID
      const studentId = data.reportCard?.studentId || '';
      console.log('[STUDENT PAGE] Student ID:', studentId);
      
      // Create a simple numeric index from the ID hash
      let indexNo = '001';
      if (studentId) {
        // Convert ID to a number by taking hash code
        let hash = 0;
        for (let i = 0; i < studentId.length; i++) {
          hash = ((hash << 5) - hash) + studentId.charCodeAt(i);
          hash = hash & hash; // Convert to 32bit integer
        }
        indexNo = String(Math.abs(hash) % 1000).padStart(3, '0');
      }
      console.log('[STUDENT PAGE] Generated Index No:', indexNo);
      
      // Get grade level
      const gradeLevel = data.reportCard?.class?.grade?.level || 
                        data.reportCard?.exam?.grade?.level || 0;
      console.log('[STUDENT PAGE] Grade Level:', gradeLevel);
      
      // Get exam year
      const examStartDate = data.reportCard?.exam?.startDate;
      console.log('[STUDENT PAGE] Exam Start Date:', examStartDate);
      const examYear = examStartDate ? new Date(examStartDate).getFullYear() : 2025;
      console.log('[STUDENT PAGE] Exam Year:', examYear);
      
      // Get rank and class info
      const rank = data.examSummary?.rank || data.examSummary?.classRank || 0;
      const classSize = data.examSummary?.classSize || 0;
      const average = data.examSummary?.average || 0;
      const classAverage = data.examSummary?.classAverage || average;
      
      // Calculate subjects average from the subjects data
      let subjectsAverage = 0;
      if (data.subjects && data.subjects.length > 0) {
        const totalPercentage = data.subjects.reduce((sum: number, subj: any) => {
          return sum + (parseFloat(subj.percentage) || 0);
        }, 0);
        subjectsAverage = totalPercentage / data.subjects.length;
      }
      
      console.log('[STUDENT PAGE] Rank:', rank, 'Class Size:', classSize, 'Average:', average, 'Class Avg:', classAverage, 'Subjects Avg:', subjectsAverage);
      
      // Transform API data to match component's expected structure
      const transformedData: ReportCardData = {
        student: {
          id: studentId,
          firstName: studentName,
          lastName: studentSurname,
          studentId: indexNo,
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
      
      console.log('[STUDENT PAGE] ========== TRANSFORMED DATA ==========');
      console.log('[STUDENT PAGE] Student Name:', transformedData.student.firstName, transformedData.student.lastName);
      console.log('[STUDENT PAGE] Index No:', transformedData.student.studentId);
      console.log('[STUDENT PAGE] Grade:', transformedData.student.grade.level);
      console.log('[STUDENT PAGE] Year:', transformedData.exam.year);
      console.log('[STUDENT PAGE] Class Rank:', transformedData.classRank);
      console.log('[STUDENT PAGE] Percentage:', transformedData.percentage);
      console.log('[STUDENT PAGE] =======================================');
      
      console.log('[STUDENT PAGE] Transformed data:', transformedData);
      setReportData(transformedData);
    } catch (err) {
      console.error("[STUDENT PAGE] Error fetching report card:", err);
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
            className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 font-medium transition-colors shadow-md"
          >
            ← Back to Reports
          </button>
          <button
            onClick={handlePrint}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-800 text-white rounded-lg hover:from-purple-700 hover:to-purple-900 font-medium transition-colors shadow-md"
          >
            🖨️ Print Report Card
          </button>
        </div>
      </div>

      {/* Report Card */}
      <div className="max-w-4xl mx-auto bg-white shadow-lg print:shadow-none print:max-w-none border-4 border-purple-600">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white p-6 print:bg-purple-700">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-1">REPORT CARD</h1>
            <p className="text-lg">Academic Year {reportData.exam.year}</p>
          </div>
        </div>

        {/* Student & Exam Information */}
        <div className="p-6 border-b-2 border-gray-300">
          <div className="grid grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-3">
              <div className="flex border-b border-gray-300 pb-2">
                <span className="font-semibold text-gray-700 w-32">Name:</span>
                <span className="text-gray-900 font-medium flex-1 border-b border-dotted border-gray-400">
                  {reportData.student.firstName} {reportData.student.lastName}
                </span>
              </div>
              <div className="flex border-b border-gray-300 pb-2">
                <span className="font-semibold text-gray-700 w-32">Index No:</span>
                <span className="text-gray-900 font-medium flex-1 border-b border-dotted border-gray-400">
                  {reportData.student.studentId}
                </span>
              </div>
              <div className="flex border-b border-gray-300 pb-2">
                <span className="font-semibold text-gray-700 w-32">Grade:</span>
                <span className="text-gray-900 font-medium flex-1 border-b border-dotted border-gray-400">
                  Grade {reportData.student.grade.level}
                </span>
              </div>
            </div>
            
            {/* Right Column */}
            <div className="space-y-3">
              <div className="flex border-b border-gray-300 pb-2">
                <span className="font-semibold text-gray-700 w-32">Examination:</span>
                <span className="text-gray-900 font-medium flex-1 border-b border-dotted border-gray-400">
                  {reportData.exam.title}
                </span>
              </div>
              <div className="flex border-b border-gray-300 pb-2">
                <span className="font-semibold text-gray-700 w-32">Year:</span>
                <span className="text-gray-900 font-medium flex-1 border-b border-dotted border-gray-400">
                  {reportData.exam.year}
                </span>
              </div>
              <div className="flex border-b border-gray-300 pb-2">
                <span className="font-semibold text-gray-700 w-32">Term:</span>
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
                  <th className="border-2 border-gray-800 px-4 py-3 text-left font-bold text-gray-900">Subject</th>
                  <th className="border-2 border-gray-800 px-4 py-3 text-center font-bold text-gray-900">Marks (%)</th>
                  <th className="border-2 border-gray-800 px-4 py-3 text-center font-bold text-gray-900">Grade</th>
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
              <h3 className="text-lg font-bold text-gray-900 border-b-2 border-purple-600 pb-2">Performance Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center bg-white p-3 rounded border border-gray-300">
                  <span className="font-semibold text-gray-700">Total Marks Obtained:</span>
                  <span className="font-bold text-xl text-purple-700">{reportData.totalObtained} / {reportData.totalMarks}</span>
                </div>
                <div className="flex justify-between items-center bg-white p-3 rounded border border-gray-300">
                  <span className="font-semibold text-gray-700">Average Percentage:</span>
                  <span className="font-bold text-xl text-green-700">{reportData.percentage?.toFixed(1) || '0.0'}%</span>
                </div>
              </div>
            </div>
            
            {/* Class Position */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900 border-b-2 border-purple-600 pb-2">Class Position</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center bg-white p-3 rounded border border-gray-300">
                  <span className="font-semibold text-gray-700">Class Rank:</span>
                  <span className="font-bold text-2xl text-purple-700">
                    {reportData.classRank > 0 ? `#${reportData.classRank}` : 'Not Ranked Yet'}
                  </span>
                </div>
                <div className="flex justify-between items-center bg-white p-3 rounded border border-gray-300">
                  <span className="font-semibold text-gray-700">Total Students:</span>
                  <span className="font-bold text-xl text-gray-800">{reportData.totalStudents || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center bg-white p-3 rounded border border-gray-300">
                  <span className="font-semibold text-gray-700">Subjects Average:</span>
                  <span className="font-bold text-xl text-blue-700">{reportData.classAverage?.toFixed(1) || '0.0'}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>


      </div>
    </div>
  );
};

export default StudentReportCardPage;
