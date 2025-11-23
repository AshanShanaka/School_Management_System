"use client";

import React from "react";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";

type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE";

interface Student {
  id: string;
  name: string;
  surname: string;
  img: string | null;
  status: AttendanceStatus;
  notes: string;
  attendanceId?: number | null;
}

interface ClassInfo {
  id: number;
  name: string;
  grade: {
    id: number;
    level: number;
  };
  classTeacher?: {
    id: string;
    name: string;
    surname: string;
  } | null;
}

function TeacherAttendancePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlDate = searchParams.get("date");
  
  const [date, setDate] = useState(urlDate || new Date().toISOString().split("T")[0]);
  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const [hasExistingAttendance, setHasExistingAttendance] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  const loadAttendance = async () => {
    try {
      setLoading(true);
      
      // Simplified: Let the API determine the teacher's class
      const response = await fetch(`/api/daily-attendance/teacher?date=${date}`);
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 403) {
          alert(data.error || "You are not assigned as a class teacher");
          router.push("/teacher");
          return;
        }
        throw new Error(data.error || "Failed to load attendance");
      }

      setClassInfo(data.class);
      setStudents(data.students.map((s: any) => ({
        id: s.id,
        name: s.name,
        surname: s.surname,
        img: s.img,
        status: s.status || "PRESENT",
        notes: s.notes || "",
        attendanceId: s.attendanceId,
      })));
      setCanEdit(data.canEdit);
      setHasExistingAttendance(data.hasExistingAttendance);
      
      // If attendance already exists, show report view by default
      if (data.hasExistingAttendance) {
        setShowReport(true);
        setIsEditMode(false);
      } else {
        setShowReport(false);
        setIsEditMode(true);
      }
    } catch (error: any) {
      console.error("Error loading attendance:", error);
      alert(error.message || "Failed to load attendance data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttendance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  const updateStatus = (studentId: string, status: AttendanceStatus) => {
    setStudents(
      students.map((s) => (s.id === studentId ? { ...s, status } : s))
    );
  };

  const updateNotes = (studentId: string, notes: string) => {
    setStudents(students.map((s) => (s.id === studentId ? { ...s, notes } : s)));
  };

  const markAll = (status: AttendanceStatus) => {
    setStudents(students.map((s) => ({ ...s, status })));
  };

  const saveAttendance = async () => {
    if (!canEdit) {
      alert("You don't have permission to edit attendance for this class");
      return;
    }

    try {
      setSaving(true);
      const response = await fetch("/api/daily-attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId: classInfo?.id,
          date,
          attendance: students.map((s) => ({
            studentId: s.id,
            status: s.status,
            notes: s.notes,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save attendance");
      }

      // Show success and switch to report view
      setShowReport(true);
      setIsEditMode(false);
      setHasExistingAttendance(true);
      
      // Reload to get updated data
      await loadAttendance();
    } catch (error: any) {
      console.error("Error saving attendance:", error);
      alert(error.message || "Failed to save attendance");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-xl text-gray-600">Loading attendance...</p>
        </div>
      </div>
    );
  }

  if (!classInfo) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-red-500">No class assigned</div>
      </div>
    );
  }

  const stats = {
    present: students.filter((s) => s.status === "PRESENT").length,
    absent: students.filter((s) => s.status === "ABSENT").length,
    late: students.filter((s) => s.status === "LATE").length,
  };

  // Calendar helper functions
  const getDaysInMonth = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();
    
    const days = [];
    // Add empty slots for days before month starts
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }
    // Add actual days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };

  const changeMonth = (offset: number) => {
    const currentDate = new Date(date);
    currentDate.setMonth(currentDate.getMonth() + offset);
    setDate(currentDate.toISOString().split("T")[0]);
  };

  const selectDay = (day: number) => {
    const currentDate = new Date(date);
    currentDate.setDate(day);
    setDate(currentDate.toISOString().split("T")[0]);
    setShowCalendar(false);
  };

  const isToday = (day: number) => {
    const today = new Date();
    const currentDate = new Date(date);
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  const isSelectedDay = (day: number) => {
    const currentDate = new Date(date);
    return day === currentDate.getDate();
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-5 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 min-h-screen">
      {/* Page Header - Glass Style */}
      <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 p-5 md:p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 backdrop-blur-sm border border-blue-300/30 rounded-xl flex items-center justify-center text-2xl">
                📋
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Daily Attendance</h1>
                <p className="text-gray-600 text-xs mt-1">
                  Class {classInfo.name} • Grade {classInfo.grade.level} • {students.length} Students
                </p>
              </div>
            </div>
            {hasExistingAttendance && (
              <div className="inline-flex items-center gap-2 bg-green-500/10 backdrop-blur-sm border border-green-300/30 px-3 py-1.5 rounded-lg text-xs font-medium text-green-700">
                <span className="text-base">✓</span>
                <span>Attendance recorded for {new Date(date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</span>
              </div>
            )}
          </div>
          <button
            onClick={() => router.push("/teacher/attendance-reports")}
            className="px-5 py-2.5 bg-blue-500/10 backdrop-blur-sm border border-blue-300/30 text-blue-700 rounded-xl font-semibold hover:bg-blue-500/20 transition-all flex items-center gap-2"
          >
            <span className="text-lg">📊</span>
            View Reports
          </button>
        </div>
      </div>

      {/* Date Selector - Glass Style with Calendar */}
      <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <span className="text-xl">📅</span>
            Select Date
          </h2>
          <div className="text-xs text-gray-600 font-medium bg-gradient-to-r from-gray-500/10 to-blue-500/10 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-gray-300/30">
            {new Date(date).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </div>
        </div>
        
        {/* Date Input with Calendar Toggle */}
        <div className="relative">
          <div className="flex gap-2">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="flex-1 px-4 py-3 bg-white/50 backdrop-blur-sm border border-gray-300/50 rounded-xl text-sm focus:border-blue-400/50 focus:bg-white/70 focus:outline-none transition-all font-medium"
            />
            <button
              onClick={() => setShowCalendar(!showCalendar)}
              className="px-4 py-3 bg-blue-500/10 backdrop-blur-sm border border-blue-300/30 text-blue-700 rounded-xl hover:bg-blue-500/20 transition-all font-semibold"
            >
              <span className="text-xl">📅</span>
            </button>
          </div>

          {/* Mini Calendar Dropdown */}
          {showCalendar && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border-2 border-blue-200 p-4 z-50 animate-fadeIn">
              {/* Calendar Header */}
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => changeMonth(-1)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div className="text-center">
                  <div className="font-bold text-gray-800">
                    {new Date(date).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                  </div>
                </div>
                <button
                  onClick={() => changeMonth(1)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1">
                {/* Day Labels */}
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <div key={day} className="text-center text-xs font-semibold text-gray-600 py-2">
                    {day}
                  </div>
                ))}
                
                {/* Calendar Days */}
                {getDaysInMonth(date).map((day, index) => {
                  if (day === null) {
                    return <div key={`empty-${index}`} className="aspect-square"></div>;
                  }
                  
                  const isCurrentDay = isToday(day);
                  const isSelected = isSelectedDay(day);
                  
                  return (
                    <button
                      key={day}
                      onClick={() => selectDay(day)}
                      className={`
                        aspect-square flex items-center justify-center rounded-lg text-sm font-medium transition-all
                        ${isSelected 
                          ? "bg-blue-600 text-white shadow-md scale-105" 
                          : isCurrentDay
                          ? "bg-green-100 text-green-700 border-2 border-green-400"
                          : "hover:bg-gray-100 text-gray-700"
                        }
                      `}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>

              {/* Quick Actions */}
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => {
                    setDate(new Date().toISOString().split("T")[0]);
                    setShowCalendar(false);
                  }}
                  className="flex-1 px-3 py-2 bg-green-500/10 border border-green-300/30 text-green-700 rounded-lg hover:bg-green-500/20 transition-all text-sm font-semibold"
                >
                  Today
                </button>
                <button
                  onClick={() => setShowCalendar(false)}
                  className="flex-1 px-3 py-2 bg-gray-500/10 border border-gray-300/30 text-gray-700 rounded-lg hover:bg-gray-500/20 transition-all text-sm font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Statistics Cards - Glass Style */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/60 backdrop-blur-xl rounded-2xl shadow-lg border border-green-200/50 p-5 hover:shadow-xl transition-all">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-green-600 mb-1">Present</div>
              <div className="text-4xl font-bold text-green-700">{stats.present}</div>
              <div className="text-xs text-gray-500 mt-1">
                {((stats.present / students.length) * 100).toFixed(0)}% of class
              </div>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-green-300/30">
              <span className="text-3xl">✓</span>
            </div>
          </div>
        </div>

        <div className="bg-white/60 backdrop-blur-xl rounded-2xl shadow-lg border border-red-200/50 p-5 hover:shadow-xl transition-all">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-red-600 mb-1">Absent</div>
              <div className="text-4xl font-bold text-red-700">{stats.absent}</div>
              <div className="text-xs text-gray-500 mt-1">
                {((stats.absent / students.length) * 100).toFixed(0)}% of class
              </div>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-red-500/20 to-rose-500/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-red-300/30">
              <span className="text-3xl">✗</span>
            </div>
          </div>
        </div>

        <div className="bg-white/60 backdrop-blur-xl rounded-2xl shadow-lg border border-amber-200/50 p-5 hover:shadow-xl transition-all">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-amber-600 mb-1">Late</div>
              <div className="text-4xl font-bold text-amber-700">{stats.late}</div>
              <div className="text-xs text-gray-500 mt-1">
                {((stats.late / students.length) * 100).toFixed(0)}% of class
              </div>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-amber-500/20 to-orange-500/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-amber-300/30">
              <span className="text-3xl">⏰</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions - Glass Style */}
      {!showReport && isEditMode && (
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 p-5">
          <h3 className="text-base font-bold text-gray-800 mb-3 flex items-center gap-2">
            <span className="text-xl">⚡</span>
            Quick Actions
          </h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => markAll("PRESENT")}
              className="flex-1 min-w-[180px] px-5 py-3 bg-green-500/10 backdrop-blur-sm border border-green-300/30 text-green-700 rounded-xl hover:bg-green-500/20 transition-all font-semibold flex items-center justify-center gap-2"
            >
              <span className="text-xl">✓</span>
              <span>Mark All Present</span>
            </button>
            <button
              onClick={() => markAll("ABSENT")}
              className="flex-1 min-w-[180px] px-5 py-3 bg-red-500/10 backdrop-blur-sm border border-red-300/30 text-red-700 rounded-xl hover:bg-red-500/20 transition-all font-semibold flex items-center justify-center gap-2"
            >
              <span className="text-xl">✗</span>
              <span>Mark All Absent</span>
            </button>
            <button
              onClick={() => markAll("LATE")}
              className="flex-1 min-w-[180px] px-5 py-3 bg-amber-500/10 backdrop-blur-sm border border-amber-300/30 text-amber-700 rounded-xl hover:bg-amber-500/20 transition-all font-semibold flex items-center justify-center gap-2"
            >
              <span className="text-xl">⏰</span>
              <span>Mark All Late</span>
            </button>
          </div>
        </div>
      )}

      {/* Saved Attendance Report View */}
      {showReport && !isEditMode && (
        <div className="bg-gradient-to-br from-green-50/80 via-emerald-50/80 to-teal-50/80 backdrop-blur-xl rounded-2xl shadow-2xl border-2 border-green-300/50 p-6 md:p-8">
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <span className="text-4xl">✓</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
              Attendance Saved Successfully!
            </h2>
            <p className="text-gray-600 text-sm">
              {new Date(date).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 text-center border border-green-200/50 shadow-md">
              <div className="text-3xl font-bold text-green-600">{stats.present}</div>
              <div className="text-xs text-gray-600 mt-1">Present</div>
              <div className="text-xs text-gray-500 mt-1">
                {((stats.present / students.length) * 100).toFixed(0)}%
              </div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 text-center border border-red-200/50 shadow-md">
              <div className="text-3xl font-bold text-red-600">{stats.absent}</div>
              <div className="text-xs text-gray-600 mt-1">Absent</div>
              <div className="text-xs text-gray-500 mt-1">
                {((stats.absent / students.length) * 100).toFixed(0)}%
              </div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 text-center border border-amber-200/50 shadow-md">
              <div className="text-3xl font-bold text-amber-600">{stats.late}</div>
              <div className="text-xs text-gray-600 mt-1">Late</div>
              <div className="text-xs text-gray-500 mt-1">
                {((stats.late / students.length) * 100).toFixed(0)}%
              </div>
            </div>
          </div>

          {/* Detailed Report */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-5 border border-gray-200/50 shadow-md mb-6">
            <h3 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="text-xl">📋</span>
              Attendance Summary
            </h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {students.map((student, index) => (
                <div
                  key={student.id}
                  className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50/50 to-white/50 rounded-lg border border-gray-200/30"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="relative">
                      <Image
                        src={student.img || "/avatar.png"}
                        alt={student.name}
                        width={40}
                        height={40}
                        className="rounded-full border-2 border-white shadow-sm"
                      />
                      <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-gray-600 text-white rounded-full flex items-center justify-center text-[9px] font-bold border-2 border-white shadow-sm">
                        {index + 1}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 text-sm truncate">
                        {student.name} {student.surname}
                      </div>
                      {student.notes && (
                        <div className="text-xs text-gray-500 truncate">
                          Note: {student.notes}
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    {student.status === "PRESENT" && (
                      <span className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs font-semibold border border-green-300">
                        ✓ Present
                      </span>
                    )}
                    {student.status === "ABSENT" && (
                      <span className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-xs font-semibold border border-red-300">
                        ✗ Absent
                      </span>
                    )}
                    {student.status === "LATE" && (
                      <span className="px-3 py-1.5 bg-amber-100 text-amber-700 rounded-lg text-xs font-semibold border border-amber-300">
                        ⏰ Late
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => {
                setShowReport(false);
                setIsEditMode(true);
              }}
              className="flex-1 px-6 py-3 bg-white/80 backdrop-blur-sm border border-blue-300/50 text-blue-700 rounded-xl hover:bg-blue-50/80 hover:border-blue-400/50 transition-all font-semibold shadow-md hover:shadow-lg flex items-center justify-center gap-2"
            >
              <span className="text-lg">✏️</span>
              Edit Attendance
            </button>
            <button
              onClick={() => router.push("/teacher/attendance-reports")}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all font-bold shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              <span className="text-lg">📊</span>
              View All Reports
            </button>
          </div>
        </div>
      )}

      {/* Student List - Glass Style with Reduced Size (Edit Mode) */}
      {!showReport && isEditMode && (
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 p-5">
          <h3 className="text-base font-bold text-gray-800 mb-3 flex items-center gap-2">
            <span className="text-xl">👥</span>
            Student Attendance ({students.length} students)
          </h3>
          
          <div className="space-y-2">
          {students.map((student, index) => (
            <div
              key={student.id}
              className="group relative bg-white/50 backdrop-blur-sm border border-gray-200/50 rounded-xl p-3 hover:border-blue-300/50 hover:bg-white/70 hover:shadow-lg transition-all"
            >
              <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
                {/* Student Info - Reduced Size */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="relative">
                    <Image
                      src={student.img || "/avatar.png"}
                      alt={student.name}
                      width={44}
                      height={44}
                      className="rounded-full border-2 border-white/50 shadow-sm"
                    />
                    <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-gradient-to-br from-blue-500 to-indigo-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-white shadow-md">
                      {index + 1}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-gray-900 text-base truncate">
                      {student.name} {student.surname}
                    </div>
                    <div className="text-xs text-gray-500">ID: {student.id.slice(0, 8)}</div>
                  </div>
                </div>

                {/* Status Buttons - Reduced Size */}
                <div className="flex flex-wrap gap-1.5 w-full md:w-auto">
                  <button
                    onClick={() => updateStatus(student.id, "PRESENT")}
                    className={`flex-1 md:flex-initial px-4 py-2 rounded-lg font-semibold transition-all text-sm ${
                      student.status === "PRESENT"
                        ? "bg-green-500/20 backdrop-blur-sm border-2 border-green-500/50 text-green-700 shadow-md"
                        : "bg-white/50 backdrop-blur-sm text-gray-600 border border-gray-300/50 hover:border-green-400/50 hover:bg-green-500/10 hover:text-green-700"
                    }`}
                  >
                    <span className="text-base">✓</span> Present
                  </button>
                  <button
                    onClick={() => updateStatus(student.id, "ABSENT")}
                    className={`flex-1 md:flex-initial px-4 py-2 rounded-lg font-semibold transition-all text-sm ${
                      student.status === "ABSENT"
                        ? "bg-red-500/20 backdrop-blur-sm border-2 border-red-500/50 text-red-700 shadow-md"
                        : "bg-white/50 backdrop-blur-sm text-gray-600 border border-gray-300/50 hover:border-red-400/50 hover:bg-red-500/10 hover:text-red-700"
                    }`}
                  >
                    <span className="text-base">✗</span> Absent
                  </button>
                  <button
                    onClick={() => updateStatus(student.id, "LATE")}
                    className={`flex-1 md:flex-initial px-4 py-2 rounded-lg font-semibold transition-all text-sm ${
                      student.status === "LATE"
                        ? "bg-amber-500/20 backdrop-blur-sm border-2 border-amber-500/50 text-amber-700 shadow-md"
                        : "bg-white/50 backdrop-blur-sm text-gray-600 border border-gray-300/50 hover:border-amber-400/50 hover:bg-amber-500/10 hover:text-amber-700"
                    }`}
                  >
                    <span className="text-base">⏰</span> Late
                  </button>
                </div>

                {/* Notes Input - Reduced Size */}
                <div className="w-full md:w-56">
                  <input
                    type="text"
                    value={student.notes}
                    onChange={(e) => updateNotes(student.id, e.target.value)}
                    placeholder="Add notes (optional)"
                    className="w-full px-3 py-2 bg-white/50 backdrop-blur-sm border border-gray-300/50 rounded-lg text-xs focus:border-blue-400/50 focus:bg-white/70 focus:outline-none transition-all"
                  />
                </div>
              </div>
            </div>
          ))}
          </div>
        </div>
      )}

      {/* Action Buttons - Glass Style (Edit Mode) */}
      {!showReport && isEditMode && (
      <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 p-5">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-xs text-gray-700 bg-gradient-to-r from-gray-500/10 to-blue-500/10 backdrop-blur-sm px-4 py-2 rounded-lg border border-gray-300/30">
            <span className="font-semibold">Total:</span> {students.length} • 
            <span className="font-semibold ml-2">Present:</span> <span className="text-green-600 font-bold">{stats.present}</span> • 
            <span className="font-semibold ml-2">Absent:</span> <span className="text-red-600 font-bold">{stats.absent}</span> • 
            <span className="font-semibold ml-2">Late:</span> <span className="text-amber-600 font-bold">{stats.late}</span>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <button
              onClick={() => router.push("/teacher")}
              className="flex-1 md:flex-initial px-6 py-3 bg-white/50 backdrop-blur-sm border border-gray-300/50 rounded-xl hover:bg-white/70 hover:border-gray-400/50 transition-all font-semibold text-gray-700 shadow-sm hover:shadow-md"
            >
              Cancel
            </button>
            <button
              onClick={saveAttendance}
              disabled={saving || !canEdit}
              className="flex-1 md:flex-initial px-6 py-3 bg-gradient-to-r from-blue-500/90 to-indigo-600/90 backdrop-blur-sm border border-blue-400/30 text-white rounded-xl hover:from-blue-600/90 hover:to-indigo-700/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-bold shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              <span className="text-lg">💾</span>
              {saving ? "Saving..." : "Save Attendance"}
            </button>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}

export default TeacherAttendancePage;
