'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format, addDays, startOfWeek, addWeeks } from 'date-fns';

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
  email?: string | null;
  phone?: string | null;
}

interface Class {
  id: number;
  name: string;
  capacity: number;
  grade: {
    id: number;
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
  const periods = [1, 2, 3, 4, 5, 6]; // All 6 periods

  // Initialize timetable slots
  useEffect(() => {
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

  // Set initial week start date to current Monday
  useEffect(() => {
    const today = new Date();
    const monday = startOfWeek(today, { weekStartsOn: 1 });
    setWeekStartDate(format(monday, 'yyyy-MM-dd'));
  }, []);

  // Update week dates when week start date changes
  useEffect(() => {
    if (weekStartDate) {
      const startDate = new Date(weekStartDate);
      const dates: { [key: string]: string } = {};
      days.forEach((day, index) => {
        const date = addDays(startDate, index);
        dates[day] = format(date, 'MMM dd');
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
    if (!subject) return undefined;
    return subject.teachers.find(teacher => teacher.id === teacherId);
  };

  const handleSubjectChange = (day: string, period: number, subjectId: string) => {
    updateSlot(day, period, {
      subjectId: subjectId ? parseInt(subjectId) : null,
      teacherId: null // Reset teacher when subject changes
    });
  };

  const handleTeacherChange = (day: string, period: number, teacherId: string) => {
    updateSlot(day, period, { teacherId: teacherId || null });
  };

  const handleBreakToggle = (day: string, period: number) => {
    const slot = getSlot(day, period);
    updateSlot(day, period, {
      isBreak: !slot?.isBreak,
      subjectId: slot?.isBreak ? null : null,
      teacherId: slot?.isBreak ? null : null
    });
  };

  const getPeriodTime = (period: number) => {
    const times = [
      { start: '07:30', end: '08:20' },
      { start: '08:20', end: '09:10' },
      { start: '09:10', end: '10:00' },
      { start: '10:20', end: '11:10' }, // Break from 10:00-10:20
      { start: '11:10', end: '12:00' },
      { start: '12:00', end: '12:50' }
    ];
    return times[period - 1] || { start: '00:00', end: '00:00' };
  };

  const saveTimetable = async () => {
    setLoading(true);
    try {
      console.log('Saving timetable...', { selectedClass, timetableSlots });
      // Simulate save
      await new Promise(resolve => setTimeout(resolve, 2000));
      router.push('/list/lessons');
    } catch (error) {
      console.error('Error saving timetable:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    total: timetableSlots.length,
    filled: timetableSlots.filter(slot => slot.subjectId && !slot.isBreak).length,
    free: timetableSlots.filter(slot => !slot.subjectId && !slot.isBreak).length,
    breaks: timetableSlots.filter(slot => slot.isBreak).length,
    utilization: Math.round((timetableSlots.filter(slot => slot.subjectId && !slot.isBreak).length / timetableSlots.length) * 100)
  };

  const formatClassName = (level: number, name: string) => {
    return `${level}-${name}`;
  };

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
            <label className="block text-sm font-medium text-gray-700 mb-2">Academic Year</label>
            <input
              type="text"
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:border-blue-500 focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Week Start Date</label>
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
            <div>Subject Names: {subjects.map(s => s.name).join(', ')}</div>
          </div>
        </div>

        {/* Weekly Timetable */}
        <div className="bg-white rounded-lg shadow border border-gray-200 mb-6">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <div className="bg-indigo-100 p-2 rounded-lg">
                <svg className="w-4 h-4 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
              </div>
              Weekly Timetable - All 6 Periods
              <span className="text-xs font-normal text-gray-500 ml-2">
                ({subjects.length} subjects available)
              </span>
            </h3>
          </div>

          {subjects.length > 0 ? (
            <div className="p-4">
              <div className="w-full overflow-x-auto">
                <table className="w-full border-collapse min-w-[1000px]">
                  <thead>
                    <tr className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                      <th className="border border-gray-300 px-3 py-3 text-left font-bold w-32">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                          </svg>
                          <span className="text-sm">Period / Day</span>
                        </div>
                      </th>
                      {days.map(day => (
                        <th key={day} className="border border-gray-300 px-3 py-3 text-center font-bold text-white min-w-[180px]">
                          <div className="space-y-1">
                            <div className="text-sm font-bold">
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
                      <tr key={period} className="hover:bg-gray-50 transition-colors border-b border-gray-200">
                        <td className="border border-gray-300 px-3 py-3 bg-gradient-to-r from-gray-50 to-gray-100 font-semibold">
                          <div className="space-y-1">
                            <div className="text-gray-800 font-bold text-sm">Period {period}</div>
                            <div className="text-xs text-gray-500">
                              {getPeriodTime(period).start} - {getPeriodTime(period).end}
                            </div>
                          </div>
                        </td>
                        {days.map(day => {
                          const slot = getSlot(day, period);
                          const subject = slot?.subjectId ? getSubject(slot.subjectId) : null;
                          
                          return (
                            <td key={`${day}-${period}`} className="border border-gray-300 p-3 align-top min-w-[180px]">
                              <div className="space-y-2">
                                {/* Subject Selection */}
                                <select
                                  value={slot?.subjectId || ''}
                                  onChange={(e) => handleSubjectChange(day, period, e.target.value)}
                                  disabled={slot?.isBreak}
                                  className="w-full text-xs border border-gray-300 rounded-md px-2 py-1 focus:border-blue-500 focus:outline-none transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
                                >
                                  <option value="">Select Subject</option>
                                  {subjects.map(subject => (
                                    <option key={subject.id} value={subject.id}>
                                      {subject.name}
                                    </option>
                                  ))}
                                </select>

                                {/* Teacher Selection */}
                                {subject && subject.teachers.length > 0 && !slot?.isBreak && (
                                  <select
                                    value={slot?.teacherId || ''}
                                    onChange={(e) => handleTeacherChange(day, period, e.target.value)}
                                    className="w-full text-xs border border-gray-300 rounded-md px-2 py-1 focus:border-blue-500 focus:outline-none transition-colors"
                                  >
                                    <option value="">Select Teacher</option>
                                    {subject.teachers.map(teacher => (
                                      <option key={teacher.id} value={teacher.id}>
                                        {teacher.name} {teacher.surname}
                                      </option>
                                    ))}
                                  </select>
                                )}

                                {/* Break Toggle */}
                                <button
                                  onClick={() => handleBreakToggle(day, period)}
                                  className={`w-full text-xs px-2 py-1 rounded-md font-medium transition-all duration-200 ${
                                    slot?.isBreak 
                                      ? 'bg-yellow-100 text-yellow-800 border border-yellow-300 hover:bg-yellow-200' 
                                      : 'bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200'
                                  }`}
                                >
                                  {slot?.isBreak ? '🍽️ BREAK' : '⏰ Break'}
                                </button>
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-400 p-8 rounded-xl shadow-sm">
              <div className="flex items-start gap-4">
                <div className="bg-yellow-100 p-3 rounded-lg">
                  <svg className="w-6 h-6 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-yellow-800 mb-2">
                    No Subjects Available
                  </h3>
                  <p className="text-yellow-700 mb-4">
                    Before creating a timetable for <span className="font-semibold">
                    {formatClassName(selectedClass.grade.level, selectedClass.name)}</span>, you need to
                    add subjects to the system first.
                  </p>
                  <div className="flex gap-3">
                    <Link
                      href="/list/subjects"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors duration-200"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                      Add Subjects
                    </Link>
                    <Link
                      href="/list/teachers"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                      Manage Teachers
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Available Subjects Reference */}
        {subjects.length > 0 && (
          <div className="mt-8 bg-gradient-to-br from-slate-50 to-blue-50 p-6 rounded-xl border border-slate-200">
            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" clipRule="evenodd" />
                </svg>
              </div>
              Available Subjects & Teachers
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {subjects.map(subject => (
                <div key={subject.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="font-bold text-gray-800 text-lg">{subject.name}</h4>
                      {subject.code && (
                        <p className="text-sm text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded mt-1 inline-block">
                          {subject.code}
                        </p>
                      )}
                    </div>
                    <div className="bg-indigo-100 p-2 rounded-lg">
                      <svg className="w-4 h-4 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Available Teachers:</span>
                      <span className="font-semibold text-indigo-600">{subject.teachers.length}</span>
                    </div>
                    {subject.teachers.length > 0 && (
                      <div className="mt-3">
                        <div className="text-xs text-gray-500 mb-2">Teachers:</div>
                        <div className="space-y-1">
                          {subject.teachers.map(teacher => (
                            <div key={teacher.id} className="flex items-center gap-2 text-sm">
                              <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                              <span className="text-gray-700">{teacher.name} {teacher.surname}</span>
                            </div>
                          ))}
                        </div>
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
  );
};

export default TimetableCreationForm;
