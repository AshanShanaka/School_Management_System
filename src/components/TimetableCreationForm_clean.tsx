'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Subject {
  id: number;
  name: string;
  code?: string | null;
  teachers: Teacher[];
}

interface Teacher {
  id: string;
  name: string;
  surname: string;
}

interface Class {
  id: number;
  name: string;
  grade: {
    level: number;
  };
}

interface TimetableCreationFormProps {
  selectedClass: Class;
  subjects: Subject[];
}

interface TimetableSlot {
  day: string;
  period: number;
  subjectId: number | null;
  teacherId: string | null;
  isBreak: boolean;
}

const TimetableCreationForm: React.FC<TimetableCreationFormProps> = ({
  selectedClass,
  subjects
}) => {
  console.log('🔍 TimetableCreationForm Debug:', {
    selectedClass: selectedClass?.name,
    subjectsCount: subjects?.length || 0,
    subjects: subjects?.map(s => s.name) || []
  });

  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [academicYear, setAcademicYear] = useState('2024-2025');
  const [timetableSlots, setTimetableSlots] = useState<TimetableSlot[]>([]);
  const [autoFillEnabled, setAutoFillEnabled] = useState(true);
  const [weekStartDate, setWeekStartDate] = useState('');
  const [weekDates, setWeekDates] = useState<{ [key: string]: string }>({});

  const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];
  const periods = [1, 2, 3, 4, 5, 6, 7, 8]; // All 8 periods with interval after 4th period

  console.log('🔍 TimetableCreationForm Debug:', {
    selectedClass: selectedClass?.name,
    subjectsCount: subjects?.length || 0,
    daysCount: days.length,
    periodsCount: periods.length,
    periods: periods
  });

  // Function to format class name properly
  const formatClassName = (gradeLevel: number, className: string) => {
    // Remove grade level from class name if it's duplicated (handles cases like "11-11-A" -> "11-A")
    const cleanName = className.replace(new RegExp(`^${gradeLevel}-`), '');
    return `${gradeLevel}-${cleanName}`;
  };

  // Initialize empty timetable
  React.useEffect(() => {
    const slots: TimetableSlot[] = [];
    days.forEach(day => {
      periods.forEach(period => {
        slots.push({
          day,
          period,
          subjectId: null,
          teacherId: null,
          isBreak: false
        });
      });
    });
    setTimetableSlots(slots);
  }, []);

  // Calculate week dates when Monday date is selected
  React.useEffect(() => {
    if (weekStartDate) {
      const startDate = new Date(weekStartDate);
      // Ensure the selected date is actually a Monday
      const dayOfWeek = startDate.getDay();
      if (dayOfWeek !== 1) {
        // If not Monday, adjust to the Monday of that week
        const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        startDate.setDate(startDate.getDate() + daysToMonday);
        setWeekStartDate(startDate.toISOString().split('T')[0]);
        return;
      }
      
      const dates: { [key: string]: string } = {};
      
      days.forEach((day, index) => {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + index);
        dates[day] = date.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: '2-digit'
        });
      });
      
      setWeekDates(dates);
    }
  }, [weekStartDate]);

  const getSlot = (day: string, period: number): TimetableSlot | undefined => {
    return timetableSlots.find(slot => slot.day === day && slot.period === period);
  };

  const updateSlot = (day: string, period: number, updates: Partial<TimetableSlot>) => {
    setTimetableSlots(prev => prev.map(slot => 
      slot.day === day && slot.period === period 
        ? { ...slot, ...updates }
        : slot
    ));
  };

  const getSubject = (subjectId: number): Subject | undefined => {
    return subjects.find(subject => subject.id === subjectId);
  };

  const getTeacherForSubject = (subjectId: number, teacherId?: string): Teacher | undefined => {
    const subject = getSubject(subjectId);
    if (!subject || !subject.teachers.length) return undefined;
    
    // If specific teacher ID provided, find that teacher
    if (teacherId) {
      return subject.teachers.find(teacher => teacher.id === teacherId);
    }
    
    // Otherwise return first available teacher for the subject
    return subject.teachers[0];
  };

  const handleTeacherChange = (day: string, period: number, teacherId: string) => {
    updateSlot(day, period, {
      teacherId: teacherId || null
    });
  };

  const handleSubjectChange = (day: string, period: number, subjectId: string) => {
    const id = subjectId ? parseInt(subjectId) : null;
    const teacher = id ? getTeacherForSubject(id) : null;
    
    updateSlot(day, period, {
      subjectId: id,
      teacherId: teacher?.id || null,
      isBreak: false
    });
  };

  const saveTimetable = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/timetable/${selectedClass.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          academicYear,
          isActive: true,
          slots: timetableSlots.map(slot => ({
            day: slot.day,
            period: slot.period,
            startTime: getPeriodTime(slot.period).start,
            endTime: getPeriodTime(slot.period).end,
            subjectId: slot.subjectId,
            teacherId: slot.teacherId,
            isBreak: slot.isBreak
          }))
        }),
      });

      if (response.ok) {
        router.push('/admin/timetable');
      } else {
        console.error('Failed to save timetable');
      }
    } catch (error) {
      console.error('Error saving timetable:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPeriodTime = (period: number) => {
    const times = {
      1: { start: '07:30', end: '08:15' },
      2: { start: '08:15', end: '09:00' },
      3: { start: '09:00', end: '09:45' },
      4: { start: '09:45', end: '10:30' },
      // 15-minute interval from 10:30 to 10:45
      5: { start: '10:45', end: '11:30' },
      6: { start: '11:30', end: '12:15' },
      7: { start: '12:15', end: '13:00' },
      8: { start: '13:00', end: '13:45' }
    };
    return times[period as keyof typeof times] || { start: '07:30', end: '08:15' };
  };

  const getUtilizationStats = () => {
    const totalSlots = timetableSlots.length;
    const filledSlots = timetableSlots.filter(slot => slot.subjectId || slot.isBreak).length;
    const breakSlots = timetableSlots.filter(slot => slot.isBreak).length;
    const freeSlots = totalSlots - filledSlots;

    return {
      total: totalSlots,
      filled: filledSlots,
      breaks: breakSlots,
      free: freeSlots,
      utilization: totalSlots > 0 ? Math.round((filledSlots / totalSlots) * 100) : 0
    };
  };

  const stats = getUtilizationStats();

  return (
    <div className="w-full min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">
              Create Timetable for {formatClassName(selectedClass.grade.level, selectedClass.name)}
            </h2>
            <p className="text-indigo-100">
              Configure your weekly schedule with subjects, teachers, and timing
            </p>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={saveTimetable}
              disabled={loading}
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg transition-all duration-200 disabled:opacity-50 flex items-center gap-2 shadow-lg"
            >
              <Image src="/create.png" alt="" width={18} height={18} />
              {loading ? 'Saving...' : 'Save Timetable'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Academic Year
            </label>
            <input
              type="text"
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:border-blue-500 focus:outline-none transition-colors"
              placeholder="2024-2025"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Week Start Date (Monday)
            </label>
            <input
              type="date"
              value={weekStartDate}
              onChange={(e) => setWeekStartDate(e.target.value)}
              className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:border-blue-500 focus:outline-none transition-colors"
            />
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100">
            <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
              <div className="bg-blue-100 p-1 rounded">
                <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
              </div>
              Schedule Stats
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Slots:</span>
                <span className="font-semibold text-gray-800">{stats.total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Filled:</span>
                <span className="font-semibold text-green-600">{stats.filled} ({stats.utilization}%)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Free:</span>
                <span className="font-semibold text-blue-600">{stats.free}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Debug Information */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <h4 className="font-semibold text-yellow-800 mb-2">Debug Information:</h4>
          <div className="text-sm text-yellow-700 space-y-1">
            <div>Selected Class: {selectedClass.name} (Grade {selectedClass.grade.level})</div>
            <div>Subjects Available: {subjects.length}</div>
            <div>Week Start Date: {weekStartDate || 'Not set'}</div>
            <div>Timetable Slots: {timetableSlots.length}</div>
            {subjects.length > 0 && (
              <div>Subject Names: {subjects.map(s => s.name).join(', ')}</div>
            )}
          </div>
        </div>

        {/* Enhanced Timetable Grid */}
        <div className="bg-gray-50 p-3 rounded-xl">
          {/* Weekly Timetable */}
          <div className="bg-white rounded-lg shadow border border-gray-200 mb-6">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <div className="bg-indigo-100 p-2 rounded-lg">
                  <svg className="w-4 h-4 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                </div>
                Weekly Timetable - All 8 Periods (Interval after Period 4)
                <span className="text-xs font-normal text-gray-500 ml-2">
                  ({subjects.length} subjects available)
                </span>
              </h3>
            </div>

            {subjects.length > 0 ? (
              <div className="p-4">
                <div className="w-full overflow-x-auto">
                  <table className="w-full border-collapse min-w-[900px] text-xs">
                    <thead>
                      <tr className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                        <th className="border border-gray-300 px-2 py-2 text-left font-bold w-24">
                          <div className="flex items-center gap-1">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                            </svg>
                            <span className="text-xs">Period</span>
                          </div>
                        </th>
                        {days.map(day => (
                          <th key={day} className="border border-gray-300 px-2 py-2 text-center font-bold text-white min-w-[130px]">
                            <div className="space-y-1">
                              <div className="text-xs font-bold">
                                {day.charAt(0) + day.slice(1).toLowerCase()}
                              </div>
                              {weekDates[day] && (
                                <div className="text-xs opacity-75 font-normal">
                                  {weekDates[day]}
                                </div>
                              )}
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {periods.map(period => (
                        <React.Fragment key={period}>
                          <tr className="hover:bg-gray-50 transition-colors border-b border-gray-200">
                            <td className="border border-gray-300 px-2 py-2 bg-gradient-to-r from-gray-50 to-gray-100 font-semibold">
                              <div className="text-center">
                                <div className="text-gray-800 font-bold text-xs">P{period}</div>
                                <div className="text-xs text-gray-500 leading-tight">
                                  {getPeriodTime(period).start}-{getPeriodTime(period).end}
                                </div>
                                {period === 4 && (
                                  <div className="text-xs text-orange-600 font-semibold mt-1">
                                    ⏰ Break After
                                  </div>
                                )}
                              </div>
                            </td>
                            {days.map(day => {
                              const slot = getSlot(day, period);
                              const subject = slot?.subjectId ? getSubject(slot.subjectId) : null;
                              
                              return (
                                <td key={`${day}-${period}`} className="border border-gray-300 p-1 align-top min-w-[130px]">
                                  <div className="space-y-1">
                                    {/* Subject Selection */}
                                    <select
                                      value={slot?.subjectId || ''}
                                      onChange={(e) => handleSubjectChange(day, period, e.target.value)}
                                      className="w-full text-xs border border-gray-300 rounded px-1 py-1 focus:border-blue-500 focus:outline-none transition-colors"
                                    >
                                      <option value="">Select Subject</option>
                                      {subjects.map(subject => (
                                        <option key={subject.id} value={subject.id}>
                                          {subject.name}
                                        </option>
                                      ))}
                                    </select>

                                    {/* Teacher Selection */}
                                    {subject && subject.teachers.length > 0 && (
                                      <select
                                        value={slot?.teacherId || ''}
                                        onChange={(e) => handleTeacherChange(day, period, e.target.value)}
                                        className="w-full text-xs border border-gray-300 rounded px-1 py-1 focus:border-blue-500 focus:outline-none transition-colors"
                                      >
                                        <option value="">Select Teacher</option>
                                        {subject.teachers.map(teacher => (
                                          <option key={teacher.id} value={teacher.id}>
                                            {teacher.name} {teacher.surname}
                                          </option>
                                        ))}
                                      </select>
                                    )}
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                          {period === 4 && (
                            <tr className="bg-orange-50 border-t-2 border-orange-200">
                              <td colSpan={6} className="border border-gray-200 px-2 py-2 text-center">
                                <div className="flex items-center justify-center gap-2 text-orange-600 font-semibold">
                                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                  </svg>
                                  <span className="text-xs">INTERVAL BREAK (10:30 - 10:45)</span>
                                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                  </svg>
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
            ) : (
              <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border">
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <p className="text-lg font-medium">No Subjects Available</p>
                <p className="text-sm mt-2">Please add subjects to your class before creating a timetable</p>
              </div>
            )}
          </div>

          {/* Save Button */}
          <div className="mt-8 flex justify-end">
            <button
              onClick={saveTimetable}
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {loading ? 'Saving...' : 'Save Timetable'}
            </button>
          </div>

          {/* Subject Details Panel */}
          {subjects.length > 0 && (
            <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Available Subjects & Teachers
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {subjects.map(subject => (
                  <div key={subject.id} className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <h4 className="font-semibold text-gray-800">{subject.name}</h4>
                    </div>
                    <div className="space-y-1">
                      {subject.teachers.length > 0 ? (
                        subject.teachers.map(teacher => (
                          <div key={teacher.id} className="flex items-center gap-2 text-sm text-gray-600">
                            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                            {teacher.name} {teacher.surname}
                          </div>
                        ))
                      ) : (
                        <div className="flex items-center gap-2 text-sm text-red-500">
                          <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                          No teachers assigned
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TimetableCreationForm;
