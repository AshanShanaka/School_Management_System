"use client";

import { DEFAULT_PERIODS } from "@/lib/timetable/types";
import type { TimetableSlot } from "@/lib/timetable/types";

interface TimetableGridProps {
  slots: TimetableSlot[];
  editable?: boolean;
  onSlotClick?: (day: string, period: number) => void;
  onSlotEdit?: (slot: TimetableSlot) => void;
}

const DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"];

const TimetableGrid: React.FC<TimetableGridProps> = ({
  slots,
  editable = false,
  onSlotClick,
  onSlotEdit,
}) => {
  const getSlot = (day: string, period: number): TimetableSlot | undefined => {
    return slots.find((s) => s.day === day && s.period === period);
  };

  const getSlotColor = (slot?: TimetableSlot): string => {
    if (!slot) return "bg-gray-50";
    if (slot.isBreak) {
      if (slot.period === 0) return "bg-purple-100"; // Assembly
      if (slot.period === 5) return "bg-green-100"; // Interval
      if (slot.period === 10) return "bg-blue-100"; // Pack-up
      return "bg-yellow-100";
    }
    return slot.subjectColor || "bg-blue-100";
  };

  const getSlotText = (slot?: TimetableSlot): string => {
    if (!slot || !slot.subjectName) return "";
    return slot.subjectName;
  };

  const handleSlotInteraction = (day: string, period: number) => {
    if (!editable) return;
    
    const slot = getSlot(day, period);
    if (slot && slot.isBreak) return; // Can't edit break periods
    
    if (slot && slot.subjectId && onSlotEdit) {
      onSlotEdit(slot);
    } else if (onSlotClick) {
      onSlotClick(day, period);
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-300 px-4 py-3 text-left font-semibold">
              Time / Day
            </th>
            {DAYS.map((day) => (
              <th
                key={day}
                className="border border-gray-300 px-4 py-3 text-center font-semibold"
              >
                {day.charAt(0) + day.slice(1).toLowerCase()}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {DEFAULT_PERIODS.map((periodInfo) => (
            <tr key={periodInfo.number} className="hover:bg-gray-50">
              <td className="border border-gray-300 px-4 py-2 bg-gray-50">
                <div className="text-sm font-medium">
                  {periodInfo.isBreak ? (
                    <span className="text-gray-600">
                      {periodInfo.number === 0
                        ? "Assembly"
                        : periodInfo.number === 5
                        ? "Interval"
                        : periodInfo.number === 10
                        ? "Pack-up"
                        : "Break"}
                    </span>
                  ) : (
                    <span>Period {periodInfo.number}</span>
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  {periodInfo.timeSlot.startTime} - {periodInfo.timeSlot.endTime}
                </div>
              </td>
              {DAYS.map((day) => {
                const slot = getSlot(day, periodInfo.number);
                const isBreak = periodInfo.isBreak;
                const hasSubject = slot && slot.subjectId;

                return (
                  <td
                    key={`${day}-${periodInfo.number}`}
                    className={`border border-gray-300 p-2 ${
                      isBreak
                        ? getSlotColor(slot)
                        : hasSubject
                        ? ""
                        : "bg-white"
                    } ${
                      editable && !isBreak
                        ? "cursor-pointer hover:shadow-inner"
                        : ""
                    }`}
                    style={{
                      backgroundColor:
                        !isBreak && hasSubject
                          ? slot.subjectColor || "#DBEAFE"
                          : undefined,
                    }}
                    onClick={() =>
                      !isBreak && handleSlotInteraction(day, periodInfo.number)
                    }
                  >
                    {isBreak ? (
                      <div className="text-center text-sm font-medium text-gray-600">
                        {periodInfo.number === 0
                          ? "🏫 Assembly"
                          : periodInfo.number === 5
                          ? "☕ Interval"
                          : periodInfo.number === 10
                          ? "📦 Pack-up"
                          : "Break"}
                      </div>
                    ) : hasSubject ? (
                      <div className="space-y-1">
                        <div className="font-semibold text-sm">
                          {slot.subjectName}
                        </div>
                        {slot.subjectCode && (
                          <div className="text-xs text-gray-600">
                            {slot.subjectCode}
                          </div>
                        )}
                        {slot.teacherName && (
                          <div className="text-xs text-gray-700">
                            👤 {slot.teacherName}
                          </div>
                        )}
                        {slot.roomNumber && (
                          <div className="text-xs text-gray-600">
                            🚪 Room {slot.roomNumber}
                          </div>
                        )}
                      </div>
                    ) : editable ? (
                      <div className="text-center text-gray-400 text-sm">
                        + Add
                      </div>
                    ) : (
                      <div className="text-center text-gray-300 text-sm">-</div>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TimetableGrid;
