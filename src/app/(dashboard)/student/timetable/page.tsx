// Student Timetable View - Shows their class timetable
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { getTimeDisplay, getSubjectColor, SCHOOL_DAYS } from "@/lib/schoolTimetableConfig";

interface StudentTimetableData {
  student: {
    id: string;
    name: string;
    surname: string;
    class: {
      id: number;
      name: string;
      gradeLevel: number;
      classTeacher: {
        name: string;
        surname: string;
      } | null;
    };
  };
  timetable: {
    id: string;
    academicYear: string;
    term: string | null;
    slots: Array<{
      id: string;
      day: string;
      period: number;
      startTime: string;
      endTime: string;
      subject: {
        name: string;
        code: string | null;
      } | null;
      teacher: {
        name: string;
        surname: string;
      } | null;
      roomNumber: string | null;
    }>;
  } | null;
  message?: string;
}

export default function StudentTimetablePage() {
  const router = useRouter();
  const [data, setData] = useState<StudentTimetableData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  useEffect(() => {
    fetchStudentTimetable();
  }, []);

  const fetchStudentTimetable = async () => {
    try {
      // Get current user
      const userRes = await fetch("/api/auth/me");
      if (!userRes.ok) {
        router.push("/login");
        return;
      }

      const userData = await userRes.json();
      const studentId = userData.user.id;

      // Get student timetable
      const response = await fetch(`/api/timetable/student/${studentId}`);
      if (response.ok) {
        const timetableData = await response.json();
        setData(timetableData);
        
        // Set current day as default
        const today = new Date().toLocaleString('en-US', { weekday: 'long' }).toUpperCase();
        if (SCHOOL_DAYS.includes(today as any)) {
          setSelectedDay(today);
        } else {
          setSelectedDay(SCHOOL_DAYS[0]);
        }
      }
    } catch (error) {
      console.error("Error fetching student timetable:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your timetable...</p>
        </div>
      </div>
    );
  }

  if (!data || !data.timetable) {
    return (
      <div className="p-4">
        <div className="bg-white p-12 rounded-lg shadow-sm border text-center">
          <Image
            src="/calendar.png"
            alt="No timetable"
            width={64}
            height={64}
            className="mx-auto mb-4 opacity-50"
          />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Timetable Available</h3>
          <p className="text-gray-600">
            {data?.message || "Your class doesn't have a timetable yet."}
          </p>
        </div>
      </div>
    );
  }

  const { student, timetable } = data;

  // Organize slots into grid
  const grid: Record<string, Record<number, any>> = {};
  
  SCHOOL_DAYS.forEach((day) => {
    grid[day] = {};
    for (let period = 1; period <= 8; period++) {
      grid[day][period] = null;
    }
  });

  timetable.slots.forEach((slot) => {
    grid[slot.day][slot.period] = slot;
  });

  return (
    <div className="p-4 flex flex-col gap-6">
      {/* HEADER */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-6 rounded-lg shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
            <Image src="/student.png" alt="Student" width={24} height={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">My Class Timetable</h1>
            <p className="text-green-100">
              {student.name} {student.surname}
            </p>
          </div>
        </div>

        <div className="bg-white bg-opacity-10 rounded-lg p-4 border border-white border-opacity-20">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-green-100 text-xs">Class</div>
              <div className="font-semibold text-lg">{student.class.name}</div>
            </div>
            <div>
              <div className="text-green-100 text-xs">Grade</div>
              <div className="font-semibold text-lg">{student.class.gradeLevel}</div>
            </div>
            {student.class.classTeacher && (
              <div>
                <div className="text-green-100 text-xs">Class Teacher</div>
                <div className="font-semibold text-lg">
                  {student.class.classTeacher.name} {student.class.classTeacher.surname}
                </div>
              </div>
            )}
            <div>
              <div className="text-green-100 text-xs">Academic Year</div>
              <div className="font-semibold">{timetable.academicYear}</div>
            </div>
            {timetable.term && (
              <div>
                <div className="text-green-100 text-xs">Term</div>
                <div className="font-semibold">{timetable.term}</div>
              </div>
            )}
            <div>
              <div className="text-green-100 text-xs">Total Periods</div>
              <div className="font-semibold text-lg">{timetable.slots.length}</div>
            </div>
          </div>
        </div>
      </div>

      {/* DAY SELECTOR (Mobile friendly) */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <label className="block text-sm font-medium text-gray-700 mb-2 md:hidden">
          Select Day
        </label>
        <div className="flex flex-wrap gap-2">
          {SCHOOL_DAYS.map((day) => {
            const daySlots = timetable.slots.filter((s) => s.day === day);
            return (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`px-4 py-2 rounded-lg border transition-colors ${
                  selectedDay === day
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-700 border-gray-300 hover:border-blue-400"
                }`}
              >
                <div className="font-medium">{day.slice(0, 3)}</div>
                <div className="text-xs">{daySlots.length} periods</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* TIMETABLE GRID - Desktop View */}
      <div className="hidden md:block bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Weekly Schedule</h3>
          <p className="text-sm text-gray-600">
            {student.class.name} - Grade {student.class.gradeLevel}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-3 text-left font-semibold text-gray-700 min-w-[100px]">
                  Period
                </th>
                {SCHOOL_DAYS.map((day) => (
                  <th key={day} className="px-4 py-3 text-center font-semibold text-gray-700">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((period) => (
                <tr key={period} className="border-t">
                  <td className="px-4 py-3 font-medium text-gray-700 bg-gray-50">
                    <div>Period {period}</div>
                    <div className="text-xs text-gray-500">{getTimeDisplay(period)}</div>
                  </td>
                  {SCHOOL_DAYS.map((day) => {
                    const slot = grid[day][period];
                    return (
                      <td key={`${day}-${period}`} className="px-4 py-3">
                        {slot ? (
                          <div
                            className={`${getSubjectColor(
                              slot.subject?.name || ""
                            )} p-3 rounded border`}
                          >
                            <div className="font-medium text-sm">{slot.subject?.name}</div>
                            {slot.subject?.code && (
                              <div className="text-xs font-semibold mt-1">
                                {slot.subject.code}
                              </div>
                            )}
                            {slot.teacher && (
                              <div className="text-xs mt-1">
                                {slot.teacher.name} {slot.teacher.surname.charAt(0)}.
                              </div>
                            )}
                            {slot.roomNumber && (
                              <div className="text-xs mt-1">📍 {slot.roomNumber}</div>
                            )}
                          </div>
                        ) : (
                          <div className="text-center text-gray-300 py-4">—</div>
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

      {/* DAILY VIEW - Mobile */}
      {selectedDay && (
        <div className="md:hidden bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b">
            <h3 className="text-lg font-semibold text-gray-900">{selectedDay}</h3>
            <p className="text-sm text-gray-600">
              {timetable.slots.filter((s) => s.day === selectedDay).length} periods
            </p>
          </div>

          <div className="p-4 space-y-3">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((period) => {
              const slot = grid[selectedDay][period];
              return (
                <div key={period} className="border rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2 border-b flex justify-between items-center">
                    <div>
                      <div className="font-semibold text-gray-900">Period {period}</div>
                      <div className="text-xs text-gray-600">{getTimeDisplay(period)}</div>
                    </div>
                  </div>
                  <div className="p-4">
                    {slot ? (
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <div
                            className={`w-3 h-3 rounded-full ${
                              slot.subject?.name
                                ? getSubjectColor(slot.subject.name).split(" ")[0]
                                : "bg-gray-300"
                            }`}
                          ></div>
                          <div className="font-semibold text-gray-900 text-lg">
                            {slot.subject?.name}
                          </div>
                        </div>
                        {slot.teacher && (
                          <div className="text-sm text-gray-700 flex items-center gap-2 mb-1">
                            <span className="font-medium">Teacher:</span>
                            {slot.teacher.name} {slot.teacher.surname}
                          </div>
                        )}
                        {slot.roomNumber && (
                          <div className="text-sm text-gray-700 flex items-center gap-2">
                            <span className="font-medium">Room:</span>
                            {slot.roomNumber}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center text-gray-400 py-2">No class scheduled</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
