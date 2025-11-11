"use client";

import { Award, TrendingUp, Calendar, User, Trophy, Target } from "lucide-react";

interface SubjectResult {
  subject: string;
  marks: number;
  grade: string;
  classAverage: number;
}

interface ReportCardData {
  studentId: string;
  studentName: string;
  className: string;
  examName: string;
  examDate: string;
  term: string;
  subjects: SubjectResult[];
  totalMarks: number;
  maxMarks: number;
  percentage: number;
  average: number;
  classPlace: number;
  totalStudents: number;
  attendance: {
    present: number;
    total: number;
  };
}

// Mock data for Kasun Silva
const MOCK_REPORT_CARD: ReportCardData = {
  studentId: "STU2024001",
  studentName: "Kasun Silva",
  className: "Grade 11 - Science A",
  examName: "Second Term Examination 2025",
  examDate: "September 15, 2025",
  term: "Term 2",
  subjects: [
    { subject: "English", marks: 78, grade: "A", classAverage: 72 },
    { subject: "Mathematics", marks: 85, grade: "A", classAverage: 68 },
    { subject: "Religion", marks: 72, grade: "B+", classAverage: 75 },
    { subject: "History", marks: 80, grade: "A", classAverage: 70 },
    { subject: "Sinhala", marks: 88, grade: "A+", classAverage: 76 },
    { subject: "Science", marks: 82, grade: "A", classAverage: 65 },
  ],
  totalMarks: 485,
  maxMarks: 600,
  percentage: 80.83,
  average: 80.83,
  classPlace: 3,
  totalStudents: 35,
  attendance: {
    present: 92,
    total: 95,
  },
};

interface ReportCardDemoProps {
  userRole: "student" | "parent" | "teacher";
}

