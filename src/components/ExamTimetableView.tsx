"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

interface ExamTimetableViewProps {
  examId?: string;
  classId?: number;
  userRole?: string;
  userId?: string;
}

interface ExamData {
  id: string;
  title: string;
  year: number;
  term: string;
  examDate: string;
  status: string;
  grade: {
    id: number;
    level: number;
  };
  examSubjects: Array<{
    id: string;
    examDate: string;
    startTime: string;
    endTime: string;
    subject: {
      id: number;
      name: string;
      code: string;
    };
  }>;
  examSupervisors: Array<{
    id: string;
    class: {
      id: number;
      name: string;
    };
    teacher: {
      id: string;
      name: string;
      surname: string;
    };
  }>;
  subjectAssignments: Array<{
    subject: {
      id: number;
      name: string;
      code: string;
    };
    teacher: {
      id: string;
      name: string;
      surname: string;
    };
    class: {
      id: number;
      name: string;
    };
    canEnterMarks?: boolean;
    marksEntered?: boolean;
  }>;
  userRole?: string;
  userId?: string;
}

const ExamTimetableView: React.FC<ExamTimetableViewProps> = ({
  examId,
  classId,
  userRole,
  userId,
}) => {
  const [examData, setExamData] = useState<ExamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (examId) {
      fetchExamDetails();
    }
  }, [examId]);

  const fetchExamDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/exam-timetable/${examId}?classId=${classId || ""}`);
      if (!response.ok) {
        throw new Error("Failed to fetch exam details");
      }
      const data = await response.json();
      setExamData(data.exam);
    } catch (err) {
      console.error("Error fetching exam details:", err);
      setError("Failed to load exam timetable");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'DRAFT': 'bg-gray-100 text-gray-800',
      'PUBLISHED': 'bg-blue-100 text-blue-800',
      'ACTIVE': 'bg-green-100 text-green-800',
      'COMPLETED': 'bg-purple-100 text-purple-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string | null) => {
    if (!timeString) return "N/A";
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-lamaSky"></div>
          <span className="ml-2 text-gray-600">Loading exam timetable...</span>
        </div>
      </div>
    );
  }

  if (error || !examData) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="text-center py-8">
          <div className="text-red-500 mb-4">⚠️ {error}</div>
          <button
            onClick={fetchExamDetails}
            className="px-4 py-2 bg-lamaSky text-white rounded hover:bg-lamaSkyLight"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const renderScheduleView = () => {
    const sortedSubjects = examData.examSubjects.sort((a, b) => {
      const dateA = new Date(a.examDate);
      const dateB = new Date(b.examDate);
      if (dateA.getTime() !== dateB.getTime()) {
        return dateA.getTime() - dateB.getTime();
      }
      return a.startTime.localeCompare(b.startTime);
    });

    // Group subjects by date
    const subjectsByDate = sortedSubjects.reduce((acc, subject) => {
      const date = subject.examDate;
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(subject);
      return acc;
    }, {} as Record<string, typeof sortedSubjects>);

    return (
      <div className="space-y-6">
        {Object.entries(subjectsByDate).map(([date, subjects]) => (
          <div key={date} className="bg-white border rounded-lg overflow-hidden shadow-sm">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4">
              <h3 className="text-lg font-semibold">📅 {formatDate(date)}</h3>
              <p className="text-sm opacity-90">{subjects.length} subject{subjects.length !== 1 ? 's' : ''}</p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subject
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Max Marks
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {subjects.map((subject, index) => {
                    const duration = (() => {
                      const start = new Date(`2000-01-01 ${subject.startTime}`);
                      const end = new Date(`2000-01-01 ${subject.endTime}`);
                      const diff = (end.getTime() - start.getTime()) / (1000 * 60);
                      const hours = Math.floor(diff / 60);
                      const minutes = diff % 60;
                      return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
                    })();
                    
                    return (
                      <tr key={subject.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 text-sm font-bold">{index + 1}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                              <span className="text-purple-600 text-sm font-bold">
                                {subject.subject.name.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {subject.subject.name}
                              </div>
                              {subject.subject.code && (
                                <div className="text-sm text-gray-500">
                                  Code: {subject.subject.code}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm">
                            <div className="font-medium text-gray-900">
                              {formatTime(subject.startTime)} - {formatTime(subject.endTime)}
                            </div>
                            <div className="text-gray-500">
                              {formatTime(subject.startTime)} to {formatTime(subject.endTime)}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                            ⏱️ {duration}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            <span className="inline-flex items-center px-2 py-1 rounded-md bg-yellow-100 text-yellow-800">
                              🎯 100 marks
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            ✅ Scheduled
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderSupervisorsView = () => {
    const supervisorsByClass = examData.examSupervisors.reduce((acc, supervisor) => {
      const className = supervisor.class.name;
      if (!acc[className]) {
        acc[className] = [];
      }
      acc[className].push(supervisor);
      return acc;
    }, {} as Record<string, typeof examData.examSupervisors>);

    return (
      <div className="space-y-6">
        {Object.entries(supervisorsByClass).map(([className, supervisors]) => (
          <div key={className} className="bg-white border rounded-lg overflow-hidden shadow-sm">
            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4">
              <h3 className="text-lg font-semibold">🏫 Class {className}</h3>
              <p className="text-sm opacity-90">{supervisors.length} supervisor{supervisors.length !== 1 ? 's' : ''} assigned</p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Teacher
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {supervisors.map((supervisor, index) => (
                    <tr key={supervisor.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                            <span className="text-green-600 font-bold">👨‍🏫</span>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {supervisor.teacher.name} {supervisor.teacher.surname}
                            </div>
                            <div className="text-sm text-gray-500">
                              Teacher ID: {supervisor.teacher.id}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          🛡️ Exam Supervisor
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          <div className="font-medium">Available during exam</div>
                          <div className="text-gray-500">Contact via school office</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          ✅ Assigned
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderAssignmentsView = () => {
    const assignmentsBySubject = examData.subjectAssignments.reduce((acc, assignment) => {
      const subjectName = assignment.subject.name;
      if (!acc[subjectName]) {
        acc[subjectName] = [];
      }
      acc[subjectName].push(assignment);
      return acc;
    }, {} as Record<string, typeof examData.subjectAssignments>);

    // Check if current user can enter marks for any subject
    const canUserEnterMarks = (assignment: any) => {
      return userRole === "teacher" && userId === assignment.teacher.id && 
             (examData.status === "MARKS_ENTRY" || examData.status === "CLASS_REVIEW");
    };

    return (
      <div className="space-y-6">
        {Object.entries(assignmentsBySubject).map(([subjectName, assignments]) => (
          <div key={subjectName} className="bg-white border rounded-lg overflow-hidden shadow-sm">
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4">
              <h3 className="text-lg font-semibold">📚 {subjectName}</h3>
              <p className="text-sm opacity-90">
                {assignments[0]?.subject.code && `Code: ${assignments[0].subject.code}`} • {assignments.length} teacher{assignments.length !== 1 ? 's' : ''} assigned
              </p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Teacher
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Class
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Marks Status
                    </th>
                    {(userRole === 'teacher' || userRole === 'admin') && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {assignments.map((assignment, index) => (
                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                            <span className="text-purple-600 font-bold">�‍🏫</span>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {assignment.teacher.name} {assignment.teacher.surname}
                            </div>
                            <div className="text-sm text-gray-500">
                              Subject Teacher
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">Class {assignment.class.name}</div>
                          <div className="text-gray-500">Grade Level</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {assignment.marksEntered ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            ✅ Marks Entered
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            ⏳ Marks Pending
                          </span>
                        )}
                      </td>
                      {(userRole === 'teacher' || userRole === 'admin') && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {canUserEnterMarks(assignment) ? (
                            <Link 
                              href={`/marks-entry/${examData.id}?subjectId=${assignment.subject.id}&classId=${assignment.class.id}`}
                              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                            >
                              {assignment.marksEntered ? "✏️ Edit Marks" : "📝 Enter Marks"}
                            </Link>
                          ) : (
                            <span className="text-gray-400">
                              {userRole === "admin" ? "View Only" : "Not Authorized"}
                            </span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
        
        {userRole === "teacher" && examData.subjectAssignments.some(a => userId === a.teacher.id) && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm">ℹ️</span>
              </div>
              <h4 className="font-semibold text-blue-900">Teacher Information</h4>
            </div>
            <div className="text-sm text-blue-800 space-y-1">
              {examData.status === "MARKS_ENTRY" && (
                <p>• You can enter marks for your assigned subjects</p>
              )}
              {examData.status === "CLASS_REVIEW" && (
                <p>• You can review and edit marks for your subjects</p>
              )}
              {examData.status === "DRAFT" && (
                <p>• Marks entry will be available once the exam is published</p>
              )}
              {examData.status === "PUBLISHED" && (
                <p>• Marks entry period has not started yet</p>
              )}
              {examData.status === "ARCHIVED" && (
                <p>• This exam has been archived. Marks entry is closed</p>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Compact Header */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-800">{examData.title}</h1>
            <div className="flex items-center gap-3 mt-1 text-sm text-gray-600">
              <span>🎓 Grade {examData.grade.level}</span>
              <span>📅 {examData.year} - Term {examData.term}</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(examData.status)}`}>
                {examData.status}
              </span>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-xl font-bold text-blue-600">{examData.examSubjects.length}</div>
            <div className="text-xs text-gray-500">Subjects</div>
          </div>
        </div>

        {/* Quick Statistics */}
        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 rounded-lg border border-blue-200 text-center">
            <div className="text-lg font-bold text-blue-700">{examData.examSubjects.length}</div>
            <div className="text-xs text-gray-600">Subjects</div>
          </div>
          
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-3 rounded-lg border border-emerald-200 text-center">
            <div className="text-lg font-bold text-emerald-700">
              {(() => {
                const dates = new Set(examData.examSubjects.map(s => new Date(s.examDate).toDateString()));
                return dates.size;
              })()}
            </div>
            <div className="text-xs text-gray-600">Exam Days</div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-3 rounded-lg border border-purple-200 text-center">
            <div className="text-lg font-bold text-purple-700">
              {(() => {
                const totalMinutes = examData.examSubjects.reduce((total, subject) => {
                  const start = new Date(`2000-01-01 ${subject.startTime}`);
                  const end = new Date(`2000-01-01 ${subject.endTime}`);
                  return total + ((end.getTime() - start.getTime()) / (1000 * 60));
                }, 0);
                return Math.round(totalMinutes / 60);
              })()}h
            </div>
            <div className="text-xs text-gray-600">Total Hours</div>
          </div>
        </div>
      </div>

      {/* Professional Exam Schedule */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          � Exam Schedule
        </h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gradient-to-r from-blue-50 to-blue-100">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">#</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Subject</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Date & Time</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Duration</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Marks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {(() => {
                const sortedSubjects = examData.examSubjects.sort((a, b) => {
                  const dateA = new Date(a.examDate);
                  const dateB = new Date(b.examDate);
                  if (dateA.getTime() !== dateB.getTime()) {
                    return dateA.getTime() - dateB.getTime();
                  }
                  // Handle null startTime values
                  if (!a.startTime || !b.startTime) {
                    return 0;
                  }
                  return a.startTime.localeCompare(b.startTime);
                });

                return sortedSubjects.map((subject, index) => {
                  const duration = (() => {
                    if (!subject.startTime || !subject.endTime) {
                      return "N/A";
                    }
                    const start = new Date(`2000-01-01 ${subject.startTime}`);
                    const end = new Date(`2000-01-01 ${subject.endTime}`);
                    const diff = (end.getTime() - start.getTime()) / (1000 * 60);
                    const hours = Math.floor(diff / 60);
                    const minutes = diff % 60;
                    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
                  })();

                  return (
                    <tr key={subject.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 text-xs font-bold">{index + 1}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                            <span className="text-purple-600 text-xs font-bold">
                              {subject.subject.name.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{subject.subject.name}</div>
                            {subject.subject.code && (
                              <div className="text-xs text-gray-500">Code: {subject.subject.code}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <div className="font-medium text-gray-900">
                            {formatDate(subject.examDate)}
                          </div>
                          <div className="text-xs text-gray-600">
                            {formatTime(subject.startTime)} - {formatTime(subject.endTime)}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          ⏱️ {duration}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">100 marks</div>
                      </td>
                    </tr>
                  );
                });
              })()}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ExamTimetableView;
