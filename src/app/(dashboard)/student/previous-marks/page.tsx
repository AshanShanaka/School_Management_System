"use client";

import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import Image from "next/image";

interface SubjectMarks {
  subjectName: string;
  grade9Term1: number | null;
  grade9Term2: number | null;
  grade9Term3: number | null;
  grade9Average: number | null;
  grade10Term1: number | null;
  grade10Term2: number | null;
  grade10Term3: number | null;
  grade10Average: number | null;
  overallAverage: number | null;
}

interface PreviousMarksData {
  student: {
    name: string;
    surname: string;
    username: string;
    currentGrade: number;
  };
  subjects: SubjectMarks[];
  statistics: {
    grade9Average: number;
    grade10Average: number;
    overallAverage: number;
    totalSubjects: number;
  };
}

const StudentPreviousMarksPage = () => {
  const [data, setData] = useState<PreviousMarksData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedGrade, setSelectedGrade] = useState<"all" | "9" | "10">("all");

  useEffect(() => {
    fetchPreviousMarks();
  }, []);

  const fetchPreviousMarks = async () => {
    try {
      console.log('[Previous Marks Page] Fetching marks...');
      const response = await fetch("/api/student/previous-marks");
      console.log('[Previous Marks Page] Response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('[Previous Marks Page] Data received:', {
          subjects: result.subjects?.length || 0,
          hasStatistics: !!result.statistics
        });
        setData(result);
      } else {
        const error = await response.json();
        console.error('[Previous Marks Page] Error response:', error);
        toast.error(error.error || "Failed to fetch previous marks");
      }
    } catch (error) {
      console.error("[Previous Marks Page] Fetch error:", error);
      toast.error("Failed to fetch previous marks");
    } finally {
      setLoading(false);
    }
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
          <span className="ml-2">Loading your previous marks...</span>
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
          <h3 className="text-xl font-semibold text-gray-500 mb-2">No Previous Marks Found</h3>
          <p className="text-gray-400">
            Your Grade 9 & 10 historical marks are not available yet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-md flex-1 m-4 mt-0">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Image src="/ai-prediction.svg" alt="Previous Marks" width={32} height={32} />
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Previous Marks (Grade 9 & 10)</h1>
            <p className="text-gray-600">
              {data.student.name} {data.student.surname} • {data.student.username} • Currently in Grade {data.student.currentGrade}
            </p>
          </div>
        </div>
      </div>



      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm font-medium">Total Subjects</p>
              <p className="text-3xl font-bold text-blue-900">{data.statistics.totalSubjects}</p>
              <p className="text-xs text-blue-600 mt-1">O/L Subjects</p>
            </div>
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
              <Image src="/subject.png" alt="Subjects" width={24} height={24} />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm font-medium">Grade 9 Average</p>
              <p className="text-3xl font-bold text-green-900">
                {data.statistics.grade9Average ? data.statistics.grade9Average.toFixed(1) : "N/A"}
              </p>
              <p className="text-xs text-green-600 mt-1">All terms combined</p>
            </div>
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">9</span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-lg border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-600 text-sm font-medium">Grade 10 Average</p>
              <p className="text-3xl font-bold text-purple-900">
                {data.statistics.grade10Average ? data.statistics.grade10Average.toFixed(1) : "N/A"}
              </p>
              <p className="text-xs text-purple-600 mt-1">All terms combined</p>
            </div>
            <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">10</span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-6 rounded-lg border border-indigo-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-indigo-600 text-sm font-medium">Overall Average</p>
              <p className="text-3xl font-bold text-indigo-900">
                {data.statistics.overallAverage ? data.statistics.overallAverage.toFixed(1) : "N/A"}
              </p>
              <p className="text-xs text-indigo-600 mt-1">Grades 9 & 10</p>
            </div>
            <div className="w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center">
              <Image src="/result.png" alt="Average" width={24} height={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Grade Filter */}
      <div className="mb-6 flex gap-2 border-b">
        <button
          onClick={() => setSelectedGrade("all")}
          className={`px-6 py-3 font-medium transition-colors ${
            selectedGrade === "all"
              ? "border-b-2 border-purple-600 text-purple-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Both Grades
        </button>
        <button
          onClick={() => setSelectedGrade("9")}
          className={`px-6 py-3 font-medium transition-colors ${
            selectedGrade === "9"
              ? "border-b-2 border-green-600 text-green-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Grade 9 Only
        </button>
        <button
          onClick={() => setSelectedGrade("10")}
          className={`px-6 py-3 font-medium transition-colors ${
            selectedGrade === "10"
              ? "border-b-2 border-purple-600 text-purple-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Grade 10 Only
        </button>
      </div>

      {/* Marks Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">
                  Subject
                </th>
                {(selectedGrade === "all" || selectedGrade === "9") && (
                  <>
                    <th className="px-4 py-4 text-center text-xs font-medium text-green-600 uppercase" colSpan={4}>
                      Grade 9
                    </th>
                  </>
                )}
                {(selectedGrade === "all" || selectedGrade === "10") && (
                  <>
                    <th className="px-4 py-4 text-center text-xs font-medium text-purple-600 uppercase" colSpan={4}>
                      Grade 10
                    </th>
                  </>
                )}
                {selectedGrade === "all" && (
                  <th className="px-4 py-4 text-center text-xs font-medium text-indigo-600 uppercase">
                    Overall Avg
                  </th>
                )}
              </tr>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10 border-t"></th>
                {(selectedGrade === "all" || selectedGrade === "9") && (
                  <>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 border-t">Term 1</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 border-t">Term 2</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 border-t">Term 3</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 border-t">Average</th>
                  </>
                )}
                {(selectedGrade === "all" || selectedGrade === "10") && (
                  <>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 border-t">Term 1</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 border-t">Term 2</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 border-t">Term 3</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 border-t">Average</th>
                  </>
                )}
                {selectedGrade === "all" && (
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 border-t">9 & 10</th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.subjects.map((subject, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900 sticky left-0 bg-white z-10">
                    {subject.subjectName}
                  </td>
                  {(selectedGrade === "all" || selectedGrade === "9") && (
                    <>
                      <td className="px-4 py-4 text-center">
                        <span className={`px-3 py-1 rounded text-sm font-semibold ${getGradeColor(subject.grade9Term1)}`}>
                          {subject.grade9Term1 ?? "-"}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={`px-3 py-1 rounded text-sm font-semibold ${getGradeColor(subject.grade9Term2)}`}>
                          {subject.grade9Term2 ?? "-"}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={`px-3 py-1 rounded text-sm font-semibold ${getGradeColor(subject.grade9Term3)}`}>
                          {subject.grade9Term3 ?? "-"}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={`px-3 py-1 rounded text-sm font-bold ${getGradeColor(subject.grade9Average)}`}>
                          {subject.grade9Average ? subject.grade9Average.toFixed(1) : "-"}
                        </span>
                      </td>
                    </>
                  )}
                  {(selectedGrade === "all" || selectedGrade === "10") && (
                    <>
                      <td className="px-4 py-4 text-center">
                        <span className={`px-3 py-1 rounded text-sm font-semibold ${getGradeColor(subject.grade10Term1)}`}>
                          {subject.grade10Term1 ?? "-"}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={`px-3 py-1 rounded text-sm font-semibold ${getGradeColor(subject.grade10Term2)}`}>
                          {subject.grade10Term2 ?? "-"}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={`px-3 py-1 rounded text-sm font-semibold ${getGradeColor(subject.grade10Term3)}`}>
                          {subject.grade10Term3 ?? "-"}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={`px-3 py-1 rounded text-sm font-bold ${getGradeColor(subject.grade10Average)}`}>
                          {subject.grade10Average ? subject.grade10Average.toFixed(1) : "-"}
                        </span>
                      </td>
                    </>
                  )}
                  {selectedGrade === "all" && (
                    <td className="px-4 py-4 text-center">
                      <span className={`px-3 py-1 rounded text-sm font-bold ${getGradeColor(subject.overallAverage)}`}>
                        {subject.overallAverage ? subject.overallAverage.toFixed(1) : "-"}
                      </span>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            Showing {data.subjects.length} O/L subjects
          </span>
          <span>
            Overall Average: {data.statistics.overallAverage ? data.statistics.overallAverage.toFixed(1) : "N/A"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default StudentPreviousMarksPage;
