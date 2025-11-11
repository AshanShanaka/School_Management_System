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
  const [timetable, setTimetable] = useState<TimetableSlot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedWeekStart, setSelectedWeekStart] = useState('');

  // Sri Lankan school system configuration
  const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];
  const PERIODS = [1, 2, 3, 4, 5, 6];
  const TIME_SLOTS = [
    '07:30 - 08:20',
    '08:20 - 09:10', 
    '09:10 - 10:00',
    '10:00 - 10:20', // Break
    '10:20 - 11:10',
    '11:10 - 12:00'
  ];

  // Initialize empty timetable
  React.useEffect(() => {
    if (selectedClass && subjects.length > 0) {
      const initialTimetable: TimetableSlot[] = [];
      
      DAYS.forEach(day => {
        PERIODS.forEach(period => {
          initialTimetable.push({
            day,
            period,
            subjectId: null,
            teacherId: null,
            isBreak: period === 4 // Period 4 is break time
          });
        });
      });
      
      setTimetable(initialTimetable);
    }
  }, [selectedClass, subjects]);

  const updateSlot = (day: string, period: number, subjectId: number | null, teacherId: string | null) => {
    setTimetable(prev => prev.map(slot => 
      slot.day === day && slot.period === period 
        ? { ...slot, subjectId, teacherId }
        : slot
    ));
  };

  const getSlot = (day: string, period: number) => {
    return timetable.find(slot => slot.day === day && slot.period === period);
  };

  const saveTimetable = async () => {
    if (!selectedWeekStart) {
      alert('Please select a week start date');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/timetable/${selectedClass.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slots: timetable.map(slot => ({
            day: slot.day,
            period: slot.period,
            startTime: TIME_SLOTS[slot.period - 1]?.split(' - ')[0] || '',
            endTime: TIME_SLOTS[slot.period - 1]?.split(' - ')[1] || '',
            isBreak: slot.isBreak,
            subjectId: slot.subjectId,
            teacherId: slot.teacherId
          })),
          weekStart: selectedWeekStart
        })
      });

      if (response.ok) {
        alert('Timetable saved successfully!');
        router.push('/admin/timetable');
      } else {
        throw new Error('Failed to save timetable');
      }
    } catch (error) {
      console.error('Error saving timetable:', error);
      alert('Error saving timetable. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!selectedClass) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        <div className="text-center">
          <Image src="/search.png" alt="No Class" width={64} height={64} className="mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Class Selected</h3>
          <p className="text-gray-500">Please select a class from the dropdown above to create a timetable.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* HEADER */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Weekly Timetable</h2>
            <p className="text-indigo-100">
              Class: {selectedClass.name} (Grade {selectedClass.grade.level})
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-indigo-200">Available Subjects</div>
            <div className="text-xl font-bold">{subjects.length}</div>
          </div>
        </div>
      </div>

      <div className="p-8">
        {/* WEEK SELECTOR */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Week Start Date
          </label>
          <input
            type="date"
            value={selectedWeekStart}
            onChange={(e) => setSelectedWeekStart(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            required
          />
        </div>

        {/* TIMETABLE GRID */}
        {selectedWeekStart && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-900">
                    Time
                  </th>
                  {DAYS.map(day => (
                    <th key={day} className="border border-gray-200 px-4 py-3 text-center text-sm font-medium text-gray-900">
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PERIODS.map(period => (
                  <tr key={period} className={period === 4 ? 'bg-orange-50' : ''}>
                    <td className="border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700">
                      <div className="text-xs text-gray-500">Period {period}</div>
                      <div>{TIME_SLOTS[period - 1]}</div>
                    </td>
                    {DAYS.map(day => {
                      const slot = getSlot(day, period);
                      const isBreak = period === 4;

                      if (isBreak) {
                        return (
                          <td key={`${day}-${period}`} className="border border-gray-200 px-2 py-3">
                            <div className="text-center text-orange-600 font-medium">
                              BREAK
                            </div>
                          </td>
                        );
                      }

                      return (
                        <td key={`${day}-${period}`} className="border border-gray-200 px-2 py-3">
                          <div className="space-y-2">
                            {/* Subject Selection */}
                            <select
                              value={slot?.subjectId || ''}
                              onChange={(e) => {
                                const subjectId = e.target.value ? parseInt(e.target.value) : null;
                                updateSlot(day, period, subjectId, slot?.teacherId || null);
                              }}
                              className="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-indigo-500"
                            >
                              <option value="">Select Subject</option>
                              {subjects.map(subject => (
                                <option key={subject.id} value={subject.id}>
                                  {subject.name}
                                </option>
                              ))}
                            </select>

                            {/* Teacher Selection */}
                            {slot?.subjectId && (
                              <select
                                value={slot?.teacherId || ''}
                                onChange={(e) => {
                                  const teacherId = e.target.value || null;
                                  updateSlot(day, period, slot.subjectId, teacherId);
                                }}
                                className="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-indigo-500"
                              >
                                <option value="">Select Teacher</option>
                                {subjects
                                  .find(s => s.id === slot.subjectId)
                                  ?.teachers.map(teacher => (
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
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ACTION BUTTONS */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
          <Link
            href="/admin/timetable"
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <Image src="/close.png" alt="Cancel" width={16} height={16} />
            Cancel
          </Link>
          
          <button
            onClick={saveTimetable}
            disabled={isLoading || !selectedWeekStart}
            className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Image src="/create.png" alt="Save" width={16} height={16} />
            {isLoading ? 'Saving...' : 'Save Timetable'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TimetableCreationForm;
