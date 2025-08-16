"use client";

import { useState } from "react";
import { Day } from "@prisma/client";

interface TimetableSlot {
  id?: number;
  day: Day;
  period: number;
  startTime: string;
  endTime: string;
  isBreak: boolean;
  lessonId?: number | null;
  lesson?: {
    name: string;
    subject: { name: string };
    teacher: { name: string; surname: string };
  } | null;
}

interface TimetableEditorProps {
  timetableId: number;
  initialSlots: TimetableSlot[];
  subjects: Array<{ id: number; name: string }>;
  teachers: Array<{ id: string; name: string; surname: string }>;
  classId: number;
}

const TimetableEditor = ({
  timetableId,
  initialSlots,
  subjects,
  teachers,
  classId,
}: TimetableEditorProps) => {
  const [slots, setSlots] = useState<TimetableSlot[]>(initialSlots);
  const [isEditing, setIsEditing] = useState(false);

  const days = [
    Day.MONDAY,
    Day.TUESDAY,
    Day.WEDNESDAY,
    Day.THURSDAY,
    Day.FRIDAY,
  ];
  const periods = [1, 2, 3, 4, 5, 6, 7, 8];
  const timeSlots = [
    { start: "08:00", end: "08:45" },
    { start: "08:45", end: "09:30" },
    { start: "09:30", end: "10:15" },
    { start: "10:15", end: "11:00" },
    { start: "11:00", end: "11:30" }, // Break time
    { start: "11:30", end: "12:15" },
    { start: "12:15", end: "13:00" },
    { start: "13:00", end: "13:45" },
  ];

  const getSlotForDayAndPeriod = (
    day: Day,
    period: number
  ): TimetableSlot | undefined => {
    return slots.find((slot) => slot.day === day && slot.period === period);
  };

  const createEmptySlot = (day: Day, period: number): TimetableSlot => {
    const timeSlot = timeSlots[period - 1];
    return {
      day,
      period,
      startTime: timeSlot.start,
      endTime: timeSlot.end,
      isBreak: period === 5,
      lessonId: null,
      lesson: null,
    };
  };

  const updateSlot = (
    day: Day,
    period: number,
    updates: Partial<TimetableSlot>
  ) => {
    setSlots((prevSlots) => {
      const existingSlotIndex = prevSlots.findIndex(
        (slot) => slot.day === day && slot.period === period
      );

      if (existingSlotIndex >= 0) {
        // Update existing slot
        const updatedSlots = [...prevSlots];
        updatedSlots[existingSlotIndex] = {
          ...updatedSlots[existingSlotIndex],
          ...updates,
        };
        return updatedSlots;
      } else {
        // Create new slot
        const newSlot = { ...createEmptySlot(day, period), ...updates };
        return [...prevSlots, newSlot];
      }
    });
  };

  const saveTimetable = async () => {
    try {
      const response = await fetch(`/api/timetables/${timetableId}/slots`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slots }),
      });

      if (response.ok) {
        setIsEditing(false);
        // Show success message
      } else {
        // Show error message
        console.error("Failed to save timetable");
      }
    } catch (error) {
      console.error("Error saving timetable:", error);
    }
  };

  return (
    <div className="bg-white p-6 rounded-md">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Timetable Editor</h2>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <button
                onClick={saveTimetable}
                className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
              >
                Save Changes
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="bg-lamaPurple text-white px-4 py-2 rounded-md hover:bg-lamaPurpleLight"
            >
              Edit Timetable
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300 min-w-[800px]">
          <thead>
            <tr className="bg-gray-50">
              <th className="border border-gray-300 p-3 text-left font-semibold w-24">
                Time
              </th>
              {days.map((day) => (
                <th
                  key={day}
                  className="border border-gray-300 p-3 text-center font-semibold"
                >
                  {day.charAt(0) + day.slice(1).toLowerCase()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {periods.map((period, index) => (
              <tr key={period} className={period === 5 ? "bg-yellow-50" : ""}>
                <td className="border border-gray-300 p-3 font-medium text-sm">
                  <div>
                    {timeSlots[index].start}-{timeSlots[index].end}
                  </div>
                  <div className="text-xs text-gray-500">Period {period}</div>
                </td>
                {days.map((day) => {
                  const slot =
                    getSlotForDayAndPeriod(day, period) ||
                    createEmptySlot(day, period);

                  if (period === 5) {
                    return (
                      <td
                        key={day}
                        className="border border-gray-300 p-3 text-center bg-yellow-100"
                      >
                        <div className="text-sm font-medium text-yellow-800">
                          Break Time
                        </div>
                      </td>
                    );
                  }

                  return (
                    <td key={day} className="border border-gray-300 p-2">
                      {isEditing ? (
                        <div className="space-y-2">
                          <select
                            className="w-full text-xs p-1 border rounded"
                            value={slot.lessonId || ""}
                            onChange={(e) => {
                              const lessonId = e.target.value
                                ? parseInt(e.target.value)
                                : null;
                              updateSlot(day, period, { lessonId });
                            }}
                          >
                            <option value="">No lesson</option>
                            {subjects.map((subject) => (
                              <option key={subject.id} value={subject.id}>
                                {subject.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <div className="text-center">
                          {slot.lesson ? (
                            <div className="bg-lamaSkyLight p-2 rounded text-xs">
                              <div className="font-semibold">
                                {slot.lesson.subject.name}
                              </div>
                              <div className="text-gray-600">
                                {slot.lesson.teacher.name}{" "}
                                {slot.lesson.teacher.surname}
                              </div>
                            </div>
                          ) : (
                            <div className="text-gray-400 text-xs">-</div>
                          )}
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
  );
};

export default TimetableEditor;
