"use client";

import React, { useState } from "react";
import { SCHOOL_DAYS, getTimeDisplay, getSubjectColor } from "@/lib/schoolTimetableConfig";
import Image from "next/image";

interface Class {
  id: number;
  name: string;
  gradeLevel: number;
}

interface Student {
  id: string;
  name: string;
  surname: string;
  img: string | null;
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
  classId: number;
  slots: TimetableSlot[];
}

interface ParentTimetableClientProps {
  children: Student[];
  timetables: Timetable[];
}

const ParentTimetableClient: React.FC<ParentTimetableClientProps> = ({
  children,
  timetables,
}) => {
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [showWeekOverview, setShowWeekOverview] = useState(false);
  const [showFullTimetable, setShowFullTimetable] = useState(false);

  const selectedChild = children.find((c) => c.id === selectedChildId);
  const selectedTimetable = selectedChild
    ? timetables.find((t) => t.classId === selectedChild.class.id)
    : null;

  // Organize slots into grid
  const getGrid = (timetable: Timetable | null) => {
    const grid: Record<string, Record<number, TimetableSlot | null>> = {};
    
    SCHOOL_DAYS.forEach((day) => {
      grid[day] = {};
      for (let period = 1; period <= 8; period++) {
        grid[day][period] = null;
      }
    });

    if (timetable) {
      timetable.slots.forEach((slot) => {
        grid[slot.day][slot.period] = slot;
      });
    }

    return grid;
  };

  // Get stats for a child
  const getChildStats = (child: Student) => {
    const timetable = timetables.find((t) => t.classId === child.class.id);
    if (!timetable) return { periods: 0, subjects: 0 };

    return {
      periods: timetable.slots.length,
      subjects: new Set(timetable.slots.filter(s => s.subject).map(s => s.subject!.name)).size,
    };
  };

  // Get stats for a day
  const getDayStats = (day: string, timetable: Timetable) => {
    const daySlots = timetable.slots.filter((s) => s.day === day);
    return {
      total: daySlots.length,
      subjects: new Set(daySlots.filter(s => s.subject).map(s => s.subject!.name)).size,
    };
  };

  // Show full weekly timetable grid
  if (showFullTimetable && selectedChild && selectedTimetable) {
    const grid = getGrid(selectedTimetable);

    return (
      <div className="space-y-6">
        {/* Header Card */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center gap-4 mb-4">
            <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-white">
              <Image
                src={selectedChild.img || "/noAvatar.png"}
                alt={selectedChild.name}
                fill
                className="object-cover"
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{selectedChild.name}&apos;s Timetable</h1>
              <p className="text-purple-100">
                {selectedChild.class.name} - Grade {selectedChild.class.gradeLevel}
              </p>
            </div>
          </div>

          <div className="bg-white bg-opacity-10 rounded-lg p-4 border border-white border-opacity-20">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-purple-100 text-xs mb-1">Class</div>
                <div className="font-semibold text-lg">{selectedChild.class.name}</div>
              </div>
              <div>
                <div className="text-purple-100 text-xs mb-1">Grade</div>
                <div className="font-semibold text-lg">{selectedChild.class.gradeLevel}</div>
              </div>
              <div>
                <div className="text-purple-100 text-xs mb-1">Academic Year</div>
                <div className="font-semibold text-lg">{selectedTimetable.academicYear}</div>
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
              {selectedChild.class.name} - Grade {selectedChild.class.gradeLevel}
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

  // Show week overview - ONE bar for entire week
  if (showWeekOverview && selectedChild && selectedTimetable) {
    const totalPeriods = selectedTimetable.slots.length;
    const totalSubjects = new Set(selectedTimetable.slots.filter(s => s.subject).map(s => s.subject!.name)).size;

    return (
      <div className="space-y-6">
        {/* Header Card */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center gap-4 mb-4">
            <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-white">
              <Image
                src={selectedChild.img || "/noAvatar.png"}
                alt={selectedChild.name}
                fill
                className="object-cover"
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{selectedChild.name}&apos;s Timetable</h1>
              <p className="text-purple-100">
                {selectedChild.class.name} - Grade {selectedChild.class.gradeLevel}
              </p>
            </div>
          </div>

          <div className="bg-white bg-opacity-10 rounded-lg p-4 border border-white border-opacity-20">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-purple-100 text-xs mb-1">Class</div>
                <div className="font-semibold text-lg">{selectedChild.class.name}</div>
              </div>
              <div>
                <div className="text-purple-100 text-xs mb-1">Grade</div>
                <div className="font-semibold text-lg">{selectedChild.class.gradeLevel}</div>
              </div>
              <div>
                <div className="text-purple-100 text-xs mb-1">Academic Year</div>
                <div className="font-semibold text-lg">{selectedTimetable.academicYear}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Back Button */}
        <button
          onClick={() => {
            setSelectedChildId(null);
            setShowWeekOverview(false);
          }}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Children
        </button>

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
                <p className="text-gray-600 mb-6">View complete class schedule for the entire week</p>
                
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
  }

  // Children List
  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-4">
          <h2 className="text-2xl font-bold">My Children's Timetables</h2>
          <p className="text-purple-100 mt-1">Select a child to view their class schedule</p>
        </div>

        {children.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-500 mb-2">No Children Found</h3>
            <p className="text-gray-400">You don't have any children registered in the system.</p>
          </div>
        ) : (
          <div className="divide-y">
            {children.map((child) => {
              const stats = getChildStats(child);
              const timetable = timetables.find((t) => t.classId === child.class.id);

              return (
                <div key={child.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-purple-200">
                        <Image
                          src={child.img || "/noAvatar.png"}
                          alt={child.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 mb-1">
                          {child.name} {child.surname}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="font-medium">{child.class.name}</span>
                          <span>•</span>
                          <span>Grade {child.class.gradeLevel}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mt-3">
                          <div>
                            <div className="text-xs text-gray-500">Total Periods</div>
                            <div className="text-lg font-bold text-gray-900">{stats.periods}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500">Subjects</div>
                            <div className="text-lg font-bold text-gray-900">{stats.subjects}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedChildId(child.id);
                        setShowWeekOverview(true);
                      }}
                      disabled={!timetable}
                      className={`ml-6 px-6 py-3 font-semibold rounded-lg transition-colors flex items-center gap-2 ${
                        timetable
                          ? "bg-blue-600 hover:bg-blue-700 text-white"
                          : "bg-gray-200 text-gray-500 cursor-not-allowed"
                      }`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {timetable ? "View Schedule" : "No Timetable"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ParentTimetableClient;
