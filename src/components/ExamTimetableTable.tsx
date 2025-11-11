"use client";

import React from "react";
import Image from "next/image";

interface ExamSubject {
  id: number;
  examDate: string;
  startTime: string;
  endTime: string;
  subject: {
    id: number;
    name: string;
  };
  teacher?: {
    id: string;
    name: string;
    surname: string;
  };
}

interface Exam {
  id: number;
  title: string;
  year: number;
  term: number;
  status: string;
  grade: {
    id: number;
    level: number;
  };
  examSubjects: ExamSubject[];
}

interface ExamTimetableTableProps {
  exams: Exam[];
  userRole: string;
  showGrade?: boolean;
}

const ExamTimetableTable: React.FC<ExamTimetableTableProps> = ({ 
  exams, 
  userRole,
  showGrade = true 
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatTime = (time: string) => {
    if (!time) return '';
    // Convert 24h to 12h format
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PUBLISHED: { bg: "bg-green-100", text: "text-green-800", label: "Published" },
      DRAFT: { bg: "bg-gray-100", text: "text-gray-800", label: "Draft" },
      ONGOING: { bg: "bg-yellow-100", text: "text-yellow-800", label: "Ongoing" },
      COMPLETED: { bg: "bg-blue-100", text: "text-blue-800", label: "Completed" },
      CANCELLED: { bg: "bg-red-100", text: "text-red-800", label: "Cancelled" },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.DRAFT;
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  if (!exams || exams.length === 0) {
    return (
      <div className="bg-white p-8 rounded-lg shadow-sm text-center">
        <div className="flex flex-col items-center gap-4">
          <Image src="/exam.png" alt="No exams" width={64} height={64} className="opacity-50" />
          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No Exam Timetables Available</h3>
            <p className="text-gray-500">There are no published exam timetables at the moment.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {exams.map((exam) => (
        <div key={exam.id} className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
          {/* Exam Header */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-blue-600 text-white p-3 rounded-lg">
                  <Image src="/exam.png" alt="Exam" width={24} height={24} className="filter invert" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">{exam.title}</h2>
                  <div className="flex items-center gap-4 mt-1">
                    {showGrade && (
                      <span className="text-sm text-gray-600">
                        <span className="font-medium">Grade:</span> {exam.grade.level}
                      </span>
                    )}
                    <span className="text-sm text-gray-600">
                      <span className="font-medium">Year:</span> {exam.year}
                    </span>
                    <span className="text-sm text-gray-600">
                      <span className="font-medium">Term:</span> {exam.term}
                    </span>
                    {getStatusBadge(exam.status)}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">
                  {exam.examSubjects.length}
                </div>
                <div className="text-xs text-gray-500 uppercase">Subjects</div>
              </div>
            </div>
          </div>

          {/* Exam Subjects Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Subject
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Day
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Duration
                  </th>
                  {userRole === "teacher" && (
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Invigilator
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {exam.examSubjects
                  .sort((a, b) => new Date(a.examDate).getTime() - new Date(b.examDate).getTime())
                  .map((examSubject, index) => {
                    const examDate = new Date(examSubject.examDate);
                    const dayName = examDate.toLocaleDateString('en-US', { weekday: 'long' });
                    
                    // Calculate duration
                    const [startHour, startMin] = examSubject.startTime.split(':').map(Number);
                    const [endHour, endMin] = examSubject.endTime.split(':').map(Number);
                    const durationMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);
                    const hours = Math.floor(durationMinutes / 60);
                    const minutes = durationMinutes % 60;
                    const duration = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

                    return (
                      <tr 
                        key={examSubject.id} 
                        className="hover:bg-blue-50 transition-colors"
                      >
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full font-semibold text-sm">
                            {index + 1}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span className="font-medium text-gray-800">
                              {examSubject.subject.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm text-gray-800">
                            {formatDate(examSubject.examDate)}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            {dayName}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm text-gray-800">
                            <div className="flex items-center gap-1">
                              <span className="font-semibold">{formatTime(examSubject.startTime)}</span>
                              <span className="text-gray-400">-</span>
                              <span className="font-semibold">{formatTime(examSubject.endTime)}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {duration}
                          </span>
                        </td>
                        {userRole === "teacher" && (
                          <td className="px-4 py-4">
                            {examSubject.teacher ? (
                              <div className="text-sm text-gray-700">
                                {examSubject.teacher.name} {examSubject.teacher.surname}
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400 italic">Not assigned</span>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          {/* Exam Footer - Additional Info */}
          <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
            <div className="flex items-center justify-between text-xs text-gray-600">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>
                    Exam Period: {exam.examSubjects.length > 0 
                      ? `${formatDate(exam.examSubjects[0].examDate)} - ${formatDate(exam.examSubjects[exam.examSubjects.length - 1].examDate)}`
                      : 'Not scheduled'
                    }
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Image src="/calendar.png" alt="Calendar" width={14} height={14} />
                <span>Total: {exam.examSubjects.length} subjects</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ExamTimetableTable;
