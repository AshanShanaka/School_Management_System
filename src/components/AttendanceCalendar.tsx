"use client";

import React, { useState, useEffect } from "react";

interface WeekDay {
  dayName: string;
  dayNumber: number;
  isWeekend: boolean;
  isToday: boolean;
  dateString: string;
  monthYear: string;
  hasAttendance?: boolean;
  attendanceStats?: {
    present: number;
    absent: number;
    late: number;
    total: number;
  };
}

interface AttendanceCalendarProps {
  selectedDate: string;
  onDateSelect: (date: string) => void;
  classId?: number;
  showAttendanceStatus?: boolean;
}

export default function AttendanceCalendar({ 
  selectedDate, 
  onDateSelect,
  classId,
  showAttendanceStatus = true 
}: AttendanceCalendarProps) {
  const [currentWeekStart, setCurrentWeekStart] = useState<string>(new Date().toISOString().split("T")[0]);
  const [weekDays, setWeekDays] = useState<WeekDay[]>([]);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [showTooltip, setShowTooltip] = useState<string | null>(null);

  useEffect(() => {
    generateWeekDays(currentWeekStart);
  }, [currentWeekStart]);

  useEffect(() => {
    if (showAttendanceStatus && classId) {
      loadAttendanceForWeek();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekDays, classId, showAttendanceStatus]);

  const loadAttendanceForWeek = async () => {
    if (weekDays.length === 0 || !classId) return;

    try {
      setLoadingAttendance(true);
      
      // Fetch attendance for each day in the week
      const attendancePromises = weekDays.map(async (day) => {
        try {
          const response = await fetch(`/api/daily-attendance/check?classId=${classId}&date=${day.dateString}`);
          if (response.ok) {
            const data = await response.json();
            return { dateString: day.dateString, data };
          }
        } catch (error) {
          console.error(`Error loading attendance for ${day.dateString}:`, error);
        }
        return { dateString: day.dateString, data: null };
      });

      const results = await Promise.all(attendancePromises);
      
      // Update weekDays with attendance data
      setWeekDays(prevDays =>
        prevDays.map(day => {
          const result = results.find(r => r.dateString === day.dateString);
          if (result?.data) {
            return {
              ...day,
              hasAttendance: true,
              attendanceStats: result.data.stats
            };
          }
          return { ...day, hasAttendance: false };
        })
      );
    } catch (error) {
      console.error('Error loading attendance:', error);
    } finally {
      setLoadingAttendance(false);
    }
  };

  useEffect(() => {
    generateWeekDays(currentWeekStart);
  }, [currentWeekStart]);

  const generateWeekDays = (startDateString: string) => {
    const startDate = new Date(startDateString);
    const days: WeekDay[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get Monday of the week
    const weekStart = new Date(startDate);
    const day = weekStart.getDay();
    const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
    weekStart.setDate(diff);
    weekStart.setHours(0, 0, 0, 0);

    // Generate 5 weekdays (Mon-Fri)
    for (let i = 0; i < 5; i++) {
      const currentDay = new Date(weekStart);
      currentDay.setDate(weekStart.getDate() + i);

      const dateString = currentDay.toISOString().split("T")[0];
      const isToday = currentDay.getTime() === today.getTime();

      days.push({
        dayName: currentDay.toLocaleDateString("en-US", { weekday: "short" }),
        dayNumber: currentDay.getDate(),
        isWeekend: false,
        isToday,
        dateString,
        monthYear: currentDay.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
      });
    }

    setWeekDays(days);
  };

  const goToPreviousWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentWeekStart(newDate.toISOString().split("T")[0]);
  };

  const goToNextWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentWeekStart(newDate.toISOString().split("T")[0]);
  };

  const goToCurrentWeek = () => {
    setCurrentWeekStart(new Date().toISOString().split("T")[0]);
  };

  const getMonthYearDisplay = () => {
    if (weekDays.length === 0) return "";
    
    const firstDayParts = weekDays[0].dateString.split('-');
    const lastDayParts = weekDays[4].dateString.split('-');
    
    const firstDate = new Date(parseInt(firstDayParts[0]), parseInt(firstDayParts[1]) - 1, parseInt(firstDayParts[2]));
    const lastDate = new Date(parseInt(lastDayParts[0]), parseInt(lastDayParts[1]) - 1, parseInt(lastDayParts[2]));

    const firstMonth = firstDate.toLocaleDateString("en-US", { month: "long" });
    const lastMonth = lastDate.toLocaleDateString("en-US", { month: "long" });
    const year = firstDate.getFullYear();

    if (firstMonth === lastMonth) {
      return `${firstMonth} ${year}`;
    } else {
      return `${firstMonth} - ${lastMonth} ${year}`;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Header with navigation */}
      <div className="bg-gradient-to-r from-blue-500/30 to-blue-600/30 backdrop-blur-xl px-6 py-4 border-b border-blue-300/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={goToPreviousWeek}
              className="p-2 hover:bg-white/30 backdrop-blur-sm rounded-lg transition-all border border-blue-300/40"
              title="Previous Week"
            >
              <svg className="w-5 h-5 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <div className="text-blue-800">
              <div className="text-xl font-bold">{getMonthYearDisplay()}</div>
              <div className="text-blue-600 text-sm font-medium">Select a weekday to view attendance</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={goToCurrentWeek}
              className="px-4 py-2 bg-white/40 backdrop-blur-md hover:bg-white/60 text-blue-700 rounded-lg transition-all text-sm font-medium border border-blue-300/50"
            >
              Today
            </button>
            <button
              onClick={goToNextWeek}
              className="p-2 hover:bg-white/30 backdrop-blur-sm rounded-lg transition-all border border-blue-300/40"
              title="Next Week"
            >
              <svg className="w-5 h-5 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Weekday cards */}
      <div className="grid grid-cols-5 gap-3 p-4">
        {weekDays.map((day) => {
          const isSelected = day.dateString === selectedDate;
          const attendanceRate = day.attendanceStats 
            ? (day.attendanceStats.present / day.attendanceStats.total) * 100 
            : 0;
          
          // Determine status color based on attendance rate
          let statusColor = "gray";
          let statusBg = "bg-gray-100";
          let statusBorder = "border-gray-300";
          
          if (day.hasAttendance && day.attendanceStats) {
            if (attendanceRate >= 90) {
              statusColor = "green";
              statusBg = "bg-green-50";
              statusBorder = "border-green-400";
            } else if (attendanceRate >= 75) {
              statusColor = "blue";
              statusBg = "bg-blue-50";
              statusBorder = "border-blue-400";
            } else if (attendanceRate >= 50) {
              statusColor = "amber";
              statusBg = "bg-amber-50";
              statusBorder = "border-amber-400";
            } else {
              statusColor = "red";
              statusBg = "bg-red-50";
              statusBorder = "border-red-400";
            }
          }
          
          return (
            <button
              key={day.dateString}
              onClick={() => onDateSelect(day.dateString)}
              onMouseEnter={() => setShowTooltip(day.dateString)}
              onMouseLeave={() => setShowTooltip(null)}
              className={`
                relative p-4 rounded-xl border-2 transition-all duration-200 transform hover:scale-105
                ${isSelected
                  ? `${statusBorder} ${statusBg} shadow-lg scale-105`
                  : day.hasAttendance
                  ? `${statusBorder} ${statusBg} hover:shadow-md`
                  : "border-gray-200 bg-white hover:border-blue-300 hover:shadow-md"
                }
              `}
            >
              {/* Tooltip for attendance details */}
              {showTooltip === day.dateString && day.hasAttendance && day.attendanceStats && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-xl whitespace-nowrap">
                  <div className="font-semibold mb-1">
                    {new Date(day.dateString).toLocaleDateString("en-US", { 
                      weekday: "long", 
                      month: "short", 
                      day: "numeric" 
                    })}
                  </div>
                  <div className="space-y-0.5">
                    <div>Total: {day.attendanceStats.total} students</div>
                    <div className="text-green-400">✓ Present: {day.attendanceStats.present}</div>
                    <div className="text-red-400">✗ Absent: {day.attendanceStats.absent}</div>
                    {day.attendanceStats.late > 0 && (
                      <div className="text-amber-400">⏰ Late: {day.attendanceStats.late}</div>
                    )}
                  </div>
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                    <div className="border-4 border-transparent border-t-gray-900"></div>
                  </div>
                </div>
              )}
              {/* Today indicator */}
              {day.isToday && (
                <div className="absolute top-2 right-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-sm"></div>
                </div>
              )}

              {/* Attendance status badge */}
              {day.hasAttendance && day.attendanceStats && showAttendanceStatus && (
                <div className={`absolute top-2 left-2 flex items-center gap-1`}>
                  <div className={`
                    px-2 py-0.5 rounded-full text-[9px] font-bold shadow-sm
                    ${statusColor === 'green' ? 'bg-green-500 text-white' : ''}
                    ${statusColor === 'blue' ? 'bg-blue-500 text-white' : ''}
                    ${statusColor === 'amber' ? 'bg-amber-500 text-white' : ''}
                    ${statusColor === 'red' ? 'bg-red-500 text-white' : ''}
                  `}>
                    ✓
                  </div>
                </div>
              )}

              {/* Day name */}
              <div className={`text-sm font-semibold mb-1 ${
                isSelected 
                  ? `text-${statusColor}-600` 
                  : day.hasAttendance 
                  ? `text-${statusColor}-600`
                  : "text-gray-600"
              }`}>
                {day.dayName}
              </div>

              {/* Day number */}
              <div className={`text-3xl font-bold ${
                isSelected 
                  ? `text-${statusColor}-700` 
                  : day.hasAttendance 
                  ? `text-${statusColor}-700`
                  : "text-gray-800"
              }`}>
                {day.dayNumber}
              </div>

              {/* Attendance stats */}
              {day.hasAttendance && day.attendanceStats && showAttendanceStatus ? (
                <div className="mt-2 space-y-1">
                  <div className={`text-xs font-bold ${
                    statusColor === 'green' ? 'text-green-700' :
                    statusColor === 'blue' ? 'text-blue-700' :
                    statusColor === 'amber' ? 'text-amber-700' :
                    'text-red-700'
                  }`}>
                    {attendanceRate.toFixed(0)}% Present
                  </div>
                  <div className="flex gap-1 text-[10px]">
                    <span className="text-green-600">✓{day.attendanceStats.present}</span>
                    <span className="text-red-600">✗{day.attendanceStats.absent}</span>
                    {day.attendanceStats.late > 0 && (
                      <span className="text-amber-600">⏰{day.attendanceStats.late}</span>
                    )}
                  </div>
                </div>
              ) : (
                <div className={`text-xs mt-2 ${isSelected ? `text-${statusColor}-500` : "text-gray-400"}`}>
                  {day.monthYear}
                </div>
              )}

              {/* Selected indicator */}
              {isSelected && (
                <div className={`absolute bottom-0 left-0 right-0 h-1 rounded-b-xl ${
                  statusColor === 'green' ? 'bg-green-600' :
                  statusColor === 'blue' ? 'bg-blue-600' :
                  statusColor === 'amber' ? 'bg-amber-600' :
                  statusColor === 'red' ? 'bg-red-600' :
                  'bg-blue-600'
                }`}></div>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="px-6 py-3 bg-gradient-to-r from-gray-50 to-blue-50 border-t border-gray-200">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-gray-600 font-medium">Today</span>
              </div>
              {showAttendanceStatus && (
                <>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-gray-600">≥90%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-gray-600">≥75%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                    <span className="text-gray-600">≥50%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-gray-600">&lt;50%</span>
                  </div>
                </>
              )}
            </div>
            <div className="text-gray-500 italic flex items-center gap-2">
              📅 Weekdays only
              {loadingAttendance && (
                <span className="flex items-center gap-1">
                  <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-blue-600">Loading...</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
