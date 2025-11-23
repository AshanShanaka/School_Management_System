"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";

interface Student {
  id: string;
  user: {
    name: string;
    surname: string;
    username: string;
  };
  class: {
    id: number;
    name: string;
  };
}

interface ExamResult {
  id: number;
  marks: number;
  grade: string;
  student: Student;
}

interface ExamSubject {
  id: number;
  maxMarks: number;
  marksEntered: boolean;
  marksEnteredAt?: string;
  subject: {
    id: number;
    name: string;
  };
  teacher: {
    id: string;
    name: string;
    surname: string;
  };
  subjectResults: ExamResult[];
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
  student: Student;
}

interface Exam {
  id: number;
  title: string;
  status: string;
  grade: {
    id: number;
    level: number;
  };
  examType: {
    id: number;
    name: string;
  };
  examSubjects: ExamSubject[];
  examSummaries: ExamSummary[];
}

interface Class {
  id: number;
  name: string;
  grade: {
    id: number;
    level: number;
  };
}

interface ExamResultsClientProps {
  exam: Exam;
  classes: Class[];
  teacherSubjects: ExamSubject[];
  teacherId: string;
}

const ExamResultsClient: React.FC<ExamResultsClientProps> = ({
  exam,
  classes,
  teacherSubjects,
  teacherId,
}) => {
  const [selectedSubject, setSelectedSubject] = useState<ExamSubject | null>(
    teacherSubjects.length === 1 ? teacherSubjects[0] : null
  );
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [viewMode, setViewMode] = useState<"subject" | "overall">("subject");

  // Filter results by selected class if any
  const getFilteredResults = (results: ExamResult[]) => {
    if (!selectedClass) return results;
    return results.filter(result => result.student.class.id === selectedClass.id);
  };

  const getFilteredSummaries = (summaries: ExamSummary[]) => {
    if (!selectedClass) return summaries;
    return summaries.filter(summary => summary.student.class.id === selectedClass.id);
  };

  // Calculate statistics for a subject
  const calculateSubjectStats = (results: ExamResult[], maxMarks: number) => {
    if (results.length === 0) return { average: 0, highest: 0, lowest: 0, passRate: 0 };
    
    const marks = results.map(r => r.marks);
    const average = marks.reduce((sum, mark) => sum + mark, 0) / marks.length;
    const highest = Math.max(...marks);
    const lowest = Math.min(...marks);
    const passCount = marks.filter(mark => (mark / maxMarks) * 100 >= 40).length;
    const passRate = (passCount / marks.length) * 100;
    
    return {
      average: Math.round(average * 100) / 100,
      highest,
      lowest,
      passRate: Math.round(passRate * 100) / 100,
    };
  };

  const getGradeBadgeClass = (grade: string) => {
    const baseClasses = "px-2 py-1 rounded text-xs font-medium";
    switch (grade) {
      case "A":
        return `${baseClasses} bg-green-100 text-green-800`;
      case "B":
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case "C":
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case "S":
        return `${baseClasses} bg-orange-100 text-orange-800`;
      case "W":
        return `${baseClasses} bg-red-100 text-red-800`;
      case "AB":
        return `${baseClasses} bg-gray-100 text-gray-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6">
        <button
          onClick={() => setViewMode("subject")}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors text-center ${
            viewMode === "subject"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          📚 Subject Results
        </button>
        <button
          onClick={() => setViewMode("overall")}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors text-center ${
            viewMode === "overall"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          📊 Overall Results
        </button>
      </div>

      {/* Class Filter */}
      <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg">
        <label className="font-medium text-blue-800">Filter by Class:</label>
        <select
          value={selectedClass?.id || ""}
          onChange={(e) => {
            const classId = e.target.value;
            if (classId) {
              setSelectedClass(classes.find(c => c.id === parseInt(classId)) || null);
            } else {
              setSelectedClass(null);
            }
          }}
          className="px-3 py-2 border border-blue-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">All Classes</option>
          {classes.map((cls) => (
            <option key={cls.id} value={cls.id}>
              {cls.name}
            </option>
          ))}
        </select>
        {selectedClass && (
          <button
            onClick={() => setSelectedClass(null)}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            Clear Filter
          </button>
        )}
      </div>

      {/* Subject Results View */}
      {viewMode === "subject" && (
        <div>
          {/* Subject Selection */}
          {teacherSubjects.length > 1 && (
            <div className="mb-6 p-4 bg-green-50 rounded-lg">
              <h3 className="font-medium text-green-800 mb-3">Select Subject</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {teacherSubjects.map((examSubject) => (
                  <button
                    key={examSubject.id}
                    onClick={() => setSelectedSubject(examSubject)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      selectedSubject?.id === examSubject.id
                        ? "border-green-500 bg-green-100 text-green-800"
                        : "border-gray-200 bg-white hover:border-green-300"
                    }`}
                  >
                    <div className="font-medium">{examSubject.subject.name}</div>
                    <div className="text-sm text-gray-600">
                      Max: {examSubject.maxMarks} marks
                    </div>
                    <div className="text-sm text-gray-600">
                      Students: {examSubject.subjectResults.length}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Subject Results Display */}
          {selectedSubject && (
            <div>
              {(() => {
                const filteredResults = getFilteredResults(selectedSubject.subjectResults);
                const stats = calculateSubjectStats(filteredResults, selectedSubject.maxMarks);
                
                return (
                  <>
                    {/* Subject Statistics */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="text-blue-600 text-sm font-medium">Students</div>
                        <div className="text-blue-900 text-2xl font-bold">
                          {filteredResults.length}
                        </div>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg">
                        <div className="text-green-600 text-sm font-medium">Average</div>
                        <div className="text-green-900 text-2xl font-bold">
                          {stats.average} / {selectedSubject.maxMarks}
                        </div>
                      </div>
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <div className="text-purple-600 text-sm font-medium">Highest</div>
                        <div className="text-purple-900 text-2xl font-bold">
                          {stats.highest}
                        </div>
                      </div>
                      <div className="bg-orange-50 p-4 rounded-lg">
                        <div className="text-orange-600 text-sm font-medium">Pass Rate</div>
                        <div className="text-orange-900 text-2xl font-bold">
                          {stats.passRate}%
                        </div>
                      </div>
                    </div>

                    {/* Results Table */}
                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                      <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900">
                          {selectedSubject.subject.name} Results
                          {selectedClass && ` - ${selectedClass.name}`}
                        </h3>
                      </div>
                      
                      {filteredResults.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Rank
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Student
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Class
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
                              {filteredResults.map((result, index) => {
                                const percentage = (result.marks / selectedSubject.maxMarks) * 100;
                                return (
                                  <tr key={result.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                      #{index + 1}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <div className="text-sm font-medium text-gray-900">
                                        {result.student.user.name} {result.student.user.surname}
                                      </div>
                                      <div className="text-sm text-gray-500">
                                        {result.student.user.username}
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                      {result.student.class.name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <div className="text-sm font-medium text-gray-900">
                                        {result.marks} / {selectedSubject.maxMarks}
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
                      ) : (
                        <div className="px-6 py-12 text-center">
                          <div className="text-gray-400 mb-4">
                            <Image src="/result.png" alt="No results" width={64} height={64} className="mx-auto opacity-50" />
                          </div>
                          <h3 className="text-lg font-medium text-gray-500 mb-2">No Results Found</h3>
                          <p className="text-gray-400">
                            {selectedClass 
                              ? `No results found for ${selectedClass.name}.`
                              : "No results have been entered for this subject yet."
                            }
                          </p>
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}
            </div>
          )}

          {/* No subject selected */}
          {!selectedSubject && teacherSubjects.length > 1 && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Image src="/subject.png" alt="Select subject" width={64} height={64} className="mx-auto opacity-50" />
              </div>
              <h3 className="text-xl font-semibold text-gray-500 mb-2">Select a Subject</h3>
              <p className="text-gray-400">Choose a subject above to view detailed results.</p>
            </div>
          )}
        </div>
      )}

      {/* Overall Results View */}
      {viewMode === "overall" && (
        <div>
          {(() => {
            const filteredSummaries = getFilteredSummaries(exam.examSummaries);
            
            return (
              <>
                {/* Overall Statistics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-blue-600 text-sm font-medium">Total Students</div>
                    <div className="text-blue-900 text-2xl font-bold">
                      {filteredSummaries.length}
                    </div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-green-600 text-sm font-medium">Class Average</div>
                    <div className="text-green-900 text-2xl font-bold">
                      {filteredSummaries.length > 0 
                        ? Math.round((filteredSummaries.reduce((sum, s) => sum + s.percentage, 0) / filteredSummaries.length) * 100) / 100
                        : 0
                      }%
                    </div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="text-purple-600 text-sm font-medium">Highest</div>
                    <div className="text-purple-900 text-2xl font-bold">
                      {filteredSummaries.length > 0 
                        ? Math.max(...filteredSummaries.map(s => s.percentage))
                        : 0
                      }%
                    </div>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <div className="text-orange-600 text-sm font-medium">Pass Rate</div>
                    <div className="text-orange-900 text-2xl font-bold">
                      {filteredSummaries.length > 0 
                        ? Math.round((filteredSummaries.filter(s => s.percentage >= 40).length / filteredSummaries.length) * 100)
                        : 0
                      }%
                    </div>
                  </div>
                </div>

                {/* Overall Results Table */}
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">
                      Overall Exam Results
                      {selectedClass && ` - ${selectedClass.name}`}
                    </h3>
                  </div>
                  
                  {filteredSummaries.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Rank
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Student
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Class
                            </th>
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
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {filteredSummaries.map((summary) => (
                            <tr key={summary.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                #{summary.classRank}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  {summary.student.user.name} {summary.student.user.surname}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {summary.student.user.username}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {summary.student.class.name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  {summary.totalMarks} / {summary.totalMaxMarks}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {Math.round(summary.percentage * 100) / 100}%
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={getGradeBadgeClass(summary.overallGrade)}>
                                  {summary.overallGrade}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <Link 
                                  href={`/student/report-card/${exam.id}/${summary.student.id}`}
                                  className="text-blue-600 hover:text-blue-900"
                                >
                                  View Report
                                </Link>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="px-6 py-12 text-center">
                      <div className="text-gray-400 mb-4">
                        <Image src="/result.png" alt="No results" width={64} height={64} className="mx-auto opacity-50" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-500 mb-2">No Overall Results</h3>
                      <p className="text-gray-400">
                        Overall results will be available once all subjects have been graded.
                      </p>
                    </div>
                  )}
                </div>
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
};

export default ExamResultsClient;
