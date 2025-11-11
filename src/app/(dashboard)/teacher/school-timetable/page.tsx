// Teacher Timetable View - Shows classes they teach + "My Week" view
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { getTimeDisplay, getSubjectColor, SCHOOL_DAYS } from "@/lib/schoolTimetableConfig";

interface TeacherData {
  teacher: {
    id: string;
    name: string;
    surname: string;
    isClassTeacher: boolean;
    assignedClass: {
      id: number;
      name: string;
      grade: {
        level: number;
      };
    } | null;
  };
  timetables: Array<{
    classId: number;
    className: string;
    gradeLevel: number;
    timetableId: string;
    academicYear: string;
    isClassTeacher: boolean;
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
      roomNumber: string | null;
    }>;
  }>;
  weekView: Array<{
    day: string;
    slots: Array<{
      period: number;
      startTime: string;
      endTime: string;
      subject: string;
      class: string;
      gradeLevel: number;
      roomNumber: string | null;
    }>;
  }>;
  totalPeriods: number;
}

export default function TeacherTimetableViewPage() {
  const router = useRouter();
  const [teacherData, setTeacherData] = useState<TeacherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"classes" | "week">("classes");
  const [selectedClass, setSelectedClass] = useState<number | null>(null);

  useEffect(() => {
    fetchTeacherTimetable();
  }, []);

  const fetchTeacherTimetable = async () => {
    try {
      // Get current user
      const userRes = await fetch("/api/auth/me");
      if (!userRes.ok) {
        router.push("/login");
        return;
      }

      const userData = await userRes.json();
      const teacherId = userData.user.id;

      // Get teacher timetable
      const response = await fetch(`/api/timetable/teacher/${teacherId}`);
      if (response.ok) {
        const data = await response.json();
        setTeacherData(data);
        if (data.timetables.length > 0) {
          setSelectedClass(data.timetables[0].classId);
        }
      }
    } catch (error) {
      console.error("Error fetching teacher timetable:", error);
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

  if (!teacherData || teacherData.timetables.length === 0) {
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
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Timetable Found</h3>
          <p className="text-gray-600">
            You don't have any classes assigned yet. Please contact administration.
          </p>
        </div>
      </div>
    );
  }

  const { teacher, timetables, weekView, totalPeriods } = teacherData;

  return (
    <div className="p-4 flex flex-col gap-6">
      {/* HEADER */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-lg shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
            <Image src="/teacher.png" alt="Teacher" width={24} height={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">My Teaching Schedule</h1>
            <p className="text-blue-100">
              {teacher.name} {teacher.surname}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="bg-white bg-opacity-10 rounded-lg p-3">
            <div className="text-blue-100 text-xs">Total Classes</div>
            <div className="text-2xl font-bold">{timetables.length}</div>
          </div>
          <div className="bg-white bg-opacity-10 rounded-lg p-3">
            <div className="text-blue-100 text-xs">Total Periods</div>
            <div className="text-2xl font-bold">{totalPeriods}</div>
          </div>
          <div className="bg-white bg-opacity-10 rounded-lg p-3">
            <div className="text-blue-100 text-xs">Days Teaching</div>
            <div className="text-2xl font-bold">{weekView.length}</div>
          </div>
          <div className="bg-white bg-opacity-10 rounded-lg p-3">
            <div className="text-blue-100 text-xs">Role</div>
            <div className="text-lg font-bold">
              {teacher.isClassTeacher ? "Class Teacher" : "Subject Teacher"}
            </div>
          </div>
        </div>

        {teacher.isClassTeacher && teacher.assignedClass && (
          <div className="mt-4 bg-white bg-opacity-10 rounded-lg p-3 border border-white border-opacity-20">
            <div className="text-sm text-blue-100">Class Teacher of:</div>
            <div className="font-semibold text-lg">
              {teacher.assignedClass.name} - Grade {teacher.assignedClass.grade.level}
            </div>
          </div>
        )}
      </div>

      {/* VIEW MODE TOGGLE */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setViewMode("classes")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              viewMode === "classes"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            View by Class
          </button>
          <button
            onClick={() => setViewMode("week")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              viewMode === "week"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            My Week View
          </button>
        </div>
      </div>

      {/* CLASS VIEW */}
      {viewMode === "classes" && (
        <>
          {/* Class Selector */}
          {timetables.length > 1 && (
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Class
              </label>
              <div className="flex flex-wrap gap-2">
                {timetables.map((tt) => (
                  <button
                    key={tt.classId}
                    onClick={() => setSelectedClass(tt.classId)}
                    className={`px-4 py-2 rounded-lg border transition-colors ${
                      selectedClass === tt.classId
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-gray-700 border-gray-300 hover:border-blue-400"
                    }`}
                  >
                    {tt.className} {tt.isClassTeacher && "👑"}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Selected Class Timetable */}
          {selectedClass && (
            <ClassTimetableView
              timetable={timetables.find((t) => t.classId === selectedClass)!}
              teacherId={teacher.id}
            />
          )}
        </>
      )}

      {/* WEEK VIEW */}
      {viewMode === "week" && <WeekView weekView={weekView} />}
    </div>
  );
}

// Class Timetable View Component
function ClassTimetableView({
  timetable,
  teacherId,
}: {
  timetable: any;
  teacherId: string;
}) {
  // Organize slots into grid
  const grid: Record<string, Record<number, any>> = {};
  
  SCHOOL_DAYS.forEach((day) => {
    grid[day] = {};
    for (let period = 1; period <= 8; period++) {
      grid[day][period] = null;
    }
  });

  timetable.slots.forEach((slot: any) => {
    grid[slot.day][slot.period] = slot;
  });

  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      <div className="px-6 py-4 bg-gray-50 border-b">
        <h3 className="text-lg font-semibold text-gray-900">
          {timetable.className} - Grade {timetable.gradeLevel}
        </h3>
        <p className="text-sm text-gray-600">
          {timetable.academicYear} • {timetable.slots.length} periods •{" "}
          {timetable.isClassTeacher ? "You are the Class Teacher" : "Subject periods only"}
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full table-fixed border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-3 py-3 text-left font-semibold text-gray-700 w-24 border">
                Period
              </th>
              {SCHOOL_DAYS.map((day) => (
                <th key={day} className="px-2 py-3 text-center font-semibold text-gray-700 border">
                  <div className="text-sm">{day.slice(0, 3)}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((period) => (
              <tr key={period} className="border-t">
                <td className="px-3 py-3 font-medium text-gray-700 bg-gray-50 border align-top">
                  <div className="text-sm font-semibold">P{period}</div>
                  <div className="text-xs text-gray-500">{getTimeDisplay(period)}</div>
                </td>
                {SCHOOL_DAYS.map((day) => {
                  const slot = grid[day][period];
                  return (
                    <td key={`${day}-${period}`} className="px-2 py-2 border align-top h-24">
                      {slot ? (
                        <div
                          className={`${getSubjectColor(
                            slot.subject?.name || ""
                          )} p-2 rounded border h-full flex flex-col justify-center`}
                        >
                          <div className="font-semibold text-sm leading-tight">{slot.subject?.name}</div>
                          {slot.subject?.code && (
                            <div className="text-xs font-medium mt-1">
                              {slot.subject.code}
                            </div>
                          )}
                          {slot.roomNumber && (
                            <div className="text-xs mt-1">📍 {slot.roomNumber}</div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center text-gray-300 h-full flex items-center justify-center">—</div>
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
}

// Week View Component
function WeekView({ weekView }: { weekView: any[] }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      <div className="px-6 py-4 bg-gray-50 border-b">
        <h3 className="text-lg font-semibold text-gray-900">My Week at a Glance</h3>
        <p className="text-sm text-gray-600">All your teaching periods for the week</p>
      </div>

      <div className="p-6 space-y-4">
        {weekView.map((dayData) => (
          <div key={dayData.day} className="border rounded-lg overflow-hidden">
            <div className="bg-blue-50 px-4 py-2 border-b">
              <h4 className="font-semibold text-blue-900">{dayData.day}</h4>
              <p className="text-sm text-blue-700">{dayData.slots.length} periods</p>
            </div>
            <div className="p-4 space-y-2">
              {dayData.slots
                .sort((a: any, b: any) => a.period - b.period)
                .map((slot: any, index: number) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="font-semibold text-blue-600 min-w-[80px]">
                      Period {slot.period}
                    </div>
                    <div className="text-sm text-gray-600 min-w-[100px]">
                      {slot.startTime} - {slot.endTime}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{slot.subject}</div>
                      <div className="text-sm text-gray-600">
                        {slot.class} (Grade {slot.gradeLevel})
                      </div>
                    </div>
                    {slot.roomNumber && (
                      <div className="text-sm text-gray-600">📍 {slot.roomNumber}</div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
