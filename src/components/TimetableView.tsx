"use client";

import React from "react";
import Image from "next/image";

interface TimetableViewProps {
  classId?: number;
  readonly?: boolean;
  timetable?: any;
  userRole?: string;
}

const TimetableView: React.FC<TimetableViewProps> = ({
  classId,
  readonly = false,
  timetable,
  userRole,
}) => {
  if (!timetable) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Timetable View</h3>
        <p className="text-gray-600">
          {classId ? `No timetable found for class ${classId}` : 'Select a class to view timetable'}
        </p>
      </div>
    );
  }

  // Days of the week
  const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];
  
  // Time slots (assuming 8 periods)
  const periods = Array.from({ length: 8 }, (_, i) => i + 1);

  // Create a grid structure for the timetable
  const createTimetableGrid = () => {
    const grid: { [key: string]: any } = {};
    
    // Initialize grid
    days.forEach(day => {
      grid[day] = {};
      periods.forEach(period => {
        grid[day][period] = null;
      });
    });
    
    // Fill grid with slots
    timetable.slots?.forEach((slot: any) => {
      if (grid[slot.day]) {
        grid[slot.day][slot.period] = slot;
      }
    });
    
    return grid;
  };

  const timetableGrid = createTimetableGrid();

  // Get time for period
  const getTimeForPeriod = (period: number) => {
    const startHour = 8 + Math.floor((period - 1) / 2);
    const startMinute = (period - 1) % 2 === 0 ? 0 : 30;
    const endHour = startHour + (startMinute === 30 ? 1 : 0);
    const endMinute = startMinute === 30 ? 0 : 30;
    
    return `${startHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')} - ${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* Compact Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900">{timetable.name}</h3>
            <div className="flex items-center gap-3 mt-1 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                🎓 Grade {timetable.class?.grade?.level}-{timetable.class?.name}
              </span>
              <span>📅 {timetable.academicYear}</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                timetable.isActive 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {timetable.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Compact Timetable Grid */}
      <div className="p-4">
        <div className="overflow-x-auto border rounded-lg">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-violet-50 to-purple-50">
                <th className="p-2 text-left font-semibold text-gray-700 border-r text-xs">Time</th>
                {days.map(day => (
                  <th key={day} className="p-2 text-center font-semibold text-gray-700 border-r last:border-r-0 text-xs">
                    {day.slice(0, 3)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {periods.map(period => (
                <tr key={period} className="border-b hover:bg-violet-25 transition-colors">
                  <td className="p-2 border-r bg-gradient-to-r from-gray-50 to-gray-100 font-medium text-gray-700 text-xs">
                    <div className="text-center">
                      <div className="font-bold text-gray-900">P{period}</div>
                      <div className="text-xs text-gray-500">{getTimeForPeriod(period).split(' - ')[0]}</div>
                    </div>
                  </td>
                  {days.map(day => {
                    const slot = timetableGrid[day][period];
                    return (
                      <td key={`${day}-${period}`} className="p-1 border-r last:border-r-0 h-16">
                        {slot ? (
                          <div className={`h-full rounded-md p-2 text-center transition-all duration-200 ${
                            slot.isBreak 
                              ? 'bg-gradient-to-br from-yellow-100 to-yellow-200 border border-yellow-300' 
                              : 'bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-200 hover:from-violet-100 hover:to-purple-100'
                          }`}>
                            {slot.isBreak ? (
                              <div className="flex flex-col justify-center h-full">
                                <span className="font-semibold text-yellow-800 text-xs">Break</span>
                              </div>
                            ) : (
                              <div className="flex flex-col justify-center h-full">
                                <span className="font-bold text-violet-900 text-xs leading-tight">
                                  {slot.subject?.name || 'No Subject'}
                                </span>
                                {slot.teacher && (
                                  <span className="text-xs text-violet-700 truncate">
                                    {slot.teacher.name.charAt(0)}.{slot.teacher.surname}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="h-full rounded-md border border-dashed border-gray-200 flex items-center justify-center hover:border-gray-300 transition-colors">
                            <span className="text-xs text-gray-400">Free</span>
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

        {/* Compact Statistics */}
        <div className="mt-4 grid grid-cols-4 gap-3">
          <div className="bg-gradient-to-br from-violet-50 to-violet-100 p-3 rounded-lg border border-violet-200 text-center">
            <div className="text-lg font-bold text-violet-700">{timetable.slots?.filter((s: any) => !s.isBreak).length || 0}</div>
            <div className="text-xs text-gray-600">Periods</div>
          </div>
          
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-3 rounded-lg border border-emerald-200 text-center">
            <div className="text-lg font-bold text-emerald-700">
              {new Set(timetable.slots?.filter((s: any) => s.subjectId).map((s: any) => s.subjectId)).size || 0}
            </div>
            <div className="text-xs text-gray-600">Subjects</div>
          </div>
          
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 rounded-lg border border-blue-200 text-center">
            <div className="text-lg font-bold text-blue-700">
              {new Set(timetable.slots?.filter((s: any) => s.teacherId).map((s: any) => s.teacherId)).size || 0}
            </div>
            <div className="text-xs text-gray-600">Teachers</div>
          </div>
          
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-3 rounded-lg border border-yellow-200 text-center">
            <div className="text-lg font-bold text-yellow-700">{timetable.slots?.filter((s: any) => s.isBreak).length || 0}</div>
            <div className="text-xs text-gray-600">Breaks</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimetableView;
