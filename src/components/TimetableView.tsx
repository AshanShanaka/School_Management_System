"use client";

import { 
  SCHOOL_CONFIG, 
  PERIOD_TIMES, 
  DAYS_CONFIG, 
  getSubjectColor, 
  formatTime 
} from "@/lib/modernTimetableConfig";
import { formatClassDisplay } from "@/lib/formatters";
import { Clock, Calendar, Users, BookOpen } from "lucide-react";

interface TimetableViewProps {
  timetable: {
    id: number;
    name: string;
    academicYear: string;
    class: {
      name: string;
      grade: { level: number };
    };
    slots: Array<{
      day: string;
      period: number;
      startTime: string;
      endTime: string;
      isBreak: boolean;
      subject?: { name: string } | null;
      teacher?: { name: string; surname: string } | null;
    }>;
  };
  userRole?: string;
}

const TimetableView = ({ timetable, userRole }: TimetableViewProps) => {
  const getSlotForDayAndPeriod = (day: string, period: number) => {
    return timetable.slots.find(
      (slot) => slot.day === day && slot.period === period
    );
  };

  const getSlotContent = (slot: any, isBreak: boolean) => {
    if (isBreak) {
      return (
        <div className="h-full flex items-center justify-center bg-gradient-to-r from-orange-100 to-yellow-100 text-orange-700 text-sm font-medium rounded-lg">
          <Clock className="w-4 h-4 mr-1" />
          BREAK
        </div>
      );
    }

    if (slot?.subject) {
      const color = getSubjectColor(slot.subject.name);
      return (
        <div
          className="h-full p-2 rounded-lg text-white text-sm relative"
          style={{ backgroundColor: color }}
        >
          <div className="font-semibold text-xs truncate">
            {slot.subject.name}
          </div>
          {slot.teacher && (
            <div className="text-xs opacity-90 truncate">
              {slot.teacher.name} {slot.teacher.surname}
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="h-full flex items-center justify-center bg-gray-50 text-gray-400 text-xs rounded-lg border-2 border-dashed border-gray-200">
        Free Period
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header - Modern Design */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl p-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Class {timetable.class.name} Timetable
            </h1>
            <div className="flex items-center space-x-6 text-blue-100">
              <div className="flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Grade {timetable.class.grade.level}
              </div>
              <div className="flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                {timetable.academicYear} Academic Year
              </div>
              <div className="flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                {formatTime(SCHOOL_CONFIG.startTime)} -{" "}
                {formatTime(SCHOOL_CONFIG.endTime)}
              </div>
            </div>
          </div>
          
          {userRole && (
            <div className="bg-white/20 rounded-lg px-4 py-2">
              <div className="text-sm font-medium capitalize">{userRole} View</div>
            </div>
          )}
        </div>
      </div>

      {/* Timetable Grid - Compact Excel-like Design */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] table-fixed">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 w-32 border-r border-gray-200">
                  Period / Day
                </th>
                {SCHOOL_CONFIG.workingDays.map((day) => (
                  <th
                    key={day}
                    className="px-2 py-3 text-center text-sm font-semibold text-gray-900 border-r border-gray-200 last:border-r-0"
                  >
                    <div className="font-bold">{DAYS_CONFIG[day].name}</div>
                    <div className="text-xs font-normal text-gray-600">
                      {DAYS_CONFIG[day].shortName}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERIOD_TIMES.map((periodConfig, index) => (
                <tr
                  key={periodConfig.period}
                  className={`border-t border-gray-200 hover:bg-gray-50/30 ${
                    index % 2 === 0 ? "bg-gray-50/20" : ""
                  }`}
                >
                  <td className="px-4 py-2 bg-gray-50 border-r border-gray-200">
                    <div className="text-sm font-semibold text-gray-900">
                      {periodConfig.isBreak
                        ? "🕐 Break"
                        : `📚 Period ${periodConfig.period}`}
                    </div>
                    <div className="text-xs text-gray-600 mt-0.5">
                      {formatTime(periodConfig.startTime)} -{" "}
                      {formatTime(periodConfig.endTime)}
                    </div>
                    <div className="text-xs text-gray-500">
                      ({periodConfig.isBreak ? "20" : "45"} min)
                    </div>
                  </td>
                  {SCHOOL_CONFIG.workingDays.map((day) => {
                    const slot = getSlotForDayAndPeriod(day, periodConfig.period);

                    return (
                      <td key={day} className="px-2 py-1 border-r border-gray-200 last:border-r-0">
                        <div className="h-16">
                          {getSlotContent(slot, periodConfig.isBreak)}
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

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">
            Total Subjects
          </h3>
          <p className="text-3xl font-bold text-blue-600">
            {Array.from(new Set(timetable.slots.filter(s => s.subject).map(s => s.subject!.name))).length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">
            Filled Periods
          </h3>
          <p className="text-3xl font-bold text-green-600">
            {timetable.slots.filter(s => s.subject && !s.isBreak).length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">
            Free Periods
          </h3>
          <p className="text-3xl font-bold text-purple-600">
            {timetable.slots.filter(s => !s.subject && !s.isBreak).length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">
            Weekly Hours
          </h3>
          <p className="text-3xl font-bold text-orange-600">
            {Math.round((timetable.slots.filter(s => s.subject && !s.isBreak).length * 45) / 60)}h
          </p>
        </div>
      </div>

      {/* Subjects Legend */}
      {timetable.slots.some((slot) => slot.subject) && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <BookOpen className="w-5 h-5 mr-2" />
            Subject Overview
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from(
              new Set(
                timetable.slots
                  .filter((slot) => slot.subject)
                  .map((slot) => slot.subject!.name)
              )
            ).map((subjectName) => {
              const subjectSlots = timetable.slots.filter(
                (slot) => slot.subject?.name === subjectName
              );
              const teacher = subjectSlots[0]?.teacher;
              const color = getSubjectColor(subjectName);

              return (
                <div
                  key={subjectName}
                  className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                >
                  <div 
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: color }}
                  ></div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 text-sm truncate">
                      {subjectName}
                    </div>
                    {teacher && (
                      <div className="text-xs text-gray-600 truncate">
                        {teacher.name} {teacher.surname}
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {subjectSlots.length}p/w
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default TimetableView;
