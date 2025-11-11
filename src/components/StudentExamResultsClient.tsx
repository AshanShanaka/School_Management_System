"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";

interface User {
  name: string;
  surname: string;
  username: string;
}

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
  user: User;
  class: Class;
}

interface Subject {
  id: number;
  name: string;
}

interface Teacher {
  id: string;
  user: User;
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
  teacher: Teacher;
}

interface ExamSummary {
  id: number;
  totalMarks: number;
  totalMaxMarks: number;
  percentage: number;
  average: number;
  overallGrade: string;
  classRank: number;
  classSize: number;
  exam: Exam;
  student: Student;
}

interface ExamResult {
  id: number;
  marks: number;
  grade: string;
  exam: Exam;
  examSubject: ExamSubject;
  student: Student;
}

interface ReportCardSubject {
  id: number;
  marks: number;
  maxMarks: number;
  grade: string;
  classAverage?: number;
  remarks?: string;
  subject: Subject;
}

interface ReportCard {
  id: number;
  status: string;
  totalMarks?: number;
  maxMarks?: number;
  percentage?: number;
  overallGrade?: string;
  classRank?: number;
  classAverage?: number;
  teacherComment?: string;
  principalComment?: string;
  generatedAt: string;
  exam: Exam;
  student: Student;
  subjects: ReportCardSubject[];
}

interface StudentExamResultsClientProps {
  examSummaries: ExamSummary[];
  examResults: ExamResult[];
  reportCards: ReportCard[];
  userRole: string;
}

