"use client";

import React, { useState, useMemo } from "react";

interface Grade {
  id: number;
  level: number;
}

interface ExamType {
  id: number;
  name: string;
}

interface Class {
  id: number;
  name: string;
  grade?: Grade;
}

interface Student {
  id: string;
  name: string;
  surname: string;
  username: string;
  class: Class;
}

interface Subject {
  id: number;
  name: string;
}

interface Teacher {
  id: string;
  name: string;
  surname: string;
}

interface Exam {
  id: number;
  title: string;
  year: number;
  term: number;
  status: string;
  grade: Grade;
  examType: ExamType;
}

interface ExamSubject {
  id: number;
  maxMarks: number;
  subject: Subject;
  teacher: Teacher | null;
}

interface ExamResult {
  id: string;
  marks: number;
  grade: string | null;
  exam: Exam;
  examSubject: ExamSubject;
  student: Student;
}

interface ExamSummary {
  id: string;
  totalMarks: number;
  totalMaxMarks: number;
  percentage: number;
  average: number;
  overallGrade: string;
  classRank: number | null;
  classSize: number | null;
  exam: Exam;
  student: Student;
}

interface ReportCard {
  id: string;
  status: string;
  percentage: number | null;
  overallGrade: string | null;
  classRank: number | null;
  totalMarks: number | null;
  maxMarks: number | null;
  generatedAt: string;
  exam: Exam;
  student: Student;
}

interface StudentExamResultsClientProps {
  examSummaries: ExamSummary[];
  examResults: ExamResult[];
  reportCards: ReportCard[];
  userRole: string;
  subjectStats: Record<string, {
    resultId: string;
    classAverage: number;
    rank: number;
    classSize: number;
  }>;
}

