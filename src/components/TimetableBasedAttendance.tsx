"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { formatClassDisplay } from "@/lib/formatters";

interface TimetableSlot {
  id: number;
  day: string;
  period: number;
  startTime: string;
  endTime: string;
  isBreak: boolean;
  subject?: {
    id: number;
    name: string;
  };
  teacher?: {
    id: string;
    name: string;
    surname: string;
  };
  timetable: {
    id: number;
    name: string;
    class: {
      id: number;
      name: string;
      grade: {
        level: number;
      };
    };
  };
}

interface Student {
  id: string;
  name: string;
  surname: string;
  img?: string;
}

interface ExistingAttendance {
  id: number;
  studentId: string;
  present: boolean;
  date: string;
}

interface TimetableBasedAttendanceProps {
  currentSlots: TimetableSlot[];
  students: Student[];
  selectedSlotId?: number;
  selectedDate: string;
  existingAttendance: ExistingAttendance[];
  teacherId: string;
}

const TimetableBasedAttendance = ({
  currentSlots,
  students,
  selectedSlotId,
  selectedDate,
  existingAttendance,
  teacherId,
}: TimetableBasedAttendanceProps) => {
  const [selectedSlot, setSelectedSlot] = useState<TimetableSlot | null>(
    currentSlots.find((slot) => slot.id === selectedSlotId) || null
  );
  const [attendance, setAttendance] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  // Initialize attendance from existing data
  useEffect(() => {
    if (selectedSlot && existingAttendance.length > 0) {
      const attendanceMap: Record<string, boolean> = {};
      existingAttendance.forEach((record) => {
        attendanceMap[record.studentId] = record.present;
      });
      setAttendance(attendanceMap);
    } else {
      // Initialize all as present by default
      const defaultAttendance: Record<string, boolean> = {};
      students.forEach((student) => {
        defaultAttendance[student.id] = true;
      });
      setAttendance(defaultAttendance);
    }
  }, [selectedSlot, existingAttendance, students]);

  const handleSlotChange = (slotId: string) => {
    if (slotId === "") {
      setSelectedSlot(null);
      return;
    }

    const slot = currentSlots.find((s) => s.id === parseInt(slotId));
    if (slot) {
      setSelectedSlot(slot);
      // Update URL to reflect selected slot
      const url = new URL(window.location.href);
      url.searchParams.set("slotId", slotId);
      router.push(url.toString());
    }
  };

  const toggleAttendance = (studentId: string) => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: !prev[studentId],
    }));
  };

  const markAllPresent = () => {
    const allPresent: Record<string, boolean> = {};
    students.forEach((student) => {
      allPresent[student.id] = true;
    });
    setAttendance(allPresent);
  };

  const markAllAbsent = () => {
    const allAbsent: Record<string, boolean> = {};
    students.forEach((student) => {
      allAbsent[student.id] = false;
    });
    setAttendance(allAbsent);
  };

  const saveAttendance = async () => {
    if (!selectedSlot) return;

    setSaving(true);
    try {
      const response = await fetch("/api/attendance/timetable", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          slotId: selectedSlot.id,
          date: selectedDate,
          attendance: students.map((student) => ({
            studentId: student.id,
            present: attendance[student.id] ?? true,
          })),
        }),
      });

      if (response.ok) {
        router.refresh();
        alert("Attendance saved successfully!");
      } else {
        const error = await response.json();
        alert(`Error saving attendance: ${error.error}`);
      }
    } catch (error) {
      console.error("Error saving attendance:", error);
      alert("Error saving attendance. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const getCurrentDayName = () => {
    const today = new Date(selectedDate);
    return today.toLocaleDateString("en-US", { weekday: "long" }).toUpperCase();
  };

  const currentDay = getCurrentDayName();
  const validSchoolDays = [
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
  ];
  const isSchoolDay = validSchoolDays.includes(currentDay);

  const currentSlotsForToday = currentSlots.filter(
    (slot) => slot.day === currentDay && !slot.isBreak
  );

  const presentCount = Object.values(attendance).filter(Boolean).length;
  const absentCount = students.length - presentCount;

  return (
    <div className="space-y-6">
      {/* Slot Selection */}
      <div className="bg-blue-50 border border-blue-200 p-4 rounded-md">
        <h3 className="text-lg font-semibold text-blue-800 mb-3">
          Select Time Slot - {new Date(selectedDate).toLocaleDateString()}
        </h3>

        {!isSchoolDay ? (
          <div className="text-blue-700">
            <p className="font-medium">No school activities on {currentDay}</p>
            <p className="text-sm mt-1">
              School timetables are only available for weekdays (Monday to
              Friday).
            </p>
          </div>
        ) : currentSlotsForToday.length === 0 ? (
          <div className="text-blue-700">
            <p>No scheduled classes for today ({currentDay}).</p>
            <p className="text-sm mt-1">
              Check the timetable or select a different date.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <select
              value={selectedSlot?.id || ""}
              onChange={(e) => handleSlotChange(e.target.value)}
              className="w-full p-3 border border-blue-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select a time slot</option>
              {currentSlotsForToday.map((slot) => (
                <option key={slot.id} value={slot.id}>
                  Period {slot.period} ({slot.startTime} - {slot.endTime}) -{" "}
                  {slot.subject?.name} -{" "}
                  {formatClassDisplay(
                    slot.timetable.class.name,
                    slot.timetable.class.grade.level
                  )}
                </option>
              ))}
            </select>

            {selectedSlot && (
              <div className="bg-white p-3 rounded border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-gray-800">
                      {selectedSlot.subject?.name}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {formatClassDisplay(
                        selectedSlot.timetable.class.name,
                        selectedSlot.timetable.class.grade.level
                      )}{" "}
                      • Period {selectedSlot.period}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-700">
                      {selectedSlot.startTime} - {selectedSlot.endTime}
                    </p>
                    <p className="text-xs text-gray-500">{currentDay}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {selectedSlot && students.length > 0 && (
        <div className="bg-white p-6 rounded-md border">
          {/* Stats and Actions */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {presentCount}
                </div>
                <div className="text-sm text-gray-500">Present</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {absentCount}
                </div>
                <div className="text-sm text-gray-500">Absent</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {students.length}
                </div>
                <div className="text-sm text-gray-500">Total</div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={markAllPresent}
                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 text-sm"
              >
                Mark All Present
              </button>
              <button
                type="button"
                onClick={markAllAbsent}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 text-sm"
              >
                Mark All Absent
              </button>
            </div>
          </div>

          {/* Student List */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {students.map((student) => (
              <div
                key={student.id}
                className={`flex items-center justify-between p-3 rounded-md border-2 transition-colors ${
                  attendance[student.id]
                    ? "border-green-200 bg-green-50"
                    : "border-red-200 bg-red-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                    {student.img ? (
                      <img
                        src={student.img}
                        alt={`${student.name} ${student.surname}`}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-sm font-medium text-gray-600">
                        {student.name.charAt(0)}
                        {student.surname.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">
                      {student.name} {student.surname}
                    </div>
                    <div className="text-sm text-gray-500">
                      ID: {student.id}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-sm font-medium ${
                      attendance[student.id] ? "text-green-700" : "text-red-700"
                    }`}
                  >
                    {attendance[student.id] ? "Present" : "Absent"}
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleAttendance(student.id)}
                    className={`w-12 h-6 rounded-full transition-colors relative ${
                      attendance[student.id] ? "bg-green-500" : "bg-red-500"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 bg-white rounded-full transition-transform absolute top-0.5 ${
                        attendance[student.id]
                          ? "translate-x-6"
                          : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Save Button */}
          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={saveAttendance}
              disabled={saving}
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 font-medium"
            >
              {saving ? "Saving..." : "Save Attendance"}
            </button>
          </div>
        </div>
      )}

      {selectedSlot && students.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-md text-center">
          <p className="text-yellow-800">
            No students found for this class. Please check the class enrollment.
          </p>
        </div>
      )}
    </div>
  );
};

export default TimetableBasedAttendance;
