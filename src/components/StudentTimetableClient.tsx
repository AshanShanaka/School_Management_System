"use client";

import React, { useState } from "react";
import { SCHOOL_DAYS, getTimeDisplay, getSubjectColor } from "@/lib/schoolTimetableConfig";

interface Class {
  id: number;
  name: string;
  gradeLevel: number;
  classTeacher: {
    name: string;
    surname: string;
  } | null;
}

interface Student {
  id: string;
  name: string;
  surname: string;
  class: Class;
}

interface Subject {
  name: string;
  code: string | null;
}

interface Teacher {
  name: string;
  surname: string;
}

interface TimetableSlot {
  id: string;
  day: string;
  period: number;
  startTime: string;
  endTime: string;
  subject: Subject | null;
  teacher: Teacher | null;
  roomNumber: string | null;
}

interface Timetable {
  id: string;
  academicYear: string;
  term: string | null;
  slots: TimetableSlot[];
}

interface StudentTimetableClientProps {
  student: Student;
  timetable: Timetable | null;
}

const StudentTimetableClient: React.FC<StudentTimetableClientProps> = ({
  student,
  timetable,
}) => {
  const [showFullTimetable, setShowFullTimetable] = useState(false);

  if (!timetable) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="text-gray-400 mb-4">
          <svg className="w-20 h-20 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-xl font-medium text-gray-500 mb-2">No Timetable Available</h3>
        <p className="text-gray-400 text-center max-w-md">
          Your class doesn't have a timetable yet.
        </p>
      </div>
    );
  }

  // Organize slots into grid
  const grid: Record<string, Record<number, TimetableSlot | null>> = {};
  
  SCHOOL_DAYS.forEach((day) => {
    grid[day] = {};
    for (let period = 1; period <= 8; period++) {
      grid[day][period] = null;
    }
  });

  timetable.slots.forEach((slot) => {
    grid[slot.day][slot.period] = slot;
  });

  // Get stats for each day
  const getDayStats = (day: string) => {
    const daySlots = timetable.slots.filter((s) => s.day === day);
    return {
      total: daySlots.length,
      subjects: new Set(daySlots.filter(s => s.subject).map(s => s.subject!.name)).size,
    };
  };

  // Show full weekly timetable grid
  if (showFullTimetable) {
    return (
      <div className="space-y-6">
        {/* Header Card */}
        <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold">My Class Timetable</h1>
              <p className="text-green-100">
                {student.name} {student.surname}
              </p>
            </div>
          </div>

          <div className="bg-white bg-opacity-10 rounded-lg p-4 border border-white border-opacity-20">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-green-100 text-xs mb-1">Class</div>
                <div className="font-semibold text-lg">{student.class.name}</div>
              </div>
              <div>
                <div className="text-green-100 text-xs mb-1">Grade</div>
                <div className="font-semibold text-lg">{student.class.gradeLevel}</div>
              </div>
              {student.class.classTeacher && (
                <div>
                  <div className="text-green-100 text-xs mb-1">Class Teacher</div>
                  <div className="font-semibold text-lg">
                    {student.class.classTeacher.name} {student.class.classTeacher.surname}
                  </div>
                </div>
              )}
              <div>
                <div className="text-green-100 text-xs mb-1">Academic Year</div>
                <div className="font-semibold text-lg">{timetable.academicYear}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Back Button */}
        <button
          onClick={() => setShowFullTimetable(false)}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Week Overview
        </button>

        {/* Timetable Grid */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b">
            <h3 className="text-lg font-semibold text-gray-900">Weekly Schedule</h3>
            <p className="text-sm text-gray-600">
              {student.class.name} - Grade {student.class.gradeLevel}
            </p>
          </div>

          <div className="overflow-auto max-h-[calc(100vh-300px)]">
            <table className="w-full border-collapse">
              <thead className="sticky top-0 z-10">
                <tr className="bg-gradient-to-r from-blue-50 to-indigo-50">
                  <th className="px-3 py-2 text-left font-semibold text-gray-700 border-r border-gray-200 w-[90px] sticky left-0 bg-blue-50">
                    <div className="text-xs">Period</div>
                    <div className="text-xs text-gray-500 mt-1">Time</div>
                  </th>
                  {SCHOOL_DAYS.map((day) => (
                    <th key={day} className="px-2 py-2 text-center font-semibold text-gray-700 border-r border-gray-200 last:border-r-0 text-sm w-[120px]">
                      {day.substring(0, 3)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((period) => (
                  <tr key={period} className="border-b border-gray-200 hover:bg-blue-50 transition-colors">
                    <td className="px-2 py-1 border-r border-gray-200 bg-gray-50 sticky left-0 z-10 w-[90px]">
                      <div className="font-bold text-sm text-gray-900">P{period}</div>
                      <div className="text-[10px] text-gray-600 mt-0.5">{getTimeDisplay(period)}</div>
                    </td>
                    {SCHOOL_DAYS.map((day) => {
                      const slot = grid[day][period];
                      return (
                        <td key={`${day}-${period}`} className="px-1 py-1 border-r border-gray-200 last:border-r-0 w-[120px]">
                          {slot ? (
                            <div
                              className={`${getSubjectColor(
                                slot.subject?.name || ""
                              )} p-1.5 rounded-md border h-[70px] flex flex-col items-center justify-center gap-0.5 text-xs`}
                            >
                              <div className="font-bold text-[11px] leading-tight text-center line-clamp-2 w-full">
                                {slot.subject?.name || "No Subject"}
                              </div>
                              {slot.subject?.code && (
                                <div className="text-[9px] font-semibold opacity-75">
                                  {slot.subject.code}
                                </div>
                              )}
                              {slot.teacher && (
                                <div className="text-[9px] flex items-center justify-center gap-0.5 line-clamp-1 w-full">
                                  <svg className="w-2 h-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                  </svg>
                                  <span className="truncate">{slot.teacher.name} {slot.teacher.surname.charAt(0)}.</span>
                                </div>
                              )}
                              {slot.roomNumber && (
                                <div className="text-[9px] flex items-center justify-center gap-0.5">
                                  <svg className="w-2 h-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                                  </svg>
                                  {slot.roomNumber}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="h-[70px] rounded-md border-2 border-dashed border-gray-200 flex items-center justify-center bg-gray-50">
                              <span className="text-[10px] text-gray-400 font-medium">Free</span>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // Week Overview - Show ONE bar for entire week with view button
  const totalPeriods = timetable.slots.length;
  const totalSubjects = new Set(timetable.slots.filter(s => s.subject).map(s => s.subject!.name)).size;

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-6 rounded-xl shadow-lg">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold">My Class Timetable</h1>
            <p className="text-green-100">
              {student.name} {student.surname}
            </p>
          </div>
        </div>

        <div className="bg-white bg-opacity-10 rounded-lg p-4 border border-white border-opacity-20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-green-100 text-xs mb-1">Class</div>
              <div className="font-semibold text-lg">{student.class.name}</div>
            </div>
            <div>
              <div className="text-green-100 text-xs mb-1">Grade</div>
              <div className="font-semibold text-lg">{student.class.gradeLevel}</div>
            </div>
            {student.class.classTeacher && (
              <div>
                <div className="text-green-100 text-xs mb-1">Class Teacher</div>
                <div className="font-semibold text-lg">
                  {student.class.classTeacher.name} {student.class.classTeacher.surname}
                </div>
              </div>
            )}
            <div>
              <div className="text-green-100 text-xs mb-1">Academic Year</div>
              <div className="font-semibold text-lg">{timetable.academicYear}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Single Week Overview Bar */}
      <div className="bg-white border-2 border-gray-200 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
        <div className="p-8">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <h3 className="text-2xl font-bold text-gray-900">Weekly Timetable</h3>
              </div>
              <p className="text-gray-600 mb-6">View your complete class schedule for the entire week</p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <div className="text-sm text-blue-600 font-medium mb-1">School Days</div>
                  <div className="text-3xl font-bold text-blue-900">5</div>
                  <div className="text-xs text-blue-600 mt-1">Mon - Fri</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <div className="text-sm text-green-600 font-medium mb-1">Total Periods</div>
                  <div className="text-3xl font-bold text-green-900">{totalPeriods}</div>
                  <div className="text-xs text-green-600 mt-1">Per week</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <div className="text-sm text-purple-600 font-medium mb-1">Subjects</div>
                  <div className="text-3xl font-bold text-purple-900">{totalSubjects}</div>
                  <div className="text-xs text-purple-600 mt-1">Different subjects</div>
                </div>
                <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                  <div className="text-sm text-orange-600 font-medium mb-1">Periods/Day</div>
                  <div className="text-3xl font-bold text-orange-900">8</div>
                  <div className="text-xs text-orange-600 mt-1">Daily schedule</div>
                </div>
              </div>
            </div>
            
            <div className="ml-8">
              <button
                onClick={() => setShowFullTimetable(true)}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-lg rounded-xl transition-all transform hover:scale-105 flex items-center gap-3 shadow-lg"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                View Timetable
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentTimetableClient;