export default function ReportCardDemo({ userRole }: ReportCardDemoProps) {
  const data = MOCK_REPORT_CARD;

  const getGradeColor = (grade: string) => {
    if (grade.includes("A")) return "text-green-600 bg-green-50";
    if (grade.includes("B")) return "text-blue-600 bg-blue-50";
    if (grade.includes("C")) return "text-yellow-600 bg-yellow-50";
    return "text-red-600 bg-red-50";
  };

  const getPerformanceColor = (marks: number, classAvg: number) => {
    if (marks > classAvg) return "text-green-600";
    if (marks < classAvg) return "text-red-600";
    return "text-gray-600";
  };

  const getAttendancePercentage = () => {
    return ((data.attendance.present / data.attendance.total) * 100).toFixed(1);
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-8 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Report Card</h1>
            <p className="text-blue-100">{data.examName}</p>
          </div>
          <div className="text-right">
            <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
              <div className="text-sm text-blue-100">Date Issued</div>
              <div className="text-lg font-semibold">{data.examDate}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Student Information */}
      <div className="bg-white rounded-lg border shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-blue-600" />
          Student Information
        </h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <div className="text-sm text-gray-500">Student Name</div>
            <div className="font-semibold text-gray-900">{data.studentName}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Student ID</div>
            <div className="font-semibold text-gray-900">{data.studentId}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Class</div>
            <div className="font-semibold text-gray-900">{data.className}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Term</div>
            <div className="font-semibold text-gray-900">{data.term}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Attendance</div>
            <div className="font-semibold text-gray-900">
              {data.attendance.present}/{data.attendance.total} days ({getAttendancePercentage()}%)
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Class Rank</div>
            <div className="font-semibold text-gray-900 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-500" />
              {data.classPlace} of {data.totalStudents}
            </div>
          </div>
        </div>
      </div>

      {/* Performance Summary */}
      <div className="grid md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border shadow-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-500">Total Marks</div>
            <Target className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {data.totalMarks}/{data.maxMarks}
          </div>
        </div>
        <div className="bg-white rounded-lg border shadow-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-500">Percentage</div>
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-green-600">
            {data.percentage.toFixed(2)}%
          </div>
        </div>
        <div className="bg-white rounded-lg border shadow-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-500">Average</div>
            <Award className="w-5 h-5 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-purple-600">
            {data.average.toFixed(2)}%
          </div>
        </div>
        <div className="bg-white rounded-lg border shadow-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-500">Class Position</div>
            <Trophy className="w-5 h-5 text-yellow-500" />
          </div>
          <div className="text-2xl font-bold text-yellow-600">
            #{data.classPlace}
          </div>
        </div>
      </div>

      {/* Subject-wise Performance */}
      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b">
          <h2 className="text-xl font-bold text-gray-900">
            Subject-wise Performance
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Detailed marks breakdown for all subjects
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b-2 border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  Subject
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">
                  Marks Obtained
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">
                  Grade
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">
                  Class Average
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">
                  Performance
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.subjects.map((subject, index) => (
                <tr
                  key={index}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">
                      {subject.subject}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-lg font-bold text-gray-900">
                      {subject.marks}
                    </span>
                    <span className="text-sm text-gray-500">/100</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${getGradeColor(
                        subject.grade
                      )}`}
                    >
                      {subject.grade}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-sm text-gray-600">
                      {subject.classAverage}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <span
                        className={`font-semibold ${getPerformanceColor(
                          subject.marks,
                          subject.classAverage
                        )}`}
                      >
                        {subject.marks > subject.classAverage
                          ? "Above"
                          : subject.marks < subject.classAverage
                          ? "Below"
                          : "At"}{" "}
                        Average
                      </span>
                      {subject.marks > subject.classAverage && (
                        <TrendingUp className="w-4 h-4 text-green-600" />
                      )}
                      {subject.marks < subject.classAverage && (
                        <TrendingUp className="w-4 h-4 text-red-600 rotate-180" />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-blue-50 border-t-2 border-blue-200">
              <tr>
                <td className="px-6 py-4 font-bold text-gray-900">TOTAL</td>
                <td className="px-6 py-4 text-center">
                  <span className="text-xl font-bold text-blue-600">
                    {data.totalMarks}
                  </span>
                  <span className="text-sm text-gray-600">/{data.maxMarks}</span>
                </td>
                <td className="px-6 py-4 text-center" colSpan={3}>
                  <div className="flex items-center justify-center gap-4">
                    <div>
                      <span className="text-sm text-gray-600">Average: </span>
                      <span className="text-lg font-bold text-blue-600">
                        {data.average.toFixed(2)}%
                      </span>
                    </div>
                    <div className="h-6 w-px bg-gray-300"></div>
                    <div>
                      <span className="text-sm text-gray-600">Rank: </span>
                      <span className="text-lg font-bold text-yellow-600">
                        #{data.classPlace} / {data.totalStudents}
                      </span>
                    </div>
                  </div>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Performance Chart */}
      <div className="bg-white rounded-lg border shadow-sm p-6">
        <h3 className="font-bold text-gray-900 mb-4">Performance Overview</h3>
        <div className="space-y-3">
          {data.subjects.map((subject, index) => {
            const percentage = subject.marks;
            return (
              <div key={index}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-gray-700">
                    {subject.subject}
                  </span>
                  <span className="text-gray-600">{subject.marks}/100</span>
                </div>
                <div className="relative w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all"
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Teacher's Remarks */}
      <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-lg border-2 border-amber-200 p-6">
        <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-600" />
          Teacher's Remarks
        </h3>
        <p className="text-gray-700 leading-relaxed">
          Kasun has shown excellent progress this term. His performance in
          Mathematics and Sinhala is particularly commendable. He demonstrates
          strong analytical skills and actively participates in class
          discussions. To further improve, focus on consistent study habits in
          Religion and maintain the excellent work in other subjects. Keep up
          the good work!
        </p>
      </div>

      {/* Strengths and Areas for Improvement */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-green-50 rounded-lg border border-green-200 p-6">
          <h3 className="font-bold text-green-900 mb-3 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Strengths
          </h3>
          <ul className="space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-1">•</span>
              <span className="text-green-800">
                Excellent performance in Mathematics (85%)
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-1">•</span>
              <span className="text-green-800">
                Outstanding Sinhala language skills (88%)
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-1">•</span>
              <span className="text-green-800">
                Strong performance in Science (82%)
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-1">•</span>
              <span className="text-green-800">
                Consistent attendance (96.8%)
              </span>
            </li>
          </ul>
        </div>
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
          <h3 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
            <Target className="w-5 h-5" />
            Areas for Improvement
          </h3>
          <ul className="space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span className="text-blue-800">
                Focus more on Religion studies to reach class average
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span className="text-blue-800">
                Practice more English writing skills
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span className="text-blue-800">
                Participate more actively in History discussions
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span className="text-blue-800">
                Maintain consistent study schedule
              </span>
            </li>
          </ul>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-50 rounded-lg border p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Report generated on</p>
            <p className="font-semibold text-gray-900">
              {new Date().toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Viewing as</p>
            <p className="font-semibold text-gray-900 capitalize">{userRole}</p>
          </div>
        </div>
      </div>

      {/* Print Button */}
      <div className="flex justify-center">
        <button
          onClick={() => window.print()}
          className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2 shadow-lg"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
            />
          </svg>
          Print Report Card
        </button>
      </div>
    </div>
  );
}
