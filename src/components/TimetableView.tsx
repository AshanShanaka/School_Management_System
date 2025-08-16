"use client";

import { TIMETABLE_CONFIG } from "@/lib/timetableConfig";
import Image from "next/image";

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

  const getSubjectColor = (subjectName: string) => {
    // Generate consistent colors for subjects
    const colors = [
      "bg-blue-100 text-blue-800",
      "bg-green-100 text-green-800",
      "bg-purple-100 text-purple-800",
      "bg-yellow-100 text-yellow-800",
      "bg-pink-100 text-pink-800",
      "bg-indigo-100 text-indigo-800",
      "bg-red-100 text-red-800",
      "bg-gray-100 text-gray-800",
    ];

    const hash = subjectName.split("").reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0);
      return a & a;
    }, 0);

    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {timetable.name}
            </h2>
            <p className="text-gray-600 mt-1">
              Grade {timetable.class.grade.level} - {timetable.class.name} •{" "}
              {timetable.academicYear}
            </p>
          </div>
          <div className="hidden md:flex items-center gap-2 text-sm text-gray-500">
            <Image src="/calendar.png" alt="" width={16} height={16} />
            <span>Weekly Schedule</span>
          </div>
        </div>
      </div>

      {/* Timetable Grid */}
      <div className="p-6">
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 bg-gray-50 rounded-tl-lg">
                    Time
                  </th>
                  {TIMETABLE_CONFIG.days.map((day, index) => (
                    <th
                      key={day}
                      className={`text-center py-3 px-4 font-semibold text-gray-700 bg-gray-50 ${
                        index === TIMETABLE_CONFIG.days.length - 1
                          ? "rounded-tr-lg"
                          : ""
                      }`}
                    >
                      {day.charAt(0) + day.slice(1).toLowerCase()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {TIMETABLE_CONFIG.timeSlots.map((timeSlot, rowIndex) => (
                  <tr
                    key={timeSlot.period}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="py-4 px-4 border-r border-gray-100">
                      <div className="text-sm font-medium text-gray-900">
                        {timeSlot.startTime} - {timeSlot.endTime}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {timeSlot.isBreak
                          ? "Break Time"
                          : `Period ${timeSlot.period}`}
                      </div>
                    </td>
                    {TIMETABLE_CONFIG.days.map((day) => {
                      const slot = getSlotForDayAndPeriod(day, timeSlot.period);

                      return (
                        <td key={day} className="py-4 px-4 text-center">
                          {timeSlot.isBreak ? (
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                              <div className="text-amber-800 font-medium text-sm">
                                ☕ Break Time
                              </div>
                              <div className="text-amber-600 text-xs mt-1">
                                20 minutes
                              </div>
                            </div>
                          ) : slot?.subject ? (
                            <div
                              className={`rounded-lg p-3 border ${getSubjectColor(
                                slot.subject.name
                              )}`}
                            >
                              <div className="font-semibold text-sm">
                                {slot.subject.name}
                              </div>
                              {slot.teacher && (
                                <div className="text-xs mt-1 opacity-90">
                                  {slot.teacher.name} {slot.teacher.surname}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-gray-400 text-sm py-3">
                              <div className="text-gray-300">—</div>
                              <div className="text-xs">Free Period</div>
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

      {/* Footer with subjects legend */}
      {timetable.slots.some((slot) => slot.subject) && (
        <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Subjects</h3>
          <div className="flex flex-wrap gap-2">
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

              return (
                <div
                  key={subjectName}
                  className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm ${getSubjectColor(
                    subjectName
                  )}`}
                >
                  <span className="font-medium">{subjectName}</span>
                  {teacher && (
                    <span className="text-xs opacity-75">
                      • {teacher.name} {teacher.surname}
                    </span>
                  )}
                  <span className="text-xs opacity-75">
                    ({subjectSlots.length} periods/week)
                  </span>
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