const StudentExamResultsClient: React.FC<StudentExamResultsClientProps> = ({
  examSummaries,
  examResults,
  reportCards,
  userRole,
  subjectStats,
}) => {
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedTerm, setSelectedTerm] = useState<number | null>(null);
  const [selectedExamId, setSelectedExamId] = useState<number | null>(null);

  console.log('examSummaries:', examSummaries.length);
  console.log('examResults:', examResults.length);

  const students = useMemo(() => {
    return Array.from(
      new Map(
        examSummaries.map(summary => [summary.student.id, summary.student])
      ).values()
    );
  }, [examSummaries]);

  const availableYears = useMemo(() => {
    const years = Array.from(new Set(examResults.map(r => r.exam.year)));
    return years.sort((a, b) => b - a);
  }, [examResults]);

  const availableTerms = useMemo(() => {
    if (!selectedYear) return [];
    const terms = Array.from(
      new Set(
        examResults
          .filter(r => r.exam.year === selectedYear)
          .map(r => r.exam.term)
      )
    );
    return terms.sort((a, b) => a - b);
  }, [examResults, selectedYear]);

  React.useEffect(() => {
    if (availableYears.length > 0 && !selectedYear) {
      setSelectedYear(availableYears[0]);
    }
  }, [availableYears, selectedYear]);

  React.useEffect(() => {
    if (availableTerms.length > 0 && !selectedTerm) {
      setSelectedTerm(availableTerms[0]);
    } else if (selectedTerm && !availableTerms.includes(selectedTerm)) {
      setSelectedTerm(availableTerms[0] || null);
    }
  }, [availableTerms, selectedTerm]);

  const filteredResults = useMemo(() => {
    let filtered = examResults;
    if (selectedStudent) {
      filtered = filtered.filter(r => r.student.id === selectedStudent);
    }
    if (selectedYear) {
      filtered = filtered.filter(r => r.exam.year === selectedYear);
    }
    if (selectedTerm) {
      filtered = filtered.filter(r => r.exam.term === selectedTerm);
    }
    if (selectedExamId) {
      filtered = filtered.filter(r => r.exam.id === selectedExamId);
    }
    return filtered;
  }, [examResults, selectedStudent, selectedYear, selectedTerm, selectedExamId]);

  const filteredSummaries = useMemo(() => {
    let filtered = examSummaries;
    if (selectedStudent) {
      filtered = filtered.filter(s => s.student.id === selectedStudent);
    }
    if (selectedYear) {
      filtered = filtered.filter(s => s.exam.year === selectedYear);
    }
    if (selectedTerm) {
      filtered = filtered.filter(s => s.exam.term === selectedTerm);
    }
    return filtered;
  }, [examSummaries, selectedStudent, selectedYear, selectedTerm]);

  const calculateGrade = (percentage: number): string => {
    if (percentage >= 75) return "A";
    if (percentage >= 65) return "B";
    if (percentage >= 50) return "C";
    if (percentage >= 35) return "S";
    return "F";
  };

  const currentSummary = useMemo(() => {
    if (!selectedExamId) return null;
    
    // Get the exam summary from database
    const dbSummary = examSummaries.find(s => s.exam.id === selectedExamId);
    
    // Calculate actual totals from exam results
    const examSubjectResults = filteredResults.filter(r => r.exam.id === selectedExamId);
    
    if (examSubjectResults.length === 0) return dbSummary;
    
    const totalMarks = examSubjectResults.reduce((sum, r) => sum + r.marks, 0);
    const totalMaxMarks = examSubjectResults.reduce((sum, r) => sum + r.examSubject.maxMarks, 0);
    const percentage = totalMaxMarks > 0 ? (totalMarks / totalMaxMarks) * 100 : 0;
    const overallGrade = calculateGrade(percentage);
    
    // Calculate class average from subject stats
    let classAverageTotal = 0;
    let classAverageCount = 0;
    examSubjectResults.forEach(r => {
      const stats = subjectStats[r.id];
      if (stats && stats.classAverage) {
        classAverageTotal += (stats.classAverage / r.examSubject.maxMarks) * 100;
        classAverageCount++;
      }
    });
    const average = classAverageCount > 0 ? classAverageTotal / classAverageCount : 0;
    
    return {
      ...dbSummary,
      totalMarks,
      totalMaxMarks,
      percentage,
      average,
      overallGrade,
    } as ExamSummary;
  }, [examSummaries, selectedExamId, filteredResults, subjectStats]);

  const getGradeColor = (grade: string | null) => {
    if (!grade) return "bg-gray-100 text-gray-800";
    switch (grade) {
      case "A": return "bg-green-100 text-green-800 border-green-200";
      case "B": return "bg-blue-100 text-blue-800 border-blue-200";
      case "C": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "S": return "bg-orange-100 text-orange-800 border-orange-200";
      case "W": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getPercentageColor = (percentage: number) => {
    if (percentage >= 75) return "text-green-600";
    if (percentage >= 65) return "text-blue-600";
    if (percentage >= 50) return "text-yellow-600";
    if (percentage >= 35) return "text-orange-600";
    return "text-red-600";
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 75) return "bg-green-500";
    if (percentage >= 65) return "bg-blue-500";
    if (percentage >= 50) return "bg-yellow-500";
    if (percentage >= 35) return "bg-orange-500";
    return "bg-red-500";
  };

  if (examResults.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="text-gray-400 mb-4">
          <svg className="w-20 h-20 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-xl font-medium text-gray-500 mb-2">No Results Available</h3>
        <p className="text-gray-400 text-center max-w-md">
          No exam results have been published yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Show Exam List when no exam is selected */}
      {!selectedExamId && examSummaries.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4">
            <h3 className="text-lg font-bold text-white">My Exam Results</h3>
            <p className="text-indigo-100 text-sm mt-1">Click on any exam to view detailed subject-wise results</p>
          </div>
          <div className="divide-y">
            {examSummaries.map((summary) => {
              // Calculate totals from exam results
              const examSubjectResults = examResults.filter(r => r.exam.id === summary.exam.id);
              const totalMarks = examSubjectResults.reduce((sum, r) => sum + r.marks, 0);
              const totalMaxMarks = examSubjectResults.reduce((sum, r) => sum + r.examSubject.maxMarks, 0);
              const percentage = totalMaxMarks > 0 ? (totalMarks / totalMaxMarks) * 100 : summary.percentage;
              const calculatedGrade = calculateGrade(percentage);
              
              return (
                <div key={summary.id} className="p-6 hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => setSelectedExamId(summary.exam.id)}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h4 className="text-2xl font-bold text-gray-900">{summary.exam.title}</h4>
                        <span className={`px-4 py-1.5 rounded-full text-base font-bold border-2 ${getGradeColor(calculatedGrade)}`}>
                          Grade {calculatedGrade}
                        </span>
                        <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-semibold">
                          Year {summary.exam.year} • Term {summary.exam.term}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                          <div className="text-xs text-blue-600 font-semibold mb-1">Total Marks</div>
                          <div className="text-2xl font-bold text-blue-900">
                            {totalMarks}<span className="text-base text-blue-600">/{totalMaxMarks}</span>
                          </div>
                        </div>
                        <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                          <div className="text-xs text-green-600 font-semibold mb-1">Percentage</div>
                          <div className={`text-2xl font-bold ${getPercentageColor(percentage)}`}>
                            {percentage.toFixed(1)}%
                          </div>
                        </div>
                        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
                          <div className="text-xs text-purple-600 font-semibold mb-1">Class Average</div>
                          <div className="text-2xl font-bold text-purple-900">
                            {summary.average.toFixed(1)}%
                          </div>
                        </div>
                        <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200">
                          <div className="text-xs text-orange-600 font-semibold mb-1">Class Rank</div>
                          <div className="text-2xl font-bold text-orange-900">
                            #{summary.classRank || "N/A"}
                          </div>
                        </div>
                      </div>
                      {/* Progress Bar */}
                      <div className="w-full bg-gray-200 rounded-full h-3 mt-4">
                        <div
                          className={`h-3 rounded-full ${getProgressColor(percentage)}`}
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                      </div>
                    </div>
                    <div className="ml-6 flex items-center gap-2 text-indigo-600">
                      <span className="font-semibold text-sm">View Details</span>
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Show Detailed Results when an exam is selected */}
      {selectedExamId && currentSummary && (
        <>
          {/* Back Button */}
          <button
            onClick={() => setSelectedExamId(null)}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Exam List
          </button>

          {/* Summary Card */}
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-6 rounded-xl shadow-lg text-white">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-2xl font-bold">{currentSummary.exam.title}</h3>
                <p className="text-indigo-100 mt-1">Year {currentSummary.exam.year} - Term {currentSummary.exam.term}</p>
              </div>
              <div className={`px-4 py-2 rounded-lg text-2xl font-bold border-2 ${getGradeColor(currentSummary.overallGrade)}`}>
                {currentSummary.overallGrade}
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-white/10 p-4 rounded-lg">
                <div className="text-indigo-200 text-sm mb-1">Total Marks</div>
                <div className="text-2xl font-bold">{currentSummary.totalMarks}/{currentSummary.totalMaxMarks}</div>
              </div>
              <div className="bg-white/10 p-4 rounded-lg">
                <div className="text-indigo-200 text-sm mb-1">Percentage</div>
                <div className="text-2xl font-bold">{currentSummary.percentage.toFixed(2)}%</div>
              </div>
              <div className="bg-white/10 p-4 rounded-lg">
                <div className="text-indigo-200 text-sm mb-1">Class Average</div>
                <div className="text-2xl font-bold">{currentSummary.average.toFixed(2)}%</div>
              </div>
              <div className="bg-white/10 p-4 rounded-lg">
                <div className="text-indigo-200 text-sm mb-1">Class Rank</div>
                <div className="text-2xl font-bold">#{currentSummary.classRank || "N/A"}</div>
              </div>
            </div>
          </div>

          {/* Subject Results Table */}
          {filteredResults.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4">
                <h3 className="text-lg font-bold text-white">Subject-wise Performance</h3>
                <p className="text-indigo-100 text-sm mt-1">{filteredResults.length} subjects • Detailed breakdown</p>
              </div>
              
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b-2 border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Subject
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Marks
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Percentage
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Grade
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Class Avg
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredResults.map((result, index) => {
                      const percentage = (result.marks / result.examSubject.maxMarks) * 100;
                      const stats = subjectStats[result.id];
                      const subjectAverage = stats ? (stats.classAverage / result.examSubject.maxMarks) * 100 : null;
                      const calculatedGrade = calculateGrade(percentage);
                      
                      return (
                        <tr key={result.id} className={`hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                                <span className="text-indigo-600 font-bold text-sm">
                                  {result.examSubject.subject.name.substring(0, 2).toUpperCase()}
                                </span>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-bold text-gray-900">{result.examSubject.subject.name}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="text-sm font-bold text-gray-900">
                              {result.marks}<span className="text-gray-500 font-normal">/{result.examSubject.maxMarks}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className={`text-sm font-bold ${getPercentageColor(percentage)}`}>
                              {percentage.toFixed(1)}%
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                              <div
                                className={`h-1.5 rounded-full ${getProgressColor(percentage)}`}
                                style={{ width: `${Math.min(percentage, 100)}%` }}
                              />
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className={`px-3 py-1 inline-flex text-sm leading-5 font-bold rounded-full border ${getGradeColor(calculatedGrade)}`}>
                              {calculatedGrade}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="text-sm font-semibold text-gray-700">
                              {subjectAverage ? `${subjectAverage.toFixed(1)}%` : "N/A"}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden divide-y divide-gray-200">
                {filteredResults.map((result) => {
                  const percentage = (result.marks / result.examSubject.maxMarks) * 100;
                  const stats = subjectStats[result.id];
                  const subjectAverage = stats ? (stats.classAverage / result.examSubject.maxMarks) * 100 : null;
                  const calculatedGrade = calculateGrade(percentage);
                  
                  return (
                    <div key={result.id} className="p-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-indigo-600 font-bold">
                              {result.examSubject.subject.name.substring(0, 2).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <h4 className="text-base font-bold text-gray-900">{result.examSubject.subject.name}</h4>
                          </div>
                        </div>
                        <span className={`px-3 py-1 text-sm font-bold rounded-full border ${getGradeColor(calculatedGrade)}`}>
                          {calculatedGrade}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <div className="text-xs text-gray-600 mb-1">Marks</div>
                          <div className="text-lg font-bold text-gray-900">
                            {result.marks}<span className="text-sm text-gray-500">/{result.examSubject.maxMarks}</span>
                          </div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <div className="text-xs text-gray-600 mb-1">Percentage</div>
                          <div className={`text-lg font-bold ${getPercentageColor(percentage)}`}>
                            {percentage.toFixed(1)}%
                          </div>
                        </div>
                        {stats && subjectAverage && (
                          <div className="bg-gray-50 p-3 rounded-lg col-span-2">
                            <div className="text-xs text-gray-600 mb-1">Class Average</div>
                            <div className="text-lg font-bold text-gray-700">
                              {subjectAverage.toFixed(1)}%
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${getProgressColor(percentage)}`}
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default StudentExamResultsClient;
