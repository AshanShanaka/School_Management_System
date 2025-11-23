"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Eye, X, TrendingUp, TrendingDown, Award, BarChart3 } from "lucide-react";

const AdminExamResultsPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedClassId = searchParams.get("classId") ? parseInt(searchParams.get("classId")!) : null;
  const selectedExamId = searchParams.get("examId") ? parseInt(searchParams.get("examId")!) : null;

  const [classes, setClasses] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [examResults, setExamResults] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);

  // Fetch classes
  useEffect(() => {
    fetch("/api/classes?page=1&search=")
      .then((res) => res.json())
      .then((data) => {
        setClasses(data.classes || []);
        setLoading(false);
      });
  }, []);

  // Fetch exams when class is selected
  useEffect(() => {
    if (selectedClassId) {
      const selectedClass = classes.find((c) => c.id === selectedClassId);
      if (selectedClass) {
        fetch(`/api/exams?gradeId=${selectedClass.gradeId}`)
          .then((res) => res.json())
          .then((data) => setExams(data));
      }
    } else {
      setExams([]);
    }
  }, [selectedClassId, classes]);

  // Fetch exam results when both class and exam are selected
  useEffect(() => {
    if (selectedClassId && selectedExamId) {
      setLoading(true);
      fetch(`/api/admin/exam-results?classId=${selectedClassId}&examId=${selectedExamId}`)
        .then((res) => res.json())
        .then((data) => {
          setExamResults(data);
          setLoading(false);
        });
    } else {
      setExamResults(null);
      setLoading(false);
    }
  }, [selectedClassId, selectedExamId]);

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case "A":
        return "bg-green-100 text-green-800 border-green-300";
      case "B":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "C":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "S":
        return "bg-orange-100 text-orange-800 border-orange-300";
      case "W":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/50 via-white to-indigo-50/50 p-6">
      <div className="max-w-[1800px] mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white/40 backdrop-blur-xl rounded-3xl shadow-xl border border-white/60 p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-600 bg-clip-text text-transparent">
                📊 Class-wise Exam Results
              </h1>
              <p className="text-gray-700 text-lg">
                View and analyze exam results by class
              </p>
            </div>
            <Link
              href="/list/exams"
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-semibold transition-all"
            >
              ← Back to Exams
            </Link>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Class Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Select Class <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedClassId || ""}
                onChange={(e) => {
                  const classId = e.target.value;
                  router.push(classId ? `/admin/exam-results?classId=${classId}` : "/admin/exam-results");
                }}
                className="w-full p-3 border-2 border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
              >
                <option value="">-- Select a Class --</option>
                {classes.map((cls: any) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} (Grade {cls.grade.level}) - {cls._count.students} students
                  </option>
                ))}
              </select>
            </div>

            {/* Exam Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Select Exam <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedExamId || ""}
                onChange={(e) => {
                  const examId = e.target.value;
                  if (examId && selectedClassId) {
                    router.push(`/admin/exam-results?classId=${selectedClassId}&examId=${examId}`);
                  }
                }}
                disabled={!selectedClassId}
                className="w-full p-3 border-2 border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">-- Select an Exam --</option>
                {exams.map((exam: any) => (
                  <option key={exam.id} value={exam.id}>
                    {exam.title} (Term {exam.term}, {exam.year})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Results Display */}
        {examResults && (
          <div className="space-y-6">
            {/* Exam Info Header */}
            <div className="bg-white/50 backdrop-blur-xl rounded-3xl shadow-lg p-6 border-2 border-indigo-200/50">
              <h2 className="text-2xl font-bold text-indigo-900 mb-2">
                {examResults.exam.title}
              </h2>
              <div className="flex items-center gap-4 text-sm text-gray-700">
                <span className="flex items-center gap-1">
                  📅 Term {examResults.exam.term}, {examResults.exam.year}
                </span>
                <span className="flex items-center gap-1">
                  👥 {examResults.students.length} Students
                </span>
                <span className="flex items-center gap-1">
                  📚 {examResults.exam.examSubjects.length} Subjects
                </span>
              </div>
            </div>

            {/* Student Results List */}
            <div className="bg-white/60 backdrop-blur-xl rounded-3xl shadow-lg border-2 border-indigo-200/50 overflow-hidden">
              <div className="divide-y divide-gray-200">
                {examResults.students.map((student: any, index: number) => {
                  const summary = student.examSummaries[0];
                  const percentage = summary?.average || 0;
                  
                  return (
                    <div
                      key={student.id}
                      className="p-4 hover:bg-indigo-50/50 transition-colors cursor-pointer group"
                      onClick={() => {
                        setSelectedStudent({ ...student, summary });
                        setShowModal(true);
                      }}
                    >
                      <div className="flex items-center justify-between gap-4">
                        {/* Left: Rank + Name */}
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {summary?.classRank && (
                            <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-400 text-white font-bold shadow-md text-sm">
                              #{summary.classRank}
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <h3 className="text-base font-bold text-gray-900 group-hover:text-indigo-700 transition-colors truncate">
                              {student.name} {student.surname}
                            </h3>
                            <div className="text-xs text-gray-500">ID: {student.id}</div>
                          </div>
                        </div>

                        {/* Middle: Stats */}
                        <div className="flex items-center gap-4">
                          {/* Total Marks */}
                          <div className="text-center">
                            <div className="text-xs text-gray-600 mb-1">Total</div>
                            <div className="text-lg font-bold text-indigo-900">
                              {summary?.totalMarks || "-"}
                            </div>
                          </div>

                          {/* Average */}
                          <div className="text-center">
                            <div className="text-xs text-gray-600 mb-1">Average</div>
                            <div className="text-lg font-bold text-purple-900">
                              {summary?.average.toFixed(1) || "-"}%
                            </div>
                          </div>

                          {/* Grade */}
                          <div className="text-center">
                            <div className="text-xs text-gray-600 mb-1">Grade</div>
                            <div>
                              {summary?.overallGrade ? (
                                <span className={`text-xl font-bold px-3 py-1 rounded-lg ${getGradeColor(summary.overallGrade)}`}>
                                  {summary.overallGrade}
                                </span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </div>
                          </div>

                          {/* Performance Bar */}
                          <div className="w-32">
                            <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  percentage >= 75
                                    ? "bg-gradient-to-r from-green-400 to-emerald-500"
                                    : percentage >= 65
                                    ? "bg-gradient-to-r from-blue-400 to-blue-500"
                                    : percentage >= 50
                                    ? "bg-gradient-to-r from-yellow-400 to-yellow-500"
                                    : percentage >= 35
                                    ? "bg-gradient-to-r from-orange-400 to-orange-500"
                                    : "bg-gradient-to-r from-red-400 to-red-500"
                                }`}
                                style={{ width: `${Math.min(percentage, 100)}%` }}
                              ></div>
                            </div>
                            <div className="text-xs text-gray-600 mt-0.5 text-center">
                              {percentage.toFixed(0)}%
                            </div>
                          </div>
                        </div>

                        {/* Right: View Button */}
                        <button className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold rounded-lg hover:from-indigo-600 hover:to-purple-600 transition-all shadow-md hover:shadow-lg text-sm">
                          <Eye size={16} />
                          <span>Details</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {examResults.students.length === 0 && (
              <div className="text-center py-12 bg-white/50 backdrop-blur-xl rounded-3xl shadow-lg border-2 border-indigo-200/50">
                <div className="text-6xl mb-4">📭</div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  No Students Found
                </h3>
                <p className="text-gray-600">
                  This class doesn't have any students yet.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!examResults && (
          <div className="bg-white/50 backdrop-blur-xl rounded-3xl shadow-lg p-12 border-2 border-indigo-200/50 text-center">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              Select Class and Exam
            </h3>
            <p className="text-gray-600 mb-4">
              Choose a class and exam from the dropdowns above to view results
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-indigo-600">
              <span>💡</span>
              <span>Results are organized by class for easier management</span>
            </div>
          </div>
        )}
      </div>

      {/* Student Details Modal */}
      {showModal && selectedStudent && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-indigo-500 to-purple-500 text-white p-6 rounded-t-3xl flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-1">
                  {selectedStudent.name} {selectedStudent.surname}
                </h2>
                <p className="text-indigo-100">
                  {examResults.exam.title} - Detailed Results
                </p>
              </div>
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedStudent(null);
                }}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-yellow-100 to-orange-100 rounded-2xl p-4 border-2 border-yellow-300">
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="text-yellow-600" size={20} />
                    <span className="text-sm font-semibold text-gray-700">Rank</span>
                  </div>
                  <div className="text-3xl font-bold text-gray-900">
                    #{selectedStudent.summary?.classRank || "-"}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl p-4 border-2 border-blue-300">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="text-blue-600" size={20} />
                    <span className="text-sm font-semibold text-gray-700">Total Marks</span>
                  </div>
                  <div className="text-3xl font-bold text-gray-900">
                    {selectedStudent.summary?.totalMarks || "-"}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl p-4 border-2 border-purple-300">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="text-purple-600" size={20} />
                    <span className="text-sm font-semibold text-gray-700">Average</span>
                  </div>
                  <div className="text-3xl font-bold text-gray-900">
                    {selectedStudent.summary?.average.toFixed(1) || "-"}%
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-100 to-emerald-100 rounded-2xl p-4 border-2 border-green-300">
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="text-green-600" size={20} />
                    <span className="text-sm font-semibold text-gray-700">Grade</span>
                  </div>
                  <div className="text-3xl font-bold text-gray-900">
                    {selectedStudent.summary?.overallGrade || "-"}
                  </div>
                </div>
              </div>

              {/* Subject-wise Results */}
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span>📚</span>
                  <span>Subject-wise Performance</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {examResults.exam.examSubjects.map((examSubject: any) => {
                    const result = selectedStudent.examResults.find(
                      (r: any) => r.examSubject.subjectId === examSubject.subjectId
                    );

                    return (
                      <div
                        key={examSubject.id}
                        className="bg-gradient-to-br from-white to-indigo-50/50 rounded-2xl p-4 border-2 border-indigo-200/50 hover:shadow-lg transition-shadow"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-bold text-gray-900">
                            {examSubject.subject.name}
                          </h4>
                          {result && (
                            <span
                              className={`px-3 py-1 rounded-full border-2 font-bold ${getGradeColor(
                                result.grade || ""
                              )}`}
                            >
                              {result.grade}
                            </span>
                          )}
                        </div>

                        {result ? (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">Marks Obtained</span>
                              <span className="text-2xl font-bold text-indigo-900">
                                {result.marks}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">Max Marks</span>
                              <span className="text-lg font-semibold text-gray-700">
                                {examSubject.maxMarks || 100}
                              </span>
                            </div>
                            {/* Progress Bar */}
                            <div className="mt-2">
                              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all"
                                  style={{
                                    width: `${(result.marks / (examSubject.maxMarks || 100)) * 100}%`,
                                  }}
                                ></div>
                              </div>
                              <div className="text-xs text-gray-600 mt-1 text-right">
                                {((result.marks / (examSubject.maxMarks || 100)) * 100).toFixed(1)}%
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center text-gray-400 py-4">
                            No marks recorded
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Close Button */}
              <div className="flex justify-center pt-4">
                <button
                  onClick={() => {
                    setShowModal(false);
                    setSelectedStudent(null);
                  }}
                  className="px-8 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold rounded-xl hover:from-indigo-600 hover:to-purple-600 transition-all shadow-lg"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminExamResultsPage;
