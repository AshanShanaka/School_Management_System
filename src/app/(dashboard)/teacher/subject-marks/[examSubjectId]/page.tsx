"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "react-hot-toast";
import Image from "next/image";
import Link from "next/link";

interface StudentMark {
  studentId: string;
  studentName: string;
  studentSurname: string;
  username: string;
  className: string;
  marks: number;
  grade: string;
  percentage: number;
}

interface SubjectMarksDetail {
  examSubject: {
    id: number;
    subjectName: string;
    maxMarks: number;
    marksEntered: boolean;
    marksEnteredAt: string | null;
    teacherName: string;
  };
  exam: {
    id: number;
    title: string;
    year: number;
    term: number;
    gradeLevel: number;
  };
  statistics: {
    totalStudents: number;
    studentsWithMarks: number;
    averageMarks: number;
    averagePercentage: number;
    highestMarks: number;
    lowestMarks: number;
    passRate: number;
  };
  gradeDistribution: {
    [key: string]: number;
  };
  students: StudentMark[];
}

const SubjectMarksDetailPage = () => {
  const router = useRouter();
  const params = useParams();
  const examSubjectId = params.examSubjectId as string;

  const [data, setData] = useState<SubjectMarksDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterGrade, setFilterGrade] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"name" | "marks" | "percentage">("marks");

  useEffect(() => {
    if (examSubjectId) {
      fetchSubjectMarks();
    }
  }, [examSubjectId]);

  const fetchSubjectMarks = async () => {
    try {
      const response = await fetch(`/api/teacher/subject-marks/${examSubjectId}`);
      if (response.ok) {
        const result = await response.json();
        setData(result);
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to fetch subject marks");
      }
    } catch (error) {
      console.error("Error fetching subject marks:", error);
      toast.error("Failed to fetch subject marks");
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedStudents = () => {
    if (!data) return [];

    let filtered = data.students.filter((student) => {
      // Search filter
      if (searchTerm) {
        const fullName = `${student.studentName} ${student.studentSurname}`.toLowerCase();
        const matchesSearch =
          fullName.includes(searchTerm.toLowerCase()) ||
          student.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
          student.className.toLowerCase().includes(searchTerm.toLowerCase());
        if (!matchesSearch) return false;
      }

      // Grade filter
      if (filterGrade !== "all" && student.grade !== filterGrade) {
        return false;
      }

      return true;
    });

    // Sort
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return `${a.studentSurname} ${a.studentName}`.localeCompare(
            `${b.studentSurname} ${b.studentName}`
          );
        case "marks":
          return b.marks - a.marks;
        case "percentage":
          return b.percentage - a.percentage;
        default:
          return 0;
      }
    });
  };

  const getGradeColor = (grade: string) => {
    const colors: { [key: string]: string } = {
      "A+": "bg-green-100 text-green-800",
      A: "bg-green-100 text-green-800",
      "B+": "bg-blue-100 text-blue-800",
      B: "bg-blue-100 text-blue-800",
      "C+": "bg-yellow-100 text-yellow-800",
      C: "bg-yellow-100 text-yellow-800",
      D: "bg-orange-100 text-orange-800",
      F: "bg-red-100 text-red-800",
      AB: "bg-gray-100 text-gray-800",
    };
    return colors[grade] || "bg-gray-100 text-gray-800";
  };

  if (loading) {
    return (
      <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2">Loading subject marks...</span>
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
          <h3 className="text-xl font-semibold text-gray-500 mb-2">Subject Marks Not Found</h3>
          <p className="text-gray-400 mb-4">The requested subject marks could not be found or you don't have access.</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const sortedStudents = filteredAndSortedStudents();
  const uniqueGrades = Array.from(new Set(data.students.map((s) => s.grade))).sort();

  return (
    <div className="bg-white p-6 rounded-md flex-1 m-4 mt-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"
          >
            <Image src="/arrow-left.png" alt="Back" width={16} height={16} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{data.examSubject.subjectName} - Detailed Marks</h1>
            <p className="text-gray-600">
              {data.exam.title} • Grade {data.exam.gradeLevel} • {data.exam.year} • Term {data.exam.term}
            </p>
            <p className="text-sm text-gray-500">
              Teacher: {data.examSubject.teacherName} • Max Marks: {data.examSubject.maxMarks}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Link
            href={`/teacher/exam-overview/${data.exam.id}`}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 flex items-center gap-2"
          >
            <Image src="/view.png" alt="Overview" width={16} height={16} />
            Exam Overview
          </Link>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm font-medium">Total Students</p>
              <p className="text-3xl font-bold text-blue-900">{data.statistics.totalStudents}</p>
              <p className="text-xs text-blue-600 mt-1">
                {data.statistics.studentsWithMarks} with marks
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
              <Image src="/student.png" alt="Students" width={24} height={24} />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm font-medium">Average</p>
              <p className="text-3xl font-bold text-green-900">{data.statistics.averageMarks.toFixed(1)}</p>
              <p className="text-xs text-green-600 mt-1">
                {data.statistics.averagePercentage.toFixed(1)}%
              </p>
            </div>
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">AVG</span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-lg border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-600 text-sm font-medium">Highest / Lowest</p>
              <p className="text-2xl font-bold text-purple-900">
                {data.statistics.highestMarks} / {data.statistics.lowestMarks}
              </p>
              <p className="text-xs text-purple-600 mt-1">
                Range: {data.statistics.highestMarks - data.statistics.lowestMarks} marks
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
              <Image src="/result.png" alt="Range" width={24} height={24} />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-lg border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-600 text-sm font-medium">Pass Rate</p>
              <p className="text-3xl font-bold text-orange-900">{data.statistics.passRate.toFixed(0)}%</p>
              <p className="text-xs text-orange-600 mt-1">
                {Math.round((data.statistics.passRate / 100) * data.statistics.studentsWithMarks)} passed
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grade Distribution */}
      <div className="mb-8 p-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border">
        <h3 className="text-lg font-semibold mb-4">Grade Distribution</h3>
        <div className="grid grid-cols-4 md:grid-cols-8 gap-4">
          {Object.entries(data.gradeDistribution)
            .sort((a, b) => b[1] - a[1])
            .map(([grade, count]) => (
              <div key={grade} className="text-center">
                <div className={`px-3 py-2 rounded-lg ${getGradeColor(grade)} font-bold`}>
                  {grade}
                </div>
                <p className="text-sm font-semibold text-gray-700 mt-2">{count}</p>
                <p className="text-xs text-gray-500">
                  {((count / data.statistics.studentsWithMarks) * 100).toFixed(0)}%
                </p>
              </div>
            ))}
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Image src="/search.png" alt="Search" width={16} height={16} />
            </div>
            <input
              type="text"
              placeholder="Search by name, username, or class..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <select
          value={filterGrade}
          onChange={(e) => setFilterGrade(e.target.value)}
          className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="all">All Grades</option>
          {uniqueGrades.map((grade) => (
            <option key={grade} value={grade}>
              Grade: {grade}
            </option>
          ))}
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as "name" | "marks" | "percentage")}
          className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="marks">Sort by Marks</option>
          <option value="percentage">Sort by Percentage</option>
          <option value="name">Sort by Name</option>
        </select>
      </div>

      {/* Students Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  #
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Username
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Class
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Marks
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Percentage
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Grade
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="text-gray-400 mb-2">
                      <Image
                        src="/student.png"
                        alt="No students"
                        width={48}
                        height={48}
                        className="mx-auto opacity-50"
                      />
                    </div>
                    <p className="text-gray-500">No students found matching your filters.</p>
                  </td>
                </tr>
              ) : (
                sortedStudents.map((student, index) => (
                  <tr key={student.studentId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {student.studentName} {student.studentSurname}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {student.username}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                        {student.className}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        {student.marks} / {data.examSubject.maxMarks}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">
                            {student.percentage.toFixed(1)}%
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                            <div
                              className={`h-2 rounded-full ${
                                student.percentage >= 75
                                  ? "bg-green-500"
                                  : student.percentage >= 50
                                  ? "bg-blue-500"
                                  : student.percentage >= 35
                                  ? "bg-yellow-500"
                                  : "bg-red-500"
                              }`}
                              style={{ width: `${student.percentage}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-sm font-semibold rounded-full ${getGradeColor(student.grade)}`}>
                        {student.grade}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Summary */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            Showing {sortedStudents.length} of {data.statistics.totalStudents} students
          </span>
          <span>
            Average: {data.statistics.averagePercentage.toFixed(1)}% • Pass Rate: {data.statistics.passRate.toFixed(0)}%
          </span>
        </div>
      </div>
    </div>
  );
};

export default SubjectMarksDetailPage;
