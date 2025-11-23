"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "react-hot-toast";
import Image from "next/image";
import Link from "next/link";

interface SubjectOverview {
  id: number;
  subjectId: number;
  subjectName: string;
  teacherId: string | null;
  teacherName: string;
  maxMarks: number;
  marksEntered: boolean;
  marksEnteredAt: string | null;
  totalStudents: number;
  studentsWithMarks: number;
  averageMarks: number | null;
  highestMarks: number | null;
  lowestMarks: number | null;
}

interface ExamOverview {
  exam: {
    id: number;
    title: string;
    year: number;
    term: number;
    status: string;
    grade: {
      level: number;
    };
  };
  isClassTeacher: boolean;
  isSubjectTeacher: boolean;
  teachingSubjects: number[];
  subjects: SubjectOverview[];
  overallStats: {
    totalSubjects: number;
    completedSubjects: number;
    pendingSubjects: number;
    totalStudents: number;
  };
}

const TeacherExamOverviewPage = () => {
  const router = useRouter();
  const params = useParams();
  const examId = params.examId as string;

  const [overview, setOverview] = useState<ExamOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"all" | "my">("all");

  useEffect(() => {
    if (examId) {
      fetchExamOverview();
    }
  }, [examId]);

  const fetchExamOverview = async () => {
    try {
      const response = await fetch(`/api/teacher/exam-overview/${examId}`);
      if (response.ok) {
        const data = await response.json();
        setOverview(data);
        // Default to "my" view for subject teachers who aren't class teachers
        if (data.isSubjectTeacher && !data.isClassTeacher) {
          setViewMode("my");
        }
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to fetch exam overview");
      }
    } catch (error) {
      console.error("Error fetching exam overview:", error);
      toast.error("Failed to fetch exam overview");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2">Loading exam overview...</span>
        </div>
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
        <div className="text-center py-12">
          <p className="text-gray-500">Exam overview not found or you don't have access.</p>
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

  const filteredSubjects = viewMode === "my" 
    ? overview.subjects.filter(s => overview.teachingSubjects.includes(s.subjectId))
    : overview.subjects;

  const getProgressPercentage = () => {
    return overview.overallStats.totalSubjects > 0
      ? (overview.overallStats.completedSubjects / overview.overallStats.totalSubjects) * 100
      : 0;
  };

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
            <h1 className="text-2xl font-bold text-gray-800">Exam Marks Overview</h1>
            <p className="text-gray-600">
              {overview.exam.title} • Grade {overview.exam.grade.level} • {overview.exam.year} • Term {overview.exam.term}
            </p>
          </div>
        </div>
        
        {/* Role Badge */}
        <div className="flex gap-2">
          {overview.isClassTeacher && (
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
              📋 Class Teacher
            </span>
          )}
          {overview.isSubjectTeacher && (
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
              📚 Subject Teacher
            </span>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm font-medium">Total Subjects</p>
              <p className="text-3xl font-bold text-blue-900">{overview.overallStats.totalSubjects}</p>
            </div>
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
              <Image src="/subject.png" alt="Subjects" width={24} height={24} />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm font-medium">Completed</p>
              <p className="text-3xl font-bold text-green-900">{overview.overallStats.completedSubjects}</p>
            </div>
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
              <Image src="/result.png" alt="Completed" width={24} height={24} />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-lg border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-600 text-sm font-medium">Pending</p>
              <p className="text-3xl font-bold text-orange-900">{overview.overallStats.pendingSubjects}</p>
            </div>
            <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
              <Image src="/update.png" alt="Pending" width={24} height={24} />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-lg border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-600 text-sm font-medium">Students</p>
              <p className="text-3xl font-bold text-purple-900">{overview.overallStats.totalStudents}</p>
            </div>
            <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
              <Image src="/student.png" alt="Students" width={24} height={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border">
        <h3 className="text-lg font-semibold mb-4">Overall Progress</h3>
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-gray-700">
            Marks Entry Progress
          </span>
          <span className="text-sm text-gray-600">
            {overview.overallStats.completedSubjects} / {overview.overallStats.totalSubjects} subjects completed
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-300"
            style={{ width: `${getProgressPercentage()}%` }}
          />
        </div>
        <div className="text-right mt-2">
          <span className="text-lg font-bold text-gray-800">
            {getProgressPercentage().toFixed(0)}%
          </span>
        </div>
      </div>

      {/* View Toggle (Only show if both class teacher AND subject teacher) */}
      {overview.isClassTeacher && overview.isSubjectTeacher && (
        <div className="mb-6 flex gap-2 border-b">
          <button
            onClick={() => setViewMode("all")}
            className={`px-6 py-3 font-medium transition-colors ${
              viewMode === "all"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            All Subjects ({overview.subjects.length})
          </button>
          <button
            onClick={() => setViewMode("my")}
            className={`px-6 py-3 font-medium transition-colors ${
              viewMode === "my"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            My Subjects ({overview.teachingSubjects.length})
          </button>
        </div>
      )}

      {/* Subject Cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">
            {viewMode === "my" ? "Your Teaching Subjects" : "All Subjects"} Marks Status
          </h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredSubjects.map((subject) => {
            const isMySubject = overview.teachingSubjects.includes(subject.subjectId);
            const completionPercentage = subject.totalStudents > 0
              ? (subject.studentsWithMarks / subject.totalStudents) * 100
              : 0;

            return (
              <div
                key={subject.id}
                className={`border-2 rounded-lg p-6 transition-all ${
                  subject.marksEntered
                    ? "border-green-200 bg-green-50"
                    : "border-orange-200 bg-orange-50"
                } ${isMySubject ? "ring-2 ring-blue-300" : ""}`}
              >
                {/* Subject Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-bold text-gray-800 text-lg">
                        {subject.subjectName}
                      </h4>
                      {isMySubject && (
                        <span className="px-2 py-0.5 bg-blue-500 text-white rounded text-xs font-medium">
                          YOU
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      Teacher: {subject.teacherName}
                    </p>
                    <p className="text-sm text-gray-600">
                      Max Marks: {subject.maxMarks}
                    </p>
                  </div>
                  
                  {/* Status Badge */}
                  <div>
                    {subject.marksEntered ? (
                      <div className="flex flex-col items-end">
                        <span className="px-3 py-1 bg-green-600 text-white rounded-full text-sm font-medium mb-1">
                          ✓ Completed
                        </span>
                        {subject.marksEnteredAt && (
                          <span className="text-xs text-gray-500">
                            {new Date(subject.marksEnteredAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="px-3 py-1 bg-orange-600 text-white rounded-full text-sm font-medium">
                        ⏳ Pending
                      </span>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-600">Students with marks</span>
                    <span className="font-medium text-gray-800">
                      {subject.studentsWithMarks} / {subject.totalStudents}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        subject.marksEntered ? "bg-green-500" : "bg-orange-500"
                      }`}
                      style={{ width: `${completionPercentage}%` }}
                    />
                  </div>
                </div>

                {/* Statistics */}
                {subject.marksEntered && subject.averageMarks !== null && (
                  <div className="grid grid-cols-3 gap-3 mb-4 p-3 bg-white rounded border">
                    <div>
                      <p className="text-xs text-gray-500">Average</p>
                      <p className="text-sm font-bold text-gray-800">
                        {subject.averageMarks.toFixed(1)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Highest</p>
                      <p className="text-sm font-bold text-green-600">
                        {subject.highestMarks}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Lowest</p>
                      <p className="text-sm font-bold text-orange-600">
                        {subject.lowestMarks}
                      </p>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  {isMySubject && (
                    <Link
                      href={`/teacher/marks-entry/${overview.exam.id}`}
                      className={`flex-1 px-4 py-2 rounded-md text-center text-sm font-medium transition-colors ${
                        subject.marksEntered
                          ? "bg-green-600 text-white hover:bg-green-700"
                          : "bg-blue-600 text-white hover:bg-blue-700"
                      }`}
                    >
                      {subject.marksEntered ? "Update Marks" : "Enter Marks"}
                    </Link>
                  )}
                  
                  {subject.marksEntered && (
                    <Link
                      href={`/teacher/subject-marks/${subject.id}`}
                      className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-md text-center text-sm font-medium hover:bg-gray-50 transition-colors"
                    >
                      View Details
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {filteredSubjects.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No subjects found.</p>
          </div>
        )}
      </div>

      {/* Class Report Link (For Class Teachers) */}
      {overview.isClassTeacher && overview.overallStats.completedSubjects > 0 && (
        <div className="mt-8 p-6 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border-2 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-purple-900 mb-1">
                📊 Complete Class Report
              </h3>
              <p className="text-sm text-purple-700">
                View comprehensive class report with all students' results and rankings
              </p>
            </div>
            <Link
              href={`/teacher/class-report/${overview.exam.id}`}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
            >
              View Class Report
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherExamOverviewPage;