const StudentExamResultsClient: React.FC<StudentExamResultsClientProps> = ({
  examSummaries,
  examResults,
  reportCards,
  userRole,
}) => {
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"summary" | "detailed" | "reports">("summary");
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  // Get unique students (for parents with multiple children)
  const students = Array.from(
    new Map(
      examSummaries.map(summary => [summary.student.id, summary.student])
    ).values()
  );

  // Get unique years
  const years = Array.from(
    new Set(examSummaries.map(summary => summary.exam.year))
  ).sort((a, b) => b - a);

  // Filter data based on selected student and year
  const getFilteredData = () => {
    let filteredSummaries = examSummaries;
    let filteredResults = examResults;
    let filteredReports = reportCards;

    if (selectedStudent) {
      filteredSummaries = filteredSummaries.filter(s => s.student.id === selectedStudent);
      filteredResults = filteredResults.filter(r => r.student.id === selectedStudent);
      filteredReports = filteredReports.filter(r => r.student.id === selectedStudent);
    }

    if (selectedYear) {
      filteredSummaries = filteredSummaries.filter(s => s.exam.year === selectedYear);
      filteredResults = filteredResults.filter(r => r.exam.year === selectedYear);
      filteredReports = filteredReports.filter(r => r.exam.year === selectedYear);
    }

    return { filteredSummaries, filteredResults, filteredReports };
  };

  const { filteredSummaries, filteredResults, filteredReports } = getFilteredData();

  const getGradeBadgeClass = (grade: string) => {
    const baseClasses = "px-2 py-1 rounded text-xs font-medium";
    switch (grade) {
      case "A+":
      case "A":
        return `${baseClasses} bg-green-100 text-green-800`;
      case "B+":
      case "B":
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case "C+":
      case "C":
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case "D":
        return `${baseClasses} bg-orange-100 text-orange-800`;
      case "F":
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const getPerformanceTrend = (summaries: ExamSummary[]) => {
    const sorted = summaries.sort((a, b) => {
      if (a.exam.year !== b.exam.year) return a.exam.year - b.exam.year;
      return a.exam.term - b.exam.term;
    });

    if (sorted.length < 2) return { trend: "stable", change: 0 };

    const latest = sorted[sorted.length - 1];
    const previous = sorted[sorted.length - 2];
    const change = latest.percentage - previous.percentage;

    if (Math.abs(change) < 2) return { trend: "stable", change };
    return { trend: change > 0 ? "improving" : "declining", change };
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-4 p-4 bg-gray-50 rounded-lg">
        {/* Student Filter (for parents) */}
        {userRole === "parent" && students.length > 1 && (
          <div className="flex items-center gap-2">
            <label className="font-medium text-gray-700">Student:</label>
            <select
              value={selectedStudent || ""}
              onChange={(e) => setSelectedStudent(e.target.value || null)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Children</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.user.name} {student.user.surname}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Year Filter */}
        <div className="flex items-center gap-2">
          <label className="font-medium text-gray-700">Year:</label>
          <select
            value={selectedYear || ""}
            onChange={(e) => setSelectedYear(e.target.value ? parseInt(e.target.value) : null)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Years</option>
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        {/* Clear Filters */}
        {(selectedStudent || selectedYear) && (
          <button
            onClick={() => {
              setSelectedStudent(null);
              setSelectedYear(null);
            }}
            className="px-3 py-2 text-blue-600 hover:text-blue-800 text-sm"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* View Mode Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setViewMode("summary")}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors text-center ${
            viewMode === "summary"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          📊 Exam Summaries
        </button>
        <button
          onClick={() => setViewMode("detailed")}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors text-center ${
            viewMode === "detailed"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          📋 Subject Details
        </button>
        <button
          onClick={() => setViewMode("reports")}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors text-center ${
            viewMode === "reports"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          📄 Report Cards
        </button>
      </div>

      {/* Summary View */}
      {viewMode === "summary" && (
        <div>
          {filteredSummaries.length > 0 ? (
            <div className="space-y-6">
              {/* Performance Overview */}
              {(() => {
                const avgPercentage = filteredSummaries.reduce((sum, s) => sum + s.percentage, 0) / filteredSummaries.length;
                const trend = getPerformanceTrend(filteredSummaries);
                
                return (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="text-blue-600 text-sm font-medium">Exams Taken</div>
                      <div className="text-blue-900 text-2xl font-bold">
                        {filteredSummaries.length}
                      </div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="text-green-600 text-sm font-medium">Average Score</div>
                      <div className="text-green-900 text-2xl font-bold">
                        {Math.round(avgPercentage * 100) / 100}%
                      </div>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <div className="text-purple-600 text-sm font-medium">Best Performance</div>
                      <div className="text-purple-900 text-2xl font-bold">
                        {Math.max(...filteredSummaries.map(s => s.percentage))}%
                      </div>
                    </div>
                    <div className={`p-4 rounded-lg ${
                      trend.trend === "improving" ? "bg-green-50" :
                      trend.trend === "declining" ? "bg-red-50" :
                      "bg-gray-50"
                    }`}>
                      <div className={`text-sm font-medium ${
                        trend.trend === "improving" ? "text-green-600" :
                        trend.trend === "declining" ? "text-red-600" :
                        "text-gray-600"
                      }`}>
                        Performance Trend
                      </div>
                      <div className={`text-2xl font-bold ${
                        trend.trend === "improving" ? "text-green-900" :
                        trend.trend === "declining" ? "text-red-900" :
                        "text-gray-900"
                      }`}>
                        {trend.trend === "improving" ? "↗️" : trend.trend === "declining" ? "↘️" : "→"} 
                        {Math.abs(trend.change).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Exam Summaries Table */}
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Exam Performance Summary</h3>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Exam
                        </th>
                        {userRole === "parent" && (
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Student
                          </th>
                        )}
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total Marks
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Percentage
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Grade
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Class Rank
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredSummaries.map((summary) => (
                        <tr key={summary.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {summary.exam.title}
                            </div>
                            <div className="text-sm text-gray-500">
                              {summary.exam.year} - Term {summary.exam.term} - Grade {summary.exam.grade.level}
                            </div>
                          </td>
                          {userRole === "parent" && (
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {summary.student.user.name} {summary.student.user.surname}
                              </div>
                              <div className="text-sm text-gray-500">
                                {summary.student.class.name}
                              </div>
                            </td>
                          )}
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {summary.totalMarks} / {summary.totalMaxMarks}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {Math.round(summary.percentage * 100) / 100}%
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={getGradeBadgeClass(summary.overallGrade)}>
                              {summary.overallGrade}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            #{summary.classRank} of {summary.classSize}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <Link 
                              href={`/student/report-card/${summary.exam.id}/${summary.student.id}`}
                              className="text-blue-600 hover:text-blue-900 mr-3"
                            >
                              View Details
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Image src="/result.png" alt="No results" width={64} height={64} className="mx-auto opacity-50" />
              </div>
              <h3 className="text-lg font-medium text-gray-500 mb-2">No Exam Results</h3>
              <p className="text-gray-400">No exam results found for the selected criteria.</p>
            </div>
          )}
        </div>
      )}

      {/* Detailed View */}
      {viewMode === "detailed" && (
        <div>
          {filteredResults.length > 0 ? (
            <div className="space-y-6">
              {/* Group results by exam */}
              {Object.entries(
                filteredResults.reduce((groups: any, result) => {
                  const examKey = `${result.exam.id}-${result.student.id}`;
                  if (!groups[examKey]) {
                    groups[examKey] = {
                      exam: result.exam,
                      student: result.student,
                      results: [],
                    };
                  }
                  groups[examKey].results.push(result);
                  return groups;
                }, {})
              ).map(([examKey, group]: [string, any]) => (
                <div key={examKey} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          {group.exam.title}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {group.exam.year} - Term {group.exam.term} - Grade {group.exam.grade.level}
                          {userRole === "parent" && ` - ${group.student.user.name} ${group.student.user.surname}`}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Subject
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Teacher
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Marks
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Percentage
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Grade
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {group.results.map((result: ExamResult) => {
                          const percentage = (result.marks / result.examSubject.maxMarks) * 100;
                          return (
                            <tr key={result.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  {result.examSubject.subject.name}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {result.examSubject.teacher.user.name} {result.examSubject.teacher.user.surname}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  {result.marks} / {result.examSubject.maxMarks}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {Math.round(percentage * 100) / 100}%
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={getGradeBadgeClass(result.grade)}>
                                  {result.grade}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Image src="/result.png" alt="No results" width={64} height={64} className="mx-auto opacity-50" />
              </div>
              <h3 className="text-lg font-medium text-gray-500 mb-2">No Detailed Results</h3>
              <p className="text-gray-400">No detailed subject results found for the selected criteria.</p>
            </div>
          )}
        </div>
      )}

      {/* Report Cards View */}
      {viewMode === "reports" && (
        <div>
          {filteredReports.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredReports.map((reportCard) => (
                <div key={reportCard.id} className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          {reportCard.exam.title}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {reportCard.exam.year} - Term {reportCard.exam.term}
                        </p>
                        {userRole === "parent" && (
                          <p className="text-sm text-blue-600">
                            {reportCard.student.user.name} {reportCard.student.user.surname}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        {reportCard.overallGrade && (
                          <span className={getGradeBadgeClass(reportCard.overallGrade)}>
                            {reportCard.overallGrade}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      {reportCard.percentage && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Percentage:</span>
                          <span className="font-medium">{Math.round(reportCard.percentage * 100) / 100}%</span>
                        </div>
                      )}
                      {reportCard.classRank && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Class Rank:</span>
                          <span className="font-medium">#{reportCard.classRank}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Generated:</span>
                        <span className="font-medium">
                          {new Date(reportCard.generatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Link 
                        href={`/student/report-card/${reportCard.exam.id}/${reportCard.student.id}`}
                        className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 text-center"
                      >
                        View Full Report
                      </Link>
                      <Link 
                        href={`/student/report-card/${reportCard.exam.id}/${reportCard.student.id}/download`}
                        className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 text-center"
                      >
                        Download PDF
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Image src="/result.png" alt="No reports" width={64} height={64} className="mx-auto opacity-50" />
              </div>
              <h3 className="text-lg font-medium text-gray-500 mb-2">No Report Cards</h3>
              <p className="text-gray-400">No published report cards found for the selected criteria.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StudentExamResultsClient;
