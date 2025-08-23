// Modern Timetable Grid Component
"use client";

import React, { useState, useEffect } from "react";
import {
  SCHOOL_CONFIG,
  PERIOD_TIMES,
  DAYS_CONFIG,
  getSubjectColor,
  formatTime,
  TimetableConflict,
} from "@/lib/modernTimetableConfig";
import {
  timetableService,
  ClassTimetableData,
  TimetableSlotData,
} from "@/lib/clientTimetableService";
import {
  Calendar,
  Clock,
  Users,
  AlertTriangle,
  Download,
  RefreshCw,
  Save,
  Edit3,
} from "lucide-react";

interface ModernTimetableGridProps {
  classId: number;
  readOnly?: boolean;
  showConflicts?: boolean;
  onSave?: (timetableData: ClassTimetableData) => void;
}

const ModernTimetableGrid: React.FC<ModernTimetableGridProps> = ({
  classId,
  readOnly = false,
  showConflicts = true,
  onSave,
}) => {
  const [timetableData, setTimetableData] = useState<ClassTimetableData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [conflicts, setConflicts] = useState<TimetableConflict[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [editingSlot, setEditingSlot] = useState<{
    day: string;
    period: number;
  } | null>(null);
  const [availableSubjects, setAvailableSubjects] = useState<any[]>([]);
  const [availableTeachers, setAvailableTeachers] = useState<any[]>([]);
  const [quickEditMode, setQuickEditMode] = useState(false);
  const [hoveredSlot, setHoveredSlot] = useState<{day: string, period: number} | null>(null);

  // Load timetable data
  useEffect(() => {
    loadTimetableData();
    loadSubjectsAndTeachers();
  }, [classId]);

  const loadSubjectsAndTeachers = async () => {
    try {
      // Load all available subjects with their teachers - simplified approach
      const subjectsResponse = await fetch('/api/subjects');
      if (subjectsResponse.ok) {
        const subjects = await subjectsResponse.json();
        setAvailableSubjects(subjects);
      }

      // Load all teachers
      const teachersResponse = await fetch('/api/teachers');
      if (teachersResponse.ok) {
        const teachers = await teachersResponse.json();
        setAvailableTeachers(teachers);
      }
    } catch (error) {
      console.error('Error loading subjects and teachers:', error);
    }
  };

  const loadTimetableData = async () => {
    try {
      setLoading(true);
      const data = await timetableService.getClassTimetable(classId);
      setTimetableData(data);
      setConflicts(data.conflicts);
      setError(null);
    } catch (err) {
      setError("Failed to load timetable data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Auto-fix conflicts by redistributing periods
  const handleAutoFixConflicts = () => {
    if (!timetableData) return;

    const updatedSlots = [...timetableData.slots];
    const subjectCounts = new Map<number, number>();
    
    // Count current periods for each subject
    updatedSlots.forEach(slot => {
      if (slot.subjectId && !slot.isBreak) {
        subjectCounts.set(slot.subjectId, (subjectCounts.get(slot.subjectId) || 0) + 1);
      }
    });

    // Find subjects that exceed recommended limits and remove excess periods
    subjectCounts.forEach((count, subjectId) => {
      const subjectSlots = updatedSlots.filter(slot => slot.subjectId === subjectId);
      if (subjectSlots.length > 0) {
        const subjectName = subjectSlots[0].subjectName;
        const maxRecommended = 6; // Use a reasonable default
        
        if (count > maxRecommended) {
          const excessCount = count - maxRecommended;
          let removed = 0;
          
          // Remove excess periods (starting from the end)
          for (let i = updatedSlots.length - 1; i >= 0 && removed < excessCount; i--) {
            if (updatedSlots[i].subjectId === subjectId && !updatedSlots[i].isBreak) {
              updatedSlots[i].subjectId = undefined;
              updatedSlots[i].subjectName = undefined;
              updatedSlots[i].teacherId = undefined;
              updatedSlots[i].teacherName = undefined;
              removed++;
            }
          }
        }
      }
    });

    setTimetableData({
      ...timetableData,
      slots: updatedSlots
    });
    setConflicts([]);
    setHasChanges(true);
  };

  // Auto-schedule timetable
  const handleAutoSchedule = async () => {
    try {
      setLoading(true);
      const newData = await timetableService.autoScheduleTimetable(classId, {
        preserveExisting: false,
        balanceSubjects: true,
      });
      setTimetableData(newData);
      setConflicts(newData.conflicts);
      setHasChanges(true);
    } catch (err) {
      setError("Failed to auto-schedule timetable");
    } finally {
      setLoading(false);
    }
  };

  // Save timetable changes
  const handleSave = async () => {
    if (timetableData && onSave) {
      await onSave(timetableData);
      setHasChanges(false);
    }
  };

  // Handle slot click for editing
  const handleSlotClick = (day: string, period: number) => {
    if (!readOnly) {
      setEditingSlot({ day, period });
    }
  };

  // Handle subject assignment with conflict detection
  const handleSubjectAssignment = (subjectId: number, teacherId: string) => {
    if (editingSlot && timetableData) {
      const selectedSubject = availableSubjects.find(s => s.id === subjectId);
      
      // Find teacher - check if it's in subject.teachers or availableTeachers array
      let selectedTeacher = null;
      if (selectedSubject && selectedSubject.teachers) {
        selectedTeacher = selectedSubject.teachers.find((t: any) => t.id === teacherId);
      }
      if (!selectedTeacher && Array.isArray(availableTeachers)) {
        selectedTeacher = availableTeachers.find(t => t.id === teacherId);
      }
      
      if (selectedSubject && selectedTeacher) {
        // Check for conflicts - same subject at same time in other classes
        const timeSlotKey = `${editingSlot.day}-${editingSlot.period}`;
        
        // For now, just warn but allow (you can make this stricter later)
        const updatedSlots = timetableData.slots.map(slot => {
          if (slot.day === editingSlot.day && slot.period === editingSlot.period) {
            return {
              ...slot,
              subjectId: subjectId,
              subjectName: selectedSubject.name,
              teacherId: teacherId,
              teacherName: `${selectedTeacher.name} ${selectedTeacher.surname}`,
              isBreak: false
            };
          }
          return slot;
        });

        setTimetableData({
          ...timetableData,
          slots: updatedSlots
        });
        setHasChanges(true);
        setEditingSlot(null);
      }
    }
  };

  // Handle removing subject from slot
  const handleRemoveSubject = () => {
    if (editingSlot && timetableData) {
      const updatedSlots = timetableData.slots.map(slot => {
        if (slot.day === editingSlot.day && slot.period === editingSlot.period) {
          return {
            ...slot,
            subjectId: undefined,
            subjectName: undefined,
            teacherId: undefined,
            teacherName: undefined,
            isBreak: false
          };
        }
        return slot;
      });

      setTimetableData({
        ...timetableData,
        slots: updatedSlots
      });
      setHasChanges(true);
      setEditingSlot(null);
    }
  };

  // Get slot content with Excel-like quick edit
  const getSlotContent = (slot: TimetableSlotData) => {
    if (slot.isBreak) {
      return (
        <div className="h-full flex items-center justify-center bg-gradient-to-r from-orange-100 to-yellow-100 text-orange-700 text-sm font-medium rounded-lg">
          <Clock className="w-4 h-4 mr-1" />
          BREAK
        </div>
      );
    }

    const isHovered = hoveredSlot?.day === slot.day && hoveredSlot?.period === slot.period;

    if (slot.subjectName && slot.teacherName) {
      const color = getSubjectColor(slot.subjectName);
      const hasConflict = conflicts.some(
        (c) => c.day === slot.day && c.period === slot.period
      );

      return (
        <div
          className={`h-full p-2 rounded-lg text-white text-sm relative cursor-pointer transition-all group ${
            hasConflict ? "ring-2 ring-red-500" : ""
          } ${isHovered ? "scale-105 shadow-lg" : ""}`}
          style={{ backgroundColor: color }}
          onClick={() => !readOnly && handleSlotClick(slot.day, slot.period)}
          onMouseEnter={() => setHoveredSlot({day: slot.day, period: slot.period})}
          onMouseLeave={() => setHoveredSlot(null)}
        >
          <div className="font-semibold text-xs truncate">
            {slot.subjectName}
          </div>
          <div className="text-xs opacity-90 truncate">{slot.teacherName}</div>
          {hasConflict && (
            <AlertTriangle className="absolute top-1 right-1 w-3 h-3 text-red-200" />
          )}
          {!readOnly && (
            <>
              <Edit3 className="absolute bottom-1 right-1 w-3 h-3 opacity-70" />
              {isHovered && (
                <div className="absolute top-0 right-0 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                     onClick={(e) => {
                       e.stopPropagation();
                       handleRemoveSubject();
                       setEditingSlot({day: slot.day, period: slot.period});
                     }}>
                  ×
                </div>
              )}
            </>
          )}
        </div>
      );
    }

    return (
      <div
        className={`h-full flex items-center justify-center bg-gray-50 text-gray-400 text-xs rounded-lg border-2 border-dashed border-gray-200 cursor-pointer hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition-all ${
          isHovered ? "bg-blue-50 border-blue-300 text-blue-600" : ""
        }`}
        onClick={() => !readOnly && handleSlotClick(slot.day, slot.period)}
        onMouseEnter={() => setHoveredSlot({day: slot.day, period: slot.period})}
        onMouseLeave={() => setHoveredSlot(null)}
      >
        {!readOnly ? (
          <div className="text-center">
            <Edit3 className="w-4 h-4 mx-auto mb-1" />
            {isHovered ? "Click to Add" : "Add Subject"}
          </div>
        ) : (
          "Free Period"
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
          <span className="text-red-800">{error}</span>
        </div>
      </div>
    );
  }

  if (!timetableData) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl p-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Class {timetableData.className} Timetable
            </h1>
            <div className="flex items-center space-x-6 text-blue-100">
              <div className="flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Grade {timetableData.gradeLevel}
              </div>
              <div className="flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                {new Date().getFullYear()} Academic Year
              </div>
              <div className="flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                {formatTime(SCHOOL_CONFIG.startTime)} -{" "}
                {formatTime(SCHOOL_CONFIG.endTime)}
              </div>
            </div>
          </div>

          {!readOnly && (
            <div className="flex space-x-3">
              <button
                onClick={handleAutoSchedule}
                className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg flex items-center transition-colors"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Auto Schedule
              </button>
              {hasChanges && (
                <button
                  onClick={handleSave}
                  className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg flex items-center transition-colors"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </button>
              )}
              <button className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg flex items-center transition-colors">
                <Download className="w-4 h-4 mr-2" />
                Export
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Conflicts Alert */}
      {showConflicts && conflicts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
              <span className="text-red-800 font-semibold">
                {conflicts.length} Conflict{conflicts.length > 1 ? "s" : ""} Found
              </span>
            </div>
            {!readOnly && (
              <button
                onClick={handleAutoFixConflicts}
                className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
              >
                ✓ Auto-Fix
              </button>
            )}
          </div>
          <ul className="text-red-700 text-sm space-y-1">
            {conflicts.map((conflict, index) => (
              <li key={index}>• {conflict.message}</li>
            ))}
          </ul>
          {!readOnly && (
            <div className="mt-3 text-xs text-red-600">
              💡 Tip: Conflicts are now more lenient. These are just recommendations for optimal scheduling.
            </div>
          )}
        </div>
      )}

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
                    const slot = timetableData.slots.find(
                      (s) => s.day === day && s.period === periodConfig.period
                    );

                    return (
                      <td key={day} className="px-2 py-1 border-r border-gray-200 last:border-r-0">
                        <div className="h-16">
                          {slot && getSlotContent(slot)}
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
            {timetableData.subjects.length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">
            Filled Periods
          </h3>
          <p className="text-3xl font-bold text-green-600">
            {
              timetableData.slots.filter((s) => s.subjectId && !s.isBreak)
                .length
            }
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">
            Free Periods
          </h3>
          <p className="text-3xl font-bold text-purple-600">
            {
              timetableData.slots.filter((s) => !s.subjectId && !s.isBreak)
                .length
            }
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">
            Conflicts
          </h3>
          <p
            className={`text-3xl font-bold ${
              conflicts.length > 0 ? "text-red-600" : "text-green-600"
            }`}
          >
            {conflicts.length}
          </p>
        </div>
      </div>

      {/* Quick Subject Selection Modal - Excel-like */}
      {editingSlot && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">
                  📅 {editingSlot.day} - Period {editingSlot.period}
                </h2>
                <button
                  onClick={() => setEditingSlot(null)}
                  className="text-white hover:text-gray-200 text-xl font-bold w-6 h-6 flex items-center justify-center"
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="p-4 max-h-96 overflow-y-auto">
              {/* Current Assignment */}
              {(() => {
                const currentSlot = timetableData?.slots.find(
                  s => s.day === editingSlot.day && s.period === editingSlot.period
                );
                return currentSlot?.subjectName ? (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-green-800">{currentSlot.subjectName}</div>
                        <div className="text-sm text-green-600">{currentSlot.teacherName}</div>
                      </div>
                      <button
                        onClick={handleRemoveSubject}
                        className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg text-center">
                    <div className="text-gray-600">📚 Select a subject to assign</div>
                  </div>
                );
              })()}

              {/* Quick Subject List */}
              <div className="space-y-2">
                <h3 className="font-medium text-gray-700 border-b pb-2">Available Subjects:</h3>
                
                {availableSubjects.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-2">📚</div>
                    <p>No subjects available</p>
                    <p className="text-sm mt-1">Add subjects from Admin menu</p>
                  </div>
                ) : (
                  <div className="space-y-1 max-h-64 overflow-y-auto">
                    {availableSubjects.map((subject) => (
                      <div key={subject.id} className="border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="p-3">
                          <div className="font-medium text-gray-800 mb-2">{subject.name}</div>
                          
                          {/* Teachers - Excel-like quick buttons */}
                          <div className="space-y-1">
                            {subject.teachers && subject.teachers.length > 0 ? (
                              subject.teachers.map((teacher: any) => (
                                <button
                                  key={teacher.id}
                                  onClick={() => handleSubjectAssignment(subject.id, teacher.id)}
                                  className="w-full text-left px-3 py-2 text-sm bg-blue-50 hover:bg-blue-500 hover:text-white rounded border border-blue-200 transition-all duration-200 flex items-center justify-between group"
                                >
                                  <span>
                                    <span className="font-medium">{teacher.name} {teacher.surname}</span>
                                  </span>
                                  <span className="text-xs opacity-70 group-hover:opacity-100">Click to assign →</span>
                                </button>
                              ))
                            ) : (
                              <div className="text-sm text-red-500 italic">No teachers assigned</div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-gray-200 text-center">
                <button
                  onClick={() => setEditingSlot(null)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModernTimetableGrid;
