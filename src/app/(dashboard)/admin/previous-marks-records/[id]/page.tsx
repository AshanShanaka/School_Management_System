"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";

type ExamDetail = {
  id: number;
  title: string;
  year: number;
  term: number;
  grade: {
    id: number;
    level: number;
  };
  class: {
    id: number;
    name: string;
  } | null;
  examType: {
    name: string;
  };
  subjects: Array<{
    name: string;
    avgScore: number;
    passRate: number;
    highestScore: number;
    lowestScore: number;
    studentCount: number;
  }>;
  gradeDistribution: {
    A: number;
    B: number;
    C: number;
    S: number;
    F: number;
  };
  overallStats: {
    totalStudents: number;
    averageScore: number;
    passRate: number;
    highestScore: number;
    lowestScore: number;
  };
  topPerformers: Array<{
    studentName: string;
    totalScore: number;
    average: number;
  }>;
};

const GRADE_COLORS = {
  A: '#10b981',
  B: '#3b82f6',
  C: '#f59e0b',
  S: '#8b5cf6',
  F: '#ef4444',
};

const PreviousMarksDetailPage = ({ params }: { params: { id: string } }) => {
  const [examDetail, setExamDetail] = useState<ExamDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExamDetail = async () => {
      try {
        const response = await fetch(`/api/admin/previous-marks-records/detail/${params.id}`);
        const data = await response.json();
        setExamDetail(data);
      } catch (error) {
        console.error('Error fetching exam detail:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchExamDetail();
  }, [params.id]);

  if (loading) {
    return (
      <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
        <div className="text-center py-12">
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!examDetail) {
    return (
      <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
        <div className="text-center py-12">
          <p className="text-red-500">Exam not found</p>
        </div>
      </div>
    );
  }

  const gradeDistributionData = Object.entries(examDetail.gradeDistribution).map(([grade, count]) => ({
    grade,
    count,
    percentage: examDetail.overallStats.totalStudents > 0 
      ? ((count / examDetail.overallStats.totalStudents) * 100).toFixed(1)
      : '0',
  }));

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* HEADER */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Link href="/admin/previous-marks-records">
            <button className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300">
              ←
            </button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{examDetail.title}</h1>
            <p className="text-sm text-gray-600">
              Grade {examDetail.grade.level} {examDetail.class ? `- ${examDetail.class.name}` : ''} • {examDetail.year} • Term {examDetail.term} • {examDetail.examType.name}
            </p>
          </div>
        </div>
      </div>

      {/* OVERVIEW STATS */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <div className="text-xs text-purple-600 font-medium">Total Students</div>
          <div className="text-2xl font-bold text-purple-800 mt-1">{examDetail.overallStats.totalStudents}</div>
        </div>
        
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="text-xs text-blue-600 font-medium">Average Score</div>
          <div className="text-2xl font-bold text-blue-800 mt-1">{examDetail.overallStats.averageScore.toFixed(1)}%</div>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="text-xs text-green-600 font-medium">Pass Rate</div>
          <div className="text-2xl font-bold text-green-800 mt-1">{examDetail.overallStats.passRate.toFixed(1)}%</div>
        </div>
        
        <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
          <div className="text-xs text-orange-600 font-medium">Highest Score</div>
          <div className="text-2xl font-bold text-orange-800 mt-1">{examDetail.overallStats.highestScore}</div>
        </div>
        
        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <div className="text-xs text-red-600 font-medium">Lowest Score</div>
          <div className="text-2xl font-bold text-red-800 mt-1">{examDetail.overallStats.lowestScore}</div>
        </div>
      </div>

      {/* CHARTS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Subject-wise Performance Bar Chart */}
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Subject-wise Average Scores</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={examDetail.subjects}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Legend />
              <Bar dataKey="avgScore" fill="#8b5cf6" name="Average Score (%)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Grade Distribution Pie Chart */}
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Grade Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={gradeDistributionData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ grade, percentage }) => `${grade}: ${percentage}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {gradeDistributionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={GRADE_COLORS[entry.grade as keyof typeof GRADE_COLORS]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Pass Rate by Subject */}
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Pass Rate by Subject</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={examDetail.subjects}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Legend />
              <Bar dataKey="passRate" fill="#10b981" name="Pass Rate (%)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Subject Performance Radar Chart */}
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Subject Performance Overview</h2>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={examDetail.subjects}>
              <PolarGrid />
              <PolarAngleAxis dataKey="name" />
              <PolarRadiusAxis angle={90} domain={[0, 100]} />
              <Radar name="Average Score" dataKey="avgScore" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} />
              <Tooltip />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* SUBJECT DETAILS TABLE */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Detailed Subject Statistics</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="p-3 text-left text-sm font-semibold text-gray-700">Subject</th>
                <th className="p-3 text-center text-sm font-semibold text-gray-700">Students</th>
                <th className="p-3 text-center text-sm font-semibold text-gray-700">Average</th>
                <th className="p-3 text-center text-sm font-semibold text-gray-700">Pass Rate</th>
                <th className="p-3 text-center text-sm font-semibold text-gray-700">Highest</th>
                <th className="p-3 text-center text-sm font-semibold text-gray-700">Lowest</th>
              </tr>
            </thead>
            <tbody>
              {examDetail.subjects.map((subject, index) => (
                <tr key={index} className="border-b hover:bg-gray-50">
                  <td className="p-3">
                    <span className="font-medium text-gray-800">{subject.name}</span>
                  </td>
                  <td className="p-3 text-center">{subject.studentCount}</td>
                  <td className="p-3 text-center">
                    <span className={`px-2 py-1 rounded ${
                      subject.avgScore >= 75 ? 'bg-green-100 text-green-800' :
                      subject.avgScore >= 60 ? 'bg-blue-100 text-blue-800' :
                      subject.avgScore >= 40 ? 'bg-orange-100 text-orange-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {subject.avgScore.toFixed(1)}%
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <span className={`px-2 py-1 rounded ${
                      subject.passRate >= 75 ? 'bg-green-100 text-green-800' :
                      subject.passRate >= 50 ? 'bg-blue-100 text-blue-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {subject.passRate.toFixed(1)}%
                    </span>
                  </td>
                  <td className="p-3 text-center font-semibold text-green-600">{subject.highestScore}</td>
                  <td className="p-3 text-center font-semibold text-red-600">{subject.lowestScore}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* TOP PERFORMERS */}
      {examDetail.topPerformers.length > 0 && (
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Top 10 Performers</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {examDetail.topPerformers.map((student, index) => (
              <div key={index} className={`p-4 rounded-lg border-2 ${
                index === 0 ? 'bg-yellow-50 border-yellow-400' :
                index === 1 ? 'bg-gray-50 border-gray-400' :
                index === 2 ? 'bg-orange-50 border-orange-400' :
                'bg-blue-50 border-blue-200'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                    index === 0 ? 'bg-yellow-400 text-yellow-900' :
                    index === 1 ? 'bg-gray-400 text-gray-900' :
                    index === 2 ? 'bg-orange-400 text-orange-900' :
                    'bg-blue-400 text-blue-900'
                  }`}>
                    {index + 1}
                  </div>
                  <span className="text-sm font-medium text-gray-700">{student.studentName}</span>
                </div>
                <div className="text-xs text-gray-600">
                  <div>Total: <span className="font-semibold">{student.totalScore}</span></div>
                  <div>Average: <span className="font-semibold">{student.average.toFixed(1)}%</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PreviousMarksDetailPage;
