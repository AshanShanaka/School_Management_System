"use client";

import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

interface HistoricalMarksData {
  class: {
    name: string;
    gradeLevel: number;
  };
  terms: string[];
  students: {
    id: string;
    name: string;
    surname: string;
    indexNumber: string;
    subjects: {
      [subjectName: string]: {
        [term: string]: number | null;
      };
    };
    averages: {
      [term: string]: number | null;
    };
    overallAverage: number | null;
  }[];
  subjects: string[];
  statistics: {
    totalStudents: number;
    totalMarksEntered: number;
    termsImported: number;
    subjectsCount: number;
    classAverage: number;
  };
}

const ViewHistoricalMarksPage = () => {
  const router = useRouter();
  const [data, setData] = useState<HistoricalMarksData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTerm, setSelectedTerm] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<string>("all");

  useEffect(() => {
    fetchHistoricalMarks();
  }, []);

  const fetchHistoricalMarks = async () => {
    try {
      const response = await fetch("/api/teacher/view-historical-marks");
      if (response.ok) {
        const result = await response.json();
        setData(result);
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to fetch historical marks");
      }
    } catch (error) {
      console.error("Error fetching historical marks:", error);
      toast.error("Failed to fetch historical marks");
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = () => {
    if (!data) return [];

    return data.students.filter((student) => {
      // Search filter
      if (searchTerm) {
        const fullName = `${student.name} ${student.surname}`.toLowerCase();
        const matchesSearch =
          fullName.includes(searchTerm.toLowerCase()) ||
          student.indexNumber.toLowerCase().includes(searchTerm.toLowerCase());
        if (!matchesSearch) return false;
      }

      return true;
    });
  };

  const getGradeColor = (marks: number | null) => {
    if (marks === null) return "bg-gray-100 text-gray-400";
    if (marks >= 75) return "bg-green-100 text-green-800";
    if (marks >= 65) return "bg-blue-100 text-blue-800";
    if (marks >= 50) return "bg-yellow-100 text-yellow-800";
    if (marks >= 35) return "bg-orange-100 text-orange-800";
    return "bg-red-100 text-red-800";
  };

  if (loading) {
    return (
      <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
          <span className="ml-2">Loading historical marks...</span>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Image src="/result.png" alt="No data" width={64} height={64} className="mx-auto opacity-50" />
          </div>
          <h3 className="text-xl font-semibold text-gray-500 mb-2">No Historical Marks Found</h3>
          <p className="text-gray-400 mb-4">
            No historical marks have been imported yet for your class.
          </p>
          <Link
            href="/teacher/historical-marks-import"
            className="inline-block px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Import Historical Marks
          </Link>
        </div>
      </div>
    );
  }

  const sortedStudents = filteredStudents();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 p-6">
      {/* Header */}
      <div className="bg-white/60 backdrop-blur-md rounded-xl shadow-md p-5 mb-6 border-2 border-purple-200 max-w-5xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 transition-all shadow-md"
            >
              <Image src="/arrow-left.png" alt="Back" width={20} height={20} className="invert" />
            </button>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Historical Marks (O/L)
              </h1>
              <p className="text-gray-600 font-medium mt-1">
                {data.class.name} • Grade {data.class.gradeLevel}
              </p>
            </div>
          </div>

          <Link
            href="/teacher/historical-marks-import"
            className="px-5 py-2.5 bg-gradient-to-br from-purple-500 to-indigo-600 text-white rounded-lg hover:from-purple-600 hover:to-indigo-700 font-semibold transition-all shadow-md flex items-center gap-2"
          >
            <span>📤</span>
            Import More
          </Link>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 max-w-5xl mx-auto">
        <div className="bg-white/60 backdrop-blur-md rounded-xl shadow-md p-5 border-2 border-purple-200 hover:shadow-lg hover:border-purple-300 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-600 text-sm font-semibold uppercase tracking-wide">Students</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{data.statistics.totalStudents}</p>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
              <span className="text-3xl">🧑‍🎓</span>
            </div>
          </div>
        </div>

        <div className="bg-white/60 backdrop-blur-md rounded-xl shadow-md p-5 border-2 border-green-200 hover:shadow-lg hover:border-green-300 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm font-semibold uppercase tracking-wide">Terms</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{data.statistics.termsImported}</p>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center shadow-md">
              <span className="text-3xl">📅</span>
            </div>
          </div>
        </div>

        <div className="bg-white/60 backdrop-blur-md rounded-xl shadow-md p-5 border-2 border-indigo-200 hover:shadow-lg hover:border-indigo-300 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-indigo-600 text-sm font-semibold uppercase tracking-wide">Subjects</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{data.statistics.subjectsCount}</p>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
              <span className="text-3xl">📚</span>
            </div>
          </div>
        </div>

        <div className="bg-white/60 backdrop-blur-md rounded-xl shadow-md p-5 border-2 border-blue-200 hover:shadow-lg hover:border-blue-300 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm font-semibold uppercase tracking-wide">Class Avg</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">
                {data.statistics.classAverage.toFixed(1)}%
              </p>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
              <span className="text-3xl">🎯</span>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white/60 backdrop-blur-md rounded-xl shadow-md p-5 mb-6 border-2 border-purple-200 max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="text-lg">🔍</span>
              </div>
              <input
                type="text"
                placeholder="Search student by name or index number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-2.5 bg-white/70 backdrop-blur-sm border-2 border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-400 font-medium transition-all"
              />
            </div>
          </div>

          <select
            value={selectedTerm}
            onChange={(e) => setSelectedTerm(e.target.value)}
            className="px-4 py-2.5 bg-white/70 backdrop-blur-sm border-2 border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-400 font-medium"
          >
            <option value="all">📅 All Terms ({data.terms.length})</option>
            {data.terms.map((term) => (
              <option key={term} value={term}>
                {term}
              </option>
            ))}
          </select>

          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="px-4 py-2.5 bg-white/70 backdrop-blur-sm border-2 border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-400 font-medium"
          >
            <option value="all">📚 All Subjects ({data.subjects.length})</option>
            {data.subjects.map((subject) => (
              <option key={subject} value={subject}>
                {subject}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Student Cards View */}
      <div className="space-y-3 max-w-5xl mx-auto">
        {sortedStudents.length === 0 ? (
          <div className="bg-white/60 backdrop-blur-md rounded-xl shadow-md p-12 text-center border-2 border-purple-200">
            <span className="text-6xl mb-4 block">🔍</span>
            <p className="text-xl font-semibold text-gray-600">No students found matching your filters.</p>
          </div>
        ) : (
          sortedStudents.map((student) => (
            <StudentMarksCard
              key={student.id}
              student={student}
              terms={selectedTerm === "all" ? data.terms : [selectedTerm]}
              subjects={selectedSubject === "all" ? data.subjects : [selectedSubject]}
              getGradeColor={getGradeColor}
            />
          ))
        )}
      </div>

      {/* Footer Stats */}
      <div className="mt-6 bg-white/60 backdrop-blur-md rounded-xl shadow-md p-4 border-2 border-purple-200 max-w-5xl mx-auto">
        <div className="flex items-center justify-between text-sm font-medium text-gray-700">
          <span className="flex items-center gap-2">
            <span className="text-lg">👥</span>
            Showing {sortedStudents.length} of {data.statistics.totalStudents} students
          </span>
          <span className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <span className="text-lg">📊</span>
              Class Avg: <span className="font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">{data.statistics.classAverage.toFixed(1)}%</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="text-lg">✅</span>
              {data.statistics.totalMarksEntered} marks
            </span>
          </span>
        </div>
      </div>
    </div>
  );
};

// Student Marks Card Component
const StudentMarksCard = ({ student, terms, subjects, getGradeColor }: any) => {
  const [isExpanded, setIsExpanded] = React.useState(false);

  return (
    <div className="bg-white/60 backdrop-blur-md rounded-xl shadow-md border-2 border-purple-300 overflow-hidden hover:shadow-lg hover:border-purple-400 transition-all">
      {/* Card Header */}
      <div 
        className="bg-gradient-to-r from-purple-500/90 to-indigo-600/90 backdrop-blur-sm p-4 cursor-pointer hover:from-purple-600/90 hover:to-indigo-700/90 transition-all"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md border-2 border-white/50">
              <span className="text-2xl">🧑‍🎓</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white drop-shadow-md">
                {student.name} {student.surname}
              </h3>
              <p className="text-purple-100 text-sm font-medium">Index: {student.indexNumber}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {student.overallAverage !== null && (
              <div className="bg-white/20 backdrop-blur-md px-5 py-2 rounded-lg border-2 border-white/40 shadow-md">
                <p className="text-xs text-purple-50 font-semibold">Overall Avg</p>
                <p className="text-2xl font-bold text-white drop-shadow-md">{student.overallAverage.toFixed(1)}%</p>
              </div>
            )}
            
            <button className="text-white transition-transform hover:scale-110">
              <svg 
                className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Card Content */}
      {isExpanded && (
        <div className="p-5 bg-gradient-to-br from-white/50 to-purple-50/50 backdrop-blur-sm">
          {/* Marks Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {subjects.map((subject) => (
              <div key={subject} className="bg-white/70 backdrop-blur-sm border-2 border-purple-200 rounded-lg p-3 hover:shadow-md hover:border-purple-300 transition-all">
                <h4 className="font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2 text-base flex items-center gap-2">
                  <span className="text-lg">📖</span>
                  {subject}
                </h4>
                <div className="space-y-2">
                  {terms.map((term) => {
                    const marks = student.subjects[subject]?.[term];
                    return (
                      <div key={term} className="flex items-center justify-between">
                        <span className="text-xs text-gray-700 font-medium">{term}</span>
                        <span
                          className={`px-3 py-1 rounded-md text-sm font-bold shadow-sm ${getGradeColor(
                            marks ?? null
                          )}`}
                        >
                          {marks ?? "—"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Term Averages */}
          {terms.length > 1 && (
            <div className="mt-4 bg-gradient-to-br from-purple-100/70 to-indigo-100/70 backdrop-blur-sm border-2 border-purple-300 rounded-lg p-4 shadow-sm">
              <h4 className="font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-3 text-base flex items-center gap-2">
                <span className="text-lg">📊</span>
                Term Averages
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {terms.map((term) => {
                  const avg = student.averages[term];
                  return (
                    <div key={term} className="text-center bg-white/80 backdrop-blur-sm rounded-md p-2 border-2 border-purple-200 shadow-sm hover:border-purple-300 transition-all">
                      <p className="text-xs text-gray-600 font-medium mb-1 truncate" title={term}>{term}</p>
                      <p
                        className={`text-xl font-bold ${
                          avg === null ? 'text-gray-400' : avg >= 75 ? 'text-green-600' : avg >= 50 ? 'text-blue-600' : 'text-orange-500'
                        }`}
                      >
                        {avg ? avg.toFixed(1) : "—"}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ViewHistoricalMarksPage;
