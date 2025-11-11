"use client";

/**
 * Timetable Edit Page
 * 
 * Admin can manually edit generated timetables
 * - Add/Remove/Update slots
 * - Change subjects and teachers
 * - Save changes to database
 * 
 * Full CRUD operations for timetable management
 */

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import toast from "react-hot-toast";
import { SCHOOL_DAYS, PERIODS } from "@/lib/schoolTimetableConfig";

interface Subject {
  id: number;
  name: string;
  code: string | null;
  teachers: Teacher[];
}

interface Teacher {
  id: string;
  name: string;
  surname: string;
}

interface TimetableSlot {
  id?: string;
  day: string;
  period: number;
  startTime: string;
  endTime: string;
  slotType: string;
  subjectId: number | null;
  teacherId: string | null;
  roomNumber: string | null;
  notes: string | null;
  subject?: {
    id: number;
    name: string;
  };
  teacher?: {
    id: string;
    name: string;
    surname: string;
  };
}

interface Timetable {
  id: string;
  classId: number;
  academicYear: string;
  term: string | null;
  isActive: boolean;
  class: {
    id: number;
    name: string;
    grade: {
      level: number;
    };
  };
  slots: TimetableSlot[];
}

export default function TimetableEditPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const timetableId = searchParams.get("id");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [timetable, setTimetable] = useState<Timetable | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [editingSlot, setEditingSlot] = useState<{ day: string; period: number } | null>(null);
  const [slotData, setSlotData] = useState<Partial<TimetableSlot>>({});

  useEffect(() => {
    if (timetableId) {
      loadTimetable();
      loadSubjects();
    }
  }, [timetableId]);

  /**
   * Load timetable data from API
   */
  const loadTimetable = async () => {
    try {
      const response = await fetch(`/api/timetable/${timetableId}`);
      
      if (!response.ok) {
        throw new Error("Failed to load timetable");
      }

      const data = await response.json();
      setTimetable(data.timetable);
    } catch (error) {
      console.error("Error loading timetable:", error);
      toast.error("Failed to load timetable");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Load available subjects with teachers
   */
  const loadSubjects = async () => {
    try {
      const response = await fetch("/api/subjects?includeTeachers=true");
      
      if (response.ok) {
        const data = await response.json();
        setSubjects(data);
      }
    } catch (error) {
      console.error("Error loading subjects:", error);
    }
  };

  /**
   * Get slot for specific day and period
   */
  const getSlot = (day: string, period: number): TimetableSlot | null => {
    return timetable?.slots.find((s) => s.day === day && s.period === period) || null;
  };

  /**
   * Open edit dialog for a slot
   */
  const openEditDialog = (day: string, period: number) => {
    const existingSlot = getSlot(day, period);
    const periodTime = PERIODS.find((p) => p.period === period);

    if (existingSlot) {
      setSlotData(existingSlot);
    } else {
      // Create new slot
      setSlotData({
        day,
        period,
        startTime: periodTime?.startTime || "07:30",
        endTime: periodTime?.endTime || "08:15",
        slotType: "REGULAR",
        subjectId: null,
        teacherId: null,
        roomNumber: null,
        notes: null,
      });
    }
    
    setEditingSlot({ day, period });
  };

  /**
   * Save slot changes
   */
  const saveSlot = () => {
    if (!timetable || !editingSlot) return;

    const updatedSlots = [...timetable.slots];
    const existingIndex = updatedSlots.findIndex(
      (s) => s.day === editingSlot.day && s.period === editingSlot.period
    );

    if (existingIndex >= 0) {
      // Update existing slot
      updatedSlots[existingIndex] = {
        ...updatedSlots[existingIndex],
        ...slotData,
      } as TimetableSlot;
    } else {
      // Add new slot
      updatedSlots.push(slotData as TimetableSlot);
    }

    setTimetable({
      ...timetable,
      slots: updatedSlots,
    });

    setEditingSlot(null);
    setSlotData({});
    toast.success("Slot updated (not saved yet)");
  };

  /**
   * Delete a slot
   */
  const deleteSlot = (day: string, period: number) => {
    if (!timetable) return;

    if (confirm("Delete this slot?")) {
      const updatedSlots = timetable.slots.filter(
        (s) => !(s.day === day && s.period === period)
      );

      setTimetable({
        ...timetable,
        slots: updatedSlots,
      });

      toast.success("Slot deleted (not saved yet)");
    }
  };

  /**
   * Save all changes to database
   */
  const saveTimetable = async () => {
    if (!timetable) return;

    setSaving(true);
    try {
      toast.loading("Saving timetable...", { id: "save" });

      const response = await fetch(`/api/timetable/${timetableId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          academicYear: timetable.academicYear,
          term: timetable.term,
          isActive: timetable.isActive,
          slots: timetable.slots.map((slot) => ({
            day: slot.day,
            period: slot.period,
            startTime: slot.startTime,
            endTime: slot.endTime,
            slotType: slot.slotType,
            subjectId: slot.subjectId,
            teacherId: slot.teacherId,
            roomNumber: slot.roomNumber,
            notes: slot.notes,
          })),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save");
      }

      toast.success("✅ Timetable saved successfully!", { id: "save" });
      
      setTimeout(() => {
        router.push("/admin/timetable");
        router.refresh();
      }, 1500);
    } catch (error) {
      console.error("Error saving:", error);
      toast.error(error instanceof Error ? error.message : "Failed to save timetable", {
        id: "save",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading timetable...</p>
        </div>
      </div>
    );
  }

  if (!timetable) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h3 className="text-lg font-semibold text-red-900 mb-2">Timetable Not Found</h3>
          <p className="text-red-700 mb-4">The requested timetable could not be loaded.</p>
          <button
            onClick={() => router.push("/admin/timetable")}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Back to Timetables
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Timetable</h1>
            <p className="text-sm text-gray-600 mt-1">
              {timetable.class.name} • Grade {timetable.class.grade.level} • {timetable.academicYear}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => router.push("/admin/timetable")}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={saveTimetable}
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Image src="/update.png" alt="Save" width={16} height={16} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Instructions:</strong> Click on any cell to edit or add a period. Changes are not saved until you click "Save Changes".
        </p>
      </div>

      {/* Timetable Grid */}
      <div className="bg-white rounded-lg shadow-sm border overflow-x-auto">
        <table className="w-full min-w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b">
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Period</th>
              {SCHOOL_DAYS.map((day) => (
                <th key={day} className="px-4 py-3 text-center font-semibold text-gray-700">
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((period) => (
              <tr key={period} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-700 bg-gray-50">
                  <div className="text-sm">P{period}</div>
                  <div className="text-xs text-gray-500">
                    {PERIODS.find((p) => p.period === period)?.startTime || ""}
                  </div>
                </td>
                {SCHOOL_DAYS.map((day) => {
                  const slot = getSlot(day, period);
                  return (
                    <td key={`${day}-${period}`} className="px-2 py-2">
                      {slot ? (
                        <div className="relative group">
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 cursor-pointer hover:shadow-md transition-shadow">
                            <div className="font-semibold text-sm text-blue-900">
                              {slot.subject?.name || "No Subject"}
                            </div>
                            {slot.teacher && (
                              <div className="text-xs text-blue-700 mt-1">
                                {slot.teacher.name} {slot.teacher.surname}
                              </div>
                            )}
                          </div>
                          <div className="absolute top-1 right-1 hidden group-hover:flex gap-1">
                            <button
                              onClick={() => openEditDialog(day, period)}
                              className="p-1 bg-white rounded shadow-sm hover:bg-blue-100"
                              title="Edit"
                            >
                              <Image src="/update.png" alt="Edit" width={14} height={14} />
                            </button>
                            <button
                              onClick={() => deleteSlot(day, period)}
                              className="p-1 bg-white rounded shadow-sm hover:bg-red-100"
                              title="Delete"
                            >
                              <Image src="/delete.png" alt="Delete" width={14} height={14} />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => openEditDialog(day, period)}
                          className="w-full h-full min-h-[60px] border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors flex items-center justify-center"
                        >
                          <span className="text-gray-400 text-xs">+ Add</span>
                        </button>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Dialog */}
      {editingSlot && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Edit Slot - {editingSlot.day} Period {editingSlot.period}
            </h3>

            <div className="space-y-4">
              {/* Subject Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <select
                  value={slotData.subjectId || ""}
                  onChange={(e) => {
                    const subjectId = e.target.value ? parseInt(e.target.value) : null;
                    setSlotData({ ...slotData, subjectId, teacherId: null });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Subject</option>
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Teacher Selection */}
              {slotData.subjectId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Teacher</label>
                  <select
                    value={slotData.teacherId || ""}
                    onChange={(e) => setSlotData({ ...slotData, teacherId: e.target.value || null })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Teacher</option>
                    {subjects
                      .find((s) => s.id === slotData.subjectId)
                      ?.teachers.map((teacher) => (
                        <option key={teacher.id} value={teacher.id}>
                          {teacher.name} {teacher.surname}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              {/* Room Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Room Number (Optional)</label>
                <input
                  type="text"
                  value={slotData.roomNumber || ""}
                  onChange={(e) => setSlotData({ ...slotData, roomNumber: e.target.value || null })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Lab 1, Room 203"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                <textarea
                  value={slotData.notes || ""}
                  onChange={(e) => setSlotData({ ...slotData, notes: e.target.value || null })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={2}
                  placeholder="Any additional notes..."
                />
              </div>
            </div>

            {/* Dialog Actions */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setEditingSlot(null);
                  setSlotData({});
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={saveSlot}
                disabled={!slotData.subjectId}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save Slot
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
