"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "react-hot-toast";
import Image from "next/image";

interface StudentReport {
  id: string;
  name: string;
  surname: string;
  username: string;
  results: Array<{
    subject: {
      id: number;
      name: string;
    };
    marks: number;
    maxMarks: number;
    percentage: number;
    grade: string;
  }>;
  totalMarks: number;
  totalMaxMarks: number;
  overallPercentage: number;
  overallGrade: string;
  classRank: number;
}

interface ClassReport {
  exam: {
    id: number;
    title: string;
    grade: {
      id: number;
      level: number;
    };
  };
  classStats: {
    totalStudents: number;
    averageMarks: number;
    highestMarks: number;
    lowestMarks: number;
    averagePercentage: number;
  };
  students: StudentReport[];
}

const ClassTeacherReportPage = () => {
  const router = useRouter();
  const params = useParams();
  const examId = params.examId as string;

  const [reportData, setReportData] = useState<ClassReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "marks" | "rank">("rank");

  useEffect(() => {
    if (examId) {
      fetchClassReport();
    }
  }, [examId]);

  const fetchClassReport = async () => {
    try {
      const response = await fetch(`/api/class-report/${examId}`);
      if (response.ok) {
        const data = await response.json();
        setReportData(data);
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to fetch class report");
      }
    } catch (error) {
      console.error("Error fetching class report:", error);
      toast.error("Failed to fetch class report");
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedStudents = () => {
    if (!reportData) return [];
    
    let filtered = reportData.students.filter(student => {
      if (!searchTerm) return true;
      const fullName = `${student.name} ${student.surname}`.toLowerCase();
      return fullName.includes(searchTerm.toLowerCase()) || 
             student.username.toLowerCase().includes(searchTerm.toLowerCase());
    });

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return `${a.surname} ${a.name}`.localeCompare(`${b.surname} ${b.name}`);
        case "marks":
          return b.totalMarks - a.totalMarks;
        case "rank":
          return a.classRank - b.classRank;
        default:
          return 0;
      }
    });
  };

  const exportToPDF = () => {
    // Implementation for PDF export
    toast.info("PDF export feature coming soon!");
  };

  if (loading) {
    return (
      <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2">Loading class report...</span>
        </div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
        <div className="text-center py-12">
          <p className="text-gray-500">Report not found or you don't have access to view this class report.</p>
          <button
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const sortedStudents = filteredAndSortedStudents();

  return (
    <div className="bg-white p-6 rounded-md flex-1 m-4 mt-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-full bg-gray-200 hover:bg-gray-300"
          >
            <Image src="/arrow-left.png" alt="Back" width={16} height={16} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Class Report</h1>
            <p className="text-gray-600">
              {reportData.exam.title} • Grade {reportData.exam.grade.level}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={exportToPDF}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
          >
            <Image src="/download.png" alt="Export" width={16} height={16} />
            Export PDF
          </button>
        </div>
      </div>

      {/* Class Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm font-medium">Total Students</p>
              <p className="text-3xl font-bold text-blue-900">{reportData.classStats.totalStudents}</p>
            </div>
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
              <Image src="/student.png" alt="Students" width={24} height={24} />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm font-medium">Class Average</p>
              <p className="text-3xl font-bold text-green-900">
                {reportData.classStats.averagePercentage.toFixed(1)}%
              </p>
            </div>
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">%</span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-lg border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-600 text-sm font-medium">Highest Score</p>
              <p className="text-3xl font-bold text-purple-900">{reportData.classStats.highestMarks}</p>
            </div>
            <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
              <Image src="/result.png" alt="Highest" width={24} height={24} />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-lg border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-600 text-sm font-medium">Lowest Score</p>
              <p className="text-3xl font-bold text-orange-900">{reportData.classStats.lowestMarks}</p>
            </div>
            <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">L</span>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Image src="/search.png" alt="Search" width={16} height={16} />
            </div>
            <input
              type="text"
              placeholder="Search students by name or username..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        <div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "name" | "marks" | "rank")}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="rank">Sort by Rank</option>
            <option value="name">Sort by Name</option>
            <option value="marks">Sort by Marks</option>
          </select>
        </div>
      </div>

      {/* Students Report Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rank
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Username
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Marks
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Percentage
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Grade
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subject Breakdown
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedStudents.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        student.classRank === 1 ? "bg-yellow-100 text-yellow-800" :
                        student.classRank === 2 ? "bg-gray-100 text-gray-800" :
                        student.classRank === 3 ? "bg-orange-100 text-orange-800" :
                        "bg-blue-100 text-blue-800"
                      }`}>
                        {student.classRank}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {student.name} {student.surname}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {student.username}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {student.totalMarks} / {student.totalMaxMarks}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {student.overallPercentage.toFixed(1)}%
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      student.overallGrade === "A+" || student.overallGrade === "A" ? "bg-green-100 text-green-800" :
                      student.overallGrade === "B+" || student.overallGrade === "B" ? "bg-blue-100 text-blue-800" :
                      student.overallGrade === "C+" || student.overallGrade === "C" ? "bg-yellow-100 text-yellow-800" :
                      student.overallGrade === "D" ? "bg-orange-100 text-orange-800" :
                      "bg-red-100 text-red-800"
                    }`}>
                      {student.overallGrade}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {student.results.slice(0, 3).map((result) => (
                        <span
                          key={result.subject.id}
                          className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded"
                          title={`${result.subject.name}: ${result.marks}/${result.maxMarks} (${result.grade})`}
                        >
                          {result.subject.name}: {result.grade}
                        </span>
                      ))}
                      {student.results.length > 3 && (
                        <span className="px-2 py-1 text-xs bg-gray-200 text-gray-500 rounded">
                          +{student.results.length - 3} more
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => router.push(`/student/report-card/${examId}/${student.id}`)}
                      className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                    >
                      <Image src="/view.png" alt="View" width={14} height={14} />
                      View Report
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Footer */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            Showing {sortedStudents.length} of {reportData.classStats.totalStudents} students
          </span>
          <span>
            Class Average: {reportData.classStats.averagePercentage.toFixed(1)}% • 
            Range: {reportData.classStats.lowestMarks} - {reportData.classStats.highestMarks} marks
          </span>
        </div>
      </div>
    </div>
  );
};

export default ClassTeacherReportPage;
