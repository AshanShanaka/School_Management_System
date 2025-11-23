/**
 * Class Teacher O/L Analytics Page
 * Shows O/L predictions for all students in the teacher's assigned class
 */

'use client';

import { useEffect, useState } from 'react';
import SubjectPredictionTable from '@/components/performance/SubjectPredictionTable';

interface StudentPrediction {
  student_id: string;
  name: string;
  prediction: {
    subject_predictions: any[];
    overall_average: number;
    risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
    risk_status: string;
    pass_probability: number;
    attendance_percentage: number;
  };
}

interface ClassSummary {
  total_students: number;
  high_risk_count: number;
  medium_risk_count: number;
  low_risk_count: number;
  class_average: number;
  high_risk_percentage: number;
}

export default function ClassTeacherOLAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [classSummary, setClassSummary] = useState<ClassSummary | null>(null);
  const [studentPredictions, setStudentPredictions] = useState<StudentPrediction[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [classId, setClassId] = useState<number | null>(null);

  useEffect(() => {
    fetchTeacherClass();
  }, []);

  useEffect(() => {
    if (classId) {
      fetchClassPredictions();
    }
  }, [classId]);

  const fetchTeacherClass = async () => {
    try {
      // Fetch teacher's assigned class
      const response = await fetch('/api/teacher/assigned-class');
      const data = await response.json();

      if (response.ok && data.success && data.hasAssignedClass && data.class) {
        setClassId(data.class.id);
      } else {
        setError(data.message || 'No class assigned to your account. Please contact the administrator.');
        setLoading(false);
      }
    } catch (err) {
      setError('Failed to fetch class information');
      setLoading(false);
    }
  };

  const fetchClassPredictions = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Fetching predictions for class:', classId);
      const response = await fetch(`/api/predictions/class/${classId}`);
      const data = await response.json();

      console.log('API Response:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch predictions');
      }

      console.log('Class Summary:', data.data.class_summary);
      console.log('Student Predictions:', data.data.student_predictions);

      setClassSummary(data.data.class_summary);
      setStudentPredictions(data.data.student_predictions);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (risk: string) => {
    const colors = {
      LOW: 'bg-green-100 text-green-800',
      MEDIUM: 'bg-yellow-100 text-yellow-800',
      HIGH: 'bg-red-100 text-red-800',
    };
    return colors[risk as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading class predictions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-2xl mx-auto">
          <div className="flex items-start gap-3">
            <span className="text-3xl">❌</span>
            <div>
              <h2 className="text-xl font-bold text-red-800 mb-2">Error</h2>
              <p className="text-red-700">{error}</p>
              {classId && (
                <button
                  onClick={fetchClassPredictions}
                  className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Try Again
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const selectedStudentData = studentPredictions.find(
    (s) => s.student_id === selectedStudent
  );

  console.log('Selected Student ID:', selectedStudent);
  console.log('Selected Student Data:', selectedStudentData);
  console.log('All Student Predictions:', studentPredictions);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Class O/L Analytics
        </h1>
        <p className="text-gray-600">
          Comprehensive O/L predictions and insights for your class
        </p>
      </div>

      {/* Class Summary Cards */}
      {classSummary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
            <p className="text-sm text-gray-600 mb-1">Total Students</p>
            <p className="text-3xl font-bold text-blue-700">
              {classSummary.total_students}
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
            <p className="text-sm text-gray-600 mb-1">Low Risk</p>
            <p className="text-3xl font-bold text-green-700">
              {classSummary.low_risk_count}
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-yellow-500">
            <p className="text-sm text-gray-600 mb-1">Medium Risk</p>
            <p className="text-3xl font-bold text-yellow-700">
              {classSummary.medium_risk_count}
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-red-500">
            <p className="text-sm text-gray-600 mb-1">High Risk</p>
            <p className="text-3xl font-bold text-red-700">
              {classSummary.high_risk_count}
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-500">
            <p className="text-sm text-gray-600 mb-1">Class Average</p>
            <p className="text-3xl font-bold text-purple-700">
              {classSummary.class_average.toFixed(1)}%
            </p>
          </div>
        </div>
      )}

      {/* Students Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">Student Predictions</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                  Student Name
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase">
                  Overall Average
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase">
                  Attendance
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase">
                  Risk Level
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase">
                  Pass Rate
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {studentPredictions.map((student) => (
                <tr key={student.student_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-semibold text-gray-800">
                    {student.name}
                  </td>
                  <td className="px-6 py-4 text-center text-lg font-bold text-blue-700">
                    {student.prediction.overall_average.toFixed(1)}%
                  </td>
                  <td className="px-6 py-4 text-center font-medium text-gray-700">
                    {student.prediction.attendance_percentage.toFixed(1)}%
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${getRiskColor(
                        student.prediction.risk_level
                      )}`}
                    >
                      {student.prediction.risk_status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center font-medium text-gray-700">
                    {(() => {
                      const passingSubjects = student.prediction.subject_predictions?.filter((p: any) => p.predicted_grade !== 'W' && p.predicted_mark >= 35).length || 0;
                      const totalSubjects = student.prediction.subject_predictions?.length || 1;
                      return ((passingSubjects / totalSubjects) * 100).toFixed(0);
                    })()}%
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => {
                        console.log('Clicked View Details for:', student.student_id);
                        console.log('Student data:', student);
                        setSelectedStudent(student.student_id);
                      }}
                      className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Student Details - Advanced ML Analytics Dashboard */}
      {selectedStudentData && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-60 z-50 flex items-center justify-center p-4 overflow-y-auto backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-2xl max-w-[1800px] w-full max-h-[95vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white px-8 py-5 flex justify-between items-center border-b border-gray-700">
              <div className="flex items-center gap-4">
                <div className="w-1 h-12 bg-blue-500"></div>
                <div>
                  <h2 className="text-2xl font-semibold">{selectedStudentData.name}</h2>
                  <p className="text-gray-300 text-sm">AI-Powered O/L Performance Analytics</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                className="px-5 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors font-medium"
              >
                Close
              </button>
            </div>

            <div className="flex-1 overflow-y-auto bg-gray-50">
              <div className="p-6 space-y-6">
                {/* KPI Cards Row */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div className="bg-white p-5 rounded-lg shadow border border-gray-200">
                    <div className="flex justify-between items-start mb-3">
                      <div className="text-sm font-medium text-gray-600 uppercase tracking-wide">Overall Average</div>
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    </div>
                    <div className="text-4xl font-bold text-gray-900 mb-1">
                      {selectedStudentData.prediction.overall_average.toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-500">Predicted Performance</div>
                  </div>

                  <div className="bg-white p-5 rounded-lg shadow border border-gray-200">
                    <div className="flex justify-between items-start mb-3">
                      <div className="text-sm font-medium text-gray-600 uppercase tracking-wide">Success Rate</div>
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    </div>
                    <div className="text-4xl font-bold text-gray-900 mb-1">
                      {(() => {
                        const passingSubjects = selectedStudentData.prediction.subject_predictions?.filter((p: any) => p.predicted_grade !== 'W' && p.predicted_mark >= 35).length || 0;
                        const totalSubjects = selectedStudentData.prediction.subject_predictions?.length || 1;
                        return ((passingSubjects / totalSubjects) * 100).toFixed(0);
                      })()}%
                    </div>
                    <div className="text-xs text-gray-500">Subjects Passing</div>
                  </div>

                  <div className="bg-white p-5 rounded-lg shadow border border-gray-200">
                    <div className="flex justify-between items-start mb-3">
                      <div className="text-sm font-medium text-gray-600 uppercase tracking-wide">Attendance</div>
                      <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                    </div>
                    <div className="text-4xl font-bold text-gray-900 mb-1">
                      {selectedStudentData.prediction.attendance_percentage.toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-500">Last 30 Days</div>
                  </div>

                  <div className="bg-white p-5 rounded-lg shadow border border-gray-200">
                    <div className="flex justify-between items-start mb-3">
                      <div className="text-sm font-medium text-gray-600 uppercase tracking-wide">Expected Pass</div>
                      <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                    </div>
                    <div className="text-4xl font-bold text-gray-900 mb-1">
                      {selectedStudentData.prediction.subject_predictions?.filter((p: any) => p.predicted_grade !== 'W' && p.predicted_mark >= 35).length || 0}
                      <span className="text-lg text-gray-500">/{selectedStudentData.prediction.subject_predictions?.length || 0}</span>
                    </div>
                    <div className="text-xs text-gray-500">Pass (≥35%) Subjects</div>
                  </div>

                  <div className={`p-5 rounded-lg shadow border-2 ${
                    selectedStudentData.prediction.risk_level === 'HIGH' 
                      ? 'bg-red-50 border-red-400'
                      : selectedStudentData.prediction.risk_level === 'MEDIUM'
                      ? 'bg-yellow-50 border-yellow-400'
                      : 'bg-green-50 border-green-400'
                  }`}>
                    <div className="flex justify-between items-start mb-3">
                      <div className="text-sm font-medium text-gray-600 uppercase tracking-wide">Risk Level</div>
                      <div className={`w-2 h-2 rounded-full ${
                        selectedStudentData.prediction.risk_level === 'HIGH' ? 'bg-red-500' :
                        selectedStudentData.prediction.risk_level === 'MEDIUM' ? 'bg-yellow-500' : 'bg-green-500'
                      }`}></div>
                    </div>
                    <div className={`text-2xl font-bold mb-1 ${
                      selectedStudentData.prediction.risk_level === 'HIGH' ? 'text-red-700' :
                      selectedStudentData.prediction.risk_level === 'MEDIUM' ? 'text-yellow-700' : 'text-green-700'
                    }`}>
                      {selectedStudentData.prediction.risk_status}
                    </div>
                    <div className="text-xs text-gray-600">AI Assessment</div>
                  </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left: Primary Chart - 70% width */}
                  <div className="lg:col-span-8 space-y-6">
                    {/* Performance Radar Chart with Benchmarks */}
                    <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                      <div className="flex items-center justify-between mb-5 pb-3 border-b border-gray-200">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-800">Subject Performance Matrix</h3>
                          <p className="text-xs text-gray-500 mt-1">Predicted grades vs. class benchmarks</p>
                        </div>
                        <div className="flex gap-4 text-xs">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-blue-500 rounded"></div>
                            <span className="text-gray-600">Student</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-0.5 bg-gray-400"></div>
                            <span className="text-gray-600">Class Avg (Benchmark)</span>
                          </div>
                        </div>
                      </div>
                      
                      {selectedStudentData.prediction.subject_predictions && 
                       selectedStudentData.prediction.subject_predictions.length > 0 ? (
                        <div className="space-y-1">
                          <div className="relative" style={{ height: '450px' }}>
                            {/* Y-Axis Labels */}
                            <div className="absolute left-0 top-0 bottom-8 w-16 flex flex-col justify-between text-xs text-gray-500 pr-2 border-r border-gray-200">
                              <span className="text-right font-medium">100%</span>
                              <span className="text-right">75%</span>
                              <span className="text-right">50%</span>
                              <span className="text-right">25%</span>
                              <span className="text-right">0%</span>
                            </div>

                            {/* Grade Level Markers (Right) */}
                            <div className="absolute right-0 top-0 bottom-8 w-12 flex flex-col justify-between text-xs text-gray-500 pl-2 border-l border-gray-200">
                              <span>A</span>
                              <span>B</span>
                              <span>C</span>
                              <span>S</span>
                              <span>W</span>
                            </div>

                            {/* Grid Lines */}
                            <div className="absolute left-16 right-12 top-0 bottom-8 flex flex-col justify-between">
                              {[0, 1, 2, 3, 4].map((i) => (
                                <div key={i} className="border-t border-gray-100"></div>
                              ))}
                            </div>

                            {/* Pass Line (35%) */}
                            <div className="absolute left-16 right-12 bottom-8" style={{ bottom: 'calc(2rem + 35%)' }}>
                              <div className="border-t-2 border-dashed border-red-300 relative">
                                <span className="absolute -top-5 left-2 text-xs text-red-600 font-semibold bg-red-50 px-2 py-0.5 rounded">
                                  Pass Line (35%)
                                </span>
                              </div>
                            </div>

                            {/* Chart Content */}
                            <div className="absolute left-16 right-12 top-0 bottom-8 flex items-end justify-around px-2">
                              {selectedStudentData.prediction.subject_predictions.map((pred: any, index: number) => {
                                const barHeight = pred.predicted_mark;
                                const classAvg = 60; // Mock class average - should come from API
                                const diff = pred.predicted_mark - pred.current_average;

                                return (
                                  <div key={index} className="flex-1 flex flex-col items-center justify-end px-1 relative group" style={{ height: '100%' }}>
                                    {/* Tooltip on Hover */}
                                    <div className="absolute bottom-full mb-2 hidden group-hover:block z-10 bg-gray-900 text-white text-xs rounded px-3 py-2 whitespace-nowrap shadow-lg">
                                      <div className="font-semibold mb-1">{pred.subject}</div>
                                      <div>Current: {pred.current_average.toFixed(1)}%</div>
                                      <div>Predicted: {pred.predicted_mark.toFixed(1)}%</div>
                                      <div>Grade: {pred.predicted_grade}</div>
                                      <div>Trend: {pred.trend}</div>
                                      <div>Confidence: {(pred.confidence * 100).toFixed(0)}%</div>
                                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full w-0 h-0 border-4 border-transparent border-t-gray-900"></div>
                                    </div>

                                    {/* Class Average Line (Benchmark) */}
                                    <div 
                                      className="absolute w-full border-t-2 border-gray-400 border-dashed"
                                      style={{ bottom: `${classAvg}%` }}
                                    />

                                    {/* Bar with Gradient */}
                                    <div 
                                      className={`w-full rounded-t transition-all duration-500 relative shadow-md ${
                                        pred.predicted_grade === 'A' ? 'bg-gradient-to-t from-green-600 to-green-400' :
                                        pred.predicted_grade === 'B' ? 'bg-gradient-to-t from-blue-600 to-blue-400' :
                                        pred.predicted_grade === 'C' ? 'bg-gradient-to-t from-yellow-600 to-yellow-400' :
                                        pred.predicted_grade === 'S' ? 'bg-gradient-to-t from-orange-600 to-orange-400' : 
                                        'bg-gradient-to-t from-red-600 to-red-400'
                                      }`}
                                      style={{ height: `${barHeight}%`, minHeight: '20px' }}
                                    >
                                      {/* Grade Badge on Top */}
                                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white border-2 border-gray-300 rounded-full w-8 h-8 flex items-center justify-center text-xs font-bold text-gray-800 shadow">
                                        {pred.predicted_grade}
                                      </div>

                                      {/* Percentage Inside Bar */}
                                      {barHeight > 15 && (
                                        <div className="absolute top-2 left-1/2 -translate-x-1/2 text-xs font-bold text-white">
                                          {pred.predicted_mark.toFixed(0)}%
                                        </div>
                                      )}

                                      {/* Trend Indicator */}
                                      {diff !== 0 && (
                                        <div className={`absolute -top-6 -right-2 text-xs font-bold ${
                                          diff > 0 ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                          {diff > 0 ? '↗' : '↘'}
                                          {Math.abs(diff).toFixed(0)}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            {/* X-Axis Labels */}
                            <div className="absolute left-16 right-12 bottom-0 h-8 flex justify-around items-start pt-2 border-t border-gray-200">
                              {selectedStudentData.prediction.subject_predictions.map((pred: any, index: number) => (
                                <div key={index} className="flex-1 text-center">
                                  <span className="text-xs text-gray-700 font-medium block truncate px-1">
                                    {pred.subject}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Chart Legend & Stats */}
                          <div className="mt-4 grid grid-cols-3 gap-3">
                            <div className="p-3 bg-blue-50 rounded border border-blue-200">
                              <div className="text-xs text-gray-600 mb-1">Above Class Avg</div>
                              <div className="text-2xl font-bold text-blue-700">
                                {selectedStudentData.prediction.subject_predictions.filter(
                                  (p: any) => p.predicted_mark >= 60
                                ).length}
                              </div>
                            </div>
                            <div className="p-3 bg-green-50 rounded border border-green-200">
                              <div className="text-xs text-gray-600 mb-1">A/B Grades</div>
                              <div className="text-2xl font-bold text-green-700">
                                {selectedStudentData.prediction.subject_predictions.filter(
                                  (p: any) => ['A', 'B'].includes(p.predicted_grade)
                                ).length}
                              </div>
                            </div>
                            <div className="p-3 bg-orange-50 rounded border border-orange-200">
                              <div className="text-xs text-gray-600 mb-1">Needs Attention</div>
                              <div className="text-2xl font-bold text-orange-700">
                                {selectedStudentData.prediction.subject_predictions.filter(
                                  (p: any) => p.predicted_mark < 50
                                ).length}
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-400">No data available</div>
                      )}
                    </div>

                    {/* Detailed Table */}
                    <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-3 border-b border-gray-200">Subject-wise Analysis</h3>
                      {selectedStudentData.prediction.subject_predictions && 
                       selectedStudentData.prediction.subject_predictions.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b-2 border-gray-200 bg-gray-50">
                                <th className="text-left py-3 px-4 font-semibold text-gray-700">Subject</th>
                                <th className="text-center py-3 px-4 font-semibold text-gray-700">Current</th>
                                <th className="text-center py-3 px-4 font-semibold text-gray-700">Predicted</th>
                                <th className="text-center py-3 px-4 font-semibold text-gray-700">Change</th>
                                <th className="text-center py-3 px-4 font-semibold text-gray-700">Grade</th>
                                <th className="text-center py-3 px-4 font-semibold text-gray-700">Trend</th>
                                <th className="text-center py-3 px-4 font-semibold text-gray-700">Confidence</th>
                                <th className="text-left py-3 px-4 font-semibold text-gray-700">Recommendation</th>
                              </tr>
                            </thead>
                            <tbody>
                              {selectedStudentData.prediction.subject_predictions.map((pred: any, index: number) => {
                                const diff = pred.predicted_mark - pred.current_average;
                                return (
                                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                                    <td className="py-3 px-4 font-medium text-gray-800">{pred.subject}</td>
                                    <td className="py-3 px-4 text-center text-gray-600">{pred.current_average.toFixed(1)}%</td>
                                    <td className="py-3 px-4 text-center">
                                      <span className="font-bold text-blue-600">{pred.predicted_mark.toFixed(1)}%</span>
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                      <span className={`font-semibold ${diff > 0 ? 'text-green-600' : diff < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                                        {diff > 0 ? '+' : ''}{diff.toFixed(1)}
                                      </span>
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                                        pred.predicted_grade === 'A' ? 'bg-green-100 text-green-700' :
                                        pred.predicted_grade === 'B' ? 'bg-blue-100 text-blue-700' :
                                        pred.predicted_grade === 'C' ? 'bg-yellow-100 text-yellow-700' :
                                        pred.predicted_grade === 'S' ? 'bg-orange-100 text-orange-700' :
                                        'bg-red-100 text-red-700'
                                      }`}>
                                        {pred.predicted_grade}
                                      </span>
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                      <span className={`text-xs font-medium ${
                                        pred.trend === 'IMPROVING' ? 'text-green-600' :
                                        pred.trend === 'DECLINING' ? 'text-red-600' : 'text-gray-600'
                                      }`}>
                                        {pred.trend === 'IMPROVING' ? '↗ Improving' :
                                         pred.trend === 'DECLINING' ? '↘ Declining' : '→ Stable'}
                                      </span>
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                      <div className="flex items-center justify-center gap-2">
                                        <div className="w-12 h-2 bg-gray-200 rounded-full overflow-hidden">
                                          <div 
                                            className={`h-full ${pred.confidence >= 0.7 ? 'bg-green-500' : pred.confidence >= 0.5 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                            style={{ width: `${pred.confidence * 100}%` }}
                                          />
                                        </div>
                                        <span className="text-xs font-semibold">{(pred.confidence * 100).toFixed(0)}%</span>
                                      </div>
                                    </td>
                                    <td className="py-3 px-4 text-xs text-gray-600">
                                      {pred.predicted_mark < 35 ? '🔴 Critical - Urgent help needed' :
                                       pred.predicted_mark < 50 ? '🟡 Focus required' :
                                       pred.trend === 'DECLINING' ? '🟠 Monitor closely' :
                                       '🟢 On track'}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-400">No data available</div>
                      )}
                    </div>
                  </div>

                  {/* Right Sidebar - 30% width */}
                  <div className="lg:col-span-4 space-y-6">
                    {/* Risk Meter */}
                    <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-3 border-b border-gray-200">AI Risk Assessment</h3>
                      
                      <div className="mb-6">
                        <div className="relative h-40 flex items-center justify-center">
                          {/* Semi-circular gauge */}
                          <div className="relative w-40 h-20 overflow-hidden">
                            <div className="absolute w-40 h-40 rounded-full border-[20px] border-gray-200" style={{ borderBottomColor: 'transparent' }}></div>
                            <div 
                              className="absolute w-40 h-40 rounded-full border-[20px] border-transparent"
                              style={{ 
                                borderTopColor: selectedStudentData.prediction.risk_level === 'HIGH' ? '#ef4444' :
                                               selectedStudentData.prediction.risk_level === 'MEDIUM' ? '#f59e0b' : '#22c55e',
                                transform: `rotate(${-90 + ((() => {
                                  // Calculate risk score: 0% = no risk (rotate to left), 100% = high risk (rotate to right)
                                  const failingCount = selectedStudentData.prediction.subject_predictions?.filter((p: any) => p.predicted_mark < 35).length || 0;
                                  const totalSubjects = selectedStudentData.prediction.subject_predictions?.length || 1;
                                  const avgScore = selectedStudentData.prediction.overall_average;
                                  // Risk = 40% from failing subjects + 60% from low average
                                  const failingRisk = (failingCount / totalSubjects) * 40;
                                  const avgRisk = avgScore < 35 ? 60 : avgScore < 50 ? 40 : avgScore < 65 ? 20 : 0;
                                  return Math.min((failingRisk + avgRisk), 100) / 100 * 180;
                                })())}deg)`,
                                transition: 'transform 1s ease-out',
                                borderBottomColor: 'transparent'
                              }}
                            ></div>
                          </div>
                          <div className="absolute bottom-0 text-center">
                            <div className="text-3xl font-bold text-gray-900">
                              {(() => {
                                // Calculate proper risk score
                                const failingCount = selectedStudentData.prediction.subject_predictions?.filter((p: any) => p.predicted_mark < 35).length || 0;
                                const totalSubjects = selectedStudentData.prediction.subject_predictions?.length || 1;
                                const avgScore = selectedStudentData.prediction.overall_average;
                                const failingRisk = (failingCount / totalSubjects) * 40;
                                const avgRisk = avgScore < 35 ? 60 : avgScore < 50 ? 40 : avgScore < 65 ? 20 : 0;
                                return Math.min(Math.round(failingRisk + avgRisk), 100);
                              })()}%
                            </div>
                            <div className="text-xs text-gray-500 mt-1">Risk Score</div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                          <span className="text-sm text-gray-600">Academic</span>
                          <span className={`text-sm font-semibold ${
                            selectedStudentData.prediction.overall_average >= 70 ? 'text-green-600' :
                            selectedStudentData.prediction.overall_average >= 50 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {selectedStudentData.prediction.overall_average >= 70 ? 'Strong' :
                             selectedStudentData.prediction.overall_average >= 50 ? 'Moderate' : 'Weak'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                          <span className="text-sm text-gray-600">Attendance</span>
                          <span className={`text-sm font-semibold ${
                            selectedStudentData.prediction.attendance_percentage >= 80 ? 'text-green-600' :
                            selectedStudentData.prediction.attendance_percentage >= 60 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {selectedStudentData.prediction.attendance_percentage.toFixed(0)}%
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                          <span className="text-sm text-gray-600">Pass Rate</span>
                          <span className={`text-sm font-semibold ${
                            (() => {
                              const passingSubjects = selectedStudentData.prediction.subject_predictions?.filter((p: any) => p.predicted_grade !== 'W' && p.predicted_mark >= 35).length || 0;
                              const totalSubjects = selectedStudentData.prediction.subject_predictions?.length || 1;
                              const passRate = (passingSubjects / totalSubjects);
                              return passRate >= 0.7 ? 'text-green-600' : passRate >= 0.5 ? 'text-yellow-600' : 'text-red-600';
                            })()
                          }`}>
                            {(() => {
                              const passingSubjects = selectedStudentData.prediction.subject_predictions?.filter((p: any) => p.predicted_grade !== 'W' && p.predicted_mark >= 35).length || 0;
                              const totalSubjects = selectedStudentData.prediction.subject_predictions?.length || 1;
                              return ((passingSubjects / totalSubjects) * 100).toFixed(0);
                            })()}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-3 border-b border-gray-200">Performance Stats</h3>
                      <div className="space-y-4">
                        <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                          <div className="text-xs text-gray-600 mb-1">Total Subjects</div>
                          <div className="text-3xl font-bold text-blue-700">
                            {selectedStudentData.prediction.subject_predictions?.length || 0}
                          </div>
                        </div>
                        <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg border border-green-200">
                          <div className="text-xs text-gray-600 mb-1">Expected Pass</div>
                          <div className="text-3xl font-bold text-green-700">
                            {selectedStudentData.prediction.subject_predictions?.filter((p: any) => p.predicted_grade !== 'W' && p.predicted_mark >= 35).length || 0}
                          </div>
                        </div>
                        <div className="p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg border border-purple-200">
                          <div className="text-xs text-gray-600 mb-1">A/B Grades</div>
                          <div className="text-3xl font-bold text-purple-700">
                            {selectedStudentData.prediction.subject_predictions?.filter((p: any) => 
                              ['A', 'B'].includes(p.predicted_grade)
                            ).length || 0}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* AI Insights */}
                    <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-3 border-b border-gray-200">AI Insights & Actions</h3>
                      <div className="space-y-3 text-sm">
                        {selectedStudentData.prediction.subject_predictions && 
                         selectedStudentData.prediction.subject_predictions.length > 0 && (
                          <>
                            <div className="p-3 bg-blue-50 rounded border-l-4 border-blue-500">
                              <div className="font-semibold text-blue-900 mb-1">📊 Overall Prediction</div>
                              <div className="text-gray-700">
                                Expected to pass <strong>
                                  {selectedStudentData.prediction.subject_predictions.filter((p: any) => p.predicted_grade !== 'W' && p.predicted_mark >= 35).length}/{selectedStudentData.prediction.subject_predictions.length}
                                </strong> subjects ({((
                                  selectedStudentData.prediction.subject_predictions.filter((p: any) => p.predicted_grade !== 'W' && p.predicted_mark >= 35).length / 
                                  selectedStudentData.prediction.subject_predictions.length
                                ) * 100).toFixed(0)}% success rate)
                              </div>
                            </div>

                            {selectedStudentData.prediction.risk_level === 'HIGH' && (
                              <div className="p-3 bg-red-50 rounded border-l-4 border-red-500">
                                <div className="font-semibold text-red-900 mb-1">⚠️ High Risk Alert</div>
                                <div className="text-gray-700">
                                  Immediate intervention required. Schedule parent meeting and create personalized study plan.
                                </div>
                              </div>
                            )}

                            {selectedStudentData.prediction.attendance_percentage < 80 && (
                              <div className="p-3 bg-orange-50 rounded border-l-4 border-orange-500">
                                <div className="font-semibold text-orange-900 mb-1">📅 Attendance Issue</div>
                                <div className="text-gray-700">
                                  {selectedStudentData.prediction.attendance_percentage.toFixed(0)}% attendance is below target. This may impact final results significantly.
                                </div>
                              </div>
                            )}

                            {(() => {
                              const improvingSubjects = selectedStudentData.prediction.subject_predictions.filter(
                                (p: any) => p.trend === 'IMPROVING'
                              );
                              return improvingSubjects.length > 0 && (
                                <div className="p-3 bg-green-50 rounded border-l-4 border-green-500">
                                  <div className="font-semibold text-green-900 mb-1">✅ Positive Trends</div>
                                  <div className="text-gray-700">
                                    Improving in <strong>{improvingSubjects.length}</strong> subjects. Maintain current study methods.
                                  </div>
                                </div>
                              );
                            })()}

                            {(() => {
                              const weakSubjects = selectedStudentData.prediction.subject_predictions.filter(
                                (p: any) => p.predicted_mark < 50
                              );
                              return weakSubjects.length > 0 && (
                                <div className="p-3 bg-yellow-50 rounded border-l-4 border-yellow-500">
                                  <div className="font-semibold text-yellow-900 mb-1">🎯 Focus Areas</div>
                                  <div className="text-gray-700">
                                    Priority subjects: <strong>{weakSubjects.map((s: any) => s.subject).join(', ')}</strong>
                                  </div>
                                </div>
                              );
                            })()}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
