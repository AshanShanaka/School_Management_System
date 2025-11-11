/**
 * TimetableViewer Component
 * 
 * Read-only timetable display for Teachers, Students, and Parents
 * Fetches and displays class timetable with proper formatting
 * 
 * Features:
 * - Responsive grid layout
 * - Color-coded subjects
 * - Teacher information
 * - Break period indicators
 * - Loading and error states
 */

'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { getTimeDisplay, getSubjectColor, SCHOOL_DAYS } from '@/lib/schoolTimetableConfig';

interface TimetableViewerProps {
  classId: number;
  className?: string;
  userRole?: 'teacher' | 'student' | 'parent';
}

interface TimetableSlot {
  id: string;
  day: string;
  period: number;
  startTime: string;
  endTime: string;
  slotType: string;
  subject: {
    id: number;
    name: string;
    code: string | null;
    color: string | null;
  } | null;
  teacher: {
    id: string;
    name: string;
    surname: string;
  } | null;
}

interface Timetable {
  id: string;
  classId: number;
  academicYear: string;
  term: string | null;
  isActive: boolean;
  class: {
    name: string;
    grade: {
      level: number;
    };
  };
  slots: TimetableSlot[];
}

const TimetableViewer: React.FC<TimetableViewerProps> = ({
  classId,
  className = '',
  userRole = 'student',
}) => {
  const [timetable, setTimetable] = useState<Timetable | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTimetable();
  }, [classId]);

  /**
   * Fetch timetable data from API
   * Handles authentication and authorization automatically
   */
  const fetchTimetable = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/timetable?classId=${classId}`);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Please log in to view timetable');
        } else if (response.status === 403) {
          throw new Error('You do not have permission to view this timetable');
        } else if (response.status === 404) {
          throw new Error('Timetable not found for this class');
        } else {
          throw new Error('Failed to load timetable');
        }
      }

      const data = await response.json();
      
      // Find timetable for this specific class
      let classTimetable: Timetable | null = null;
      if (Array.isArray(data)) {
        classTimetable = data.find((t: Timetable) => t.classId === classId) || null;
      } else if (data.timetable) {
        classTimetable = data.timetable;
      }

      if (!classTimetable) {
        throw new Error('No timetable found for this class yet');
      }

      setTimetable(classTimetable);
    } catch (err) {
      console.error('Error fetching timetable:', err);
      setError(err instanceof Error ? err.message : 'Failed to load timetable');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get slot for a specific day and period
   */
  const getSlotForDayPeriod = (day: string, period: number): TimetableSlot | undefined => {
    return timetable?.slots.find((slot) => slot.day === day && slot.period === period);
  };

  /**
   * Render loading state
   */
  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-8 ${className}`}>
        <div className="flex items-center justify-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Loading timetable...</p>
        </div>
      </div>
    );
  }

  /**
   * Render error state
   */
  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-8 ${className}`}>
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to Load Timetable</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchTimetable}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  /**
   * Render empty state
   */
  if (!timetable) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-8 ${className}`}>
        <div className="text-center">
          <Image
            src="/calendar.png"
            alt="No timetable"
            width={64}
            height={64}
            className="mx-auto mb-4 opacity-50"
          />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Timetable Available</h3>
          <p className="text-gray-600">Your class timetable hasn't been created yet.</p>
        </div>
      </div>
    );
  }

  /**
   * Render timetable
   */
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{timetable.class.name}</h2>
            <p className="text-sm text-gray-600 mt-1">
              Grade {timetable.class.grade.level} • {timetable.academicYear}
              {timetable.term && ` • ${timetable.term}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                timetable.isActive
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {timetable.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      </div>

      {/* Timetable Grid */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-full">
            <thead>
              <tr className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                <th className="px-4 py-3 text-left font-semibold text-sm">Period</th>
                {SCHOOL_DAYS.map((day) => (
                  <th key={day} className="px-4 py-3 text-center font-semibold text-sm">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((period) => (
                <React.Fragment key={period}>
                  <tr className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 bg-gray-50 font-medium text-gray-900">
                      <div className="text-sm">Period {period}</div>
                      <div className="text-xs text-gray-500">{getTimeDisplay(period)}</div>
                    </td>
                    {SCHOOL_DAYS.map((day) => {
                      const slot = getSlotForDayPeriod(day, period);

                      return (
                        <td key={`${day}-${period}`} className="px-2 py-2">
                          {slot?.slotType === 'INTERVAL' || slot?.slotType === 'ASSEMBLY' ? (
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
                              <div className="text-amber-700 font-semibold text-xs">
                                {slot.slotType}
                              </div>
                            </div>
                          ) : slot?.subject ? (
                            <div
                              className={`${getSubjectColor(
                                slot.subject.name
                              )} rounded-lg p-3 hover:shadow-md transition-shadow`}
                            >
                              <div className="font-semibold text-sm mb-1">{slot.subject.name}</div>
                              {slot.teacher && (
                                <div className="text-xs opacity-90">
                                  {slot.teacher.name} {slot.teacher.surname}
                                </div>
                              )}
                              {slot.subject.code && (
                                <div className="text-xs opacity-75 mt-1">{slot.subject.code}</div>
                              )}
                            </div>
                          ) : (
                            <div className="text-center text-gray-300 py-3">
                              <span className="text-lg">—</span>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Interval Break Row */}
                  {period === 4 && (
                    <tr className="bg-gradient-to-r from-amber-50 to-orange-50">
                      <td colSpan={6} className="px-4 py-3 text-center border-y-2 border-amber-200">
                        <div className="flex items-center justify-center gap-2">
                          <svg
                            className="w-5 h-5 text-amber-600"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                          </svg>
                          <span className="font-semibold text-amber-800">Interval Break</span>
                          <span className="text-sm text-amber-600">10:30 - 10:45</span>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stats Footer */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-600">{timetable.slots.length}</div>
            <div className="text-xs text-gray-600">Total Periods</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">
              {new Set(timetable.slots.map((s) => s.subject?.id).filter(Boolean)).size}
            </div>
            <div className="text-xs text-gray-600">Subjects</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-600">
              {new Set(timetable.slots.map((s) => s.teacher?.id).filter(Boolean)).size}
            </div>
            <div className="text-xs text-gray-600">Teachers</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimetableViewer;
