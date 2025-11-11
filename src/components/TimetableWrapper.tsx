'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { SCHOOL_DAYS, PERIODS } from '@/lib/schoolTimetableConfig';

// Define the types
interface Subject {
  id: number;
  name: string;
  code?: string | null;
  teachers: Teacher[];
}

interface Teacher {
  id: string;
  name: string;
  surname: string;
  email?: string | null;
  phone?: string | null;
}

interface Class {
  id: number;
  name: string;
  capacity: number;
  grade: {
    id: number;
    level: number;
  };
}

interface TimetableWrapperProps {
  selectedClass: Class;
  subjects: Subject[];
}

interface TimetableSlot {
  day: string;
  period: number;
  startTime: string;
  endTime: string;
  subjectId?: number;
  subjectName?: string;
  subject?: {
    id: number;
    name: string;
  };
  teacherId?: string;
  teacherName?: string;
  teacher?: {
    id: string;
    name: string;
    surname: string;
  };
  slotType?: string;
  roomNumber?: string | null;
  notes?: string | null;
  isBreak: boolean;
}

interface GeneratedTimetable {
  success: boolean;
  timetable: any;
  slots: TimetableSlot[];
  stats: {
    totalSlots: number;
    subjectsScheduled: number;
    daysScheduled: number;
  };
  message: string;
}

const TimetableWrapper: React.FC<TimetableWrapperProps> = ({
  selectedClass,
  subjects
}) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generatedTimetable, setGeneratedTimetable] = useState<GeneratedTimetable | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [existingTimetable, setExistingTimetable] = useState<any>(null);
  const [editableSlots, setEditableSlots] = useState<TimetableSlot[]>([]);
  const [editingSlot, setEditingSlot] = useState<{ day: string; period: number } | null>(null);
  const [slotEditData, setSlotEditData] = useState<Partial<TimetableSlot>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];

  // Load existing timetable on component mount
  useEffect(() => {
    loadExistingTimetable();
  }, [selectedClass.id]);

  /**
   * Load existing timetable for the selected class
   * Ensures persistence after page reload
   */
  const loadExistingTimetable = async () => {
    setLoadingExisting(true);
    try {
      const response = await fetch(`/api/timetable?classId=${selectedClass.id}`);
      
      if (response.ok) {
        const data = await response.json();
        
        // Check if there's a timetable for this class
        if (Array.isArray(data) && data.length > 0) {
          const classTimetable = data.find((t: any) => t.classId === selectedClass.id);
          
          if (classTimetable) {
            setExistingTimetable(classTimetable);
            setGeneratedTimetable({
              success: true,
              timetable: classTimetable,
              slots: classTimetable.slots || [],
              stats: {
                totalSlots: classTimetable.slots?.length || 0,
                subjectsScheduled: new Set(classTimetable.slots?.map((s: any) => s.subjectId)).size || 0,
                daysScheduled: days.length,
              },
              message: 'Loaded existing timetable',
            });
            setShowPreview(true);
            
            toast.success('✅ Existing timetable loaded', {
              duration: 2000,
              position: 'top-center',
            });
          }
        }
      }
    } catch (error) {
      console.error('Error loading existing timetable:', error);
      // Don't show error toast - it's okay if no timetable exists yet
    } finally {
      setLoadingExisting(false);
    }
  };

  const getPeriodTime = (period: number) => {
    const times = {
      1: { start: '07:30', end: '08:15' },
      2: { start: '08:15', end: '09:00' },
      3: { start: '09:00', end: '09:45' },
      4: { start: '09:45', end: '10:30' },
      5: { start: '10:45', end: '11:30' },
      6: { start: '11:30', end: '12:15' },
      7: { start: '12:15', end: '13:00' },
      8: { start: '13:00', end: '13:45' }
    };
    return times[period as keyof typeof times] || { start: '07:30', end: '08:15' };
  };

  /**
   * Auto-generate timetable using AI algorithm
   * NOTE: Does NOT save to database - only generates for preview and editing
   */
  const autoGenerateTimetable = async () => {
    setGenerating(true);
    setHasUnsavedChanges(false);
    
    try {
      toast.loading('🤖 AI is generating optimal timetable...', {
        id: 'generating',
        duration: 2000,
        position: 'top-center',
      });

      // Generate without saving - use a preview endpoint
      const response = await fetch(`/api/timetable/generate-preview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          classId: selectedClass.id,
          options: {
            balanceSubjects: true,
            respectTeacherPreferences: true
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate timetable');
      }

      const data = await response.json();
      
      // Set generated data for preview and editing
      setGeneratedTimetable(data);
      setEditableSlots(data.slots || []);
      setShowPreview(true);
      setHasUnsavedChanges(true); // Mark as unsaved

      toast.success('✨ Timetable generated! Review and edit before saving.', {
        id: 'generating',
        duration: 3000,
        position: 'top-center',
        icon: '📝',
      });
    } catch (error) {
      console.error('Error generating timetable:', error);
      toast.error(error instanceof Error ? error.message : '❌ Failed to generate timetable.', {
        id: 'generating',
        duration: 4000,
        position: 'top-center',
      });
    } finally {
      setGenerating(false);
    }
  };

  /**
   * Save the timetable (with any manual edits) to database
   * This is the ONLY place where timetable gets saved
   */
  const saveTimetable = async () => {
    if (!generatedTimetable && editableSlots.length === 0) {
      toast.error('Please generate a timetable first!');
      return;
    }

    setSaving(true);
    try {
      toast.loading('💾 Saving timetable to database...', { id: 'save' });

      const currentYear = new Date().getFullYear();
      
      // Save to database using POST or PUT depending on if it exists
      const endpoint = existingTimetable 
        ? `/api/timetable/${existingTimetable.id}`
        : `/api/timetable`;
      
      const method = existingTimetable ? 'PUT' : 'POST';

      await performSave(endpoint, method);
      
    } catch (error) {
      console.error('Error saving timetable:', error);
      toast.error(error instanceof Error ? error.message : '❌ Failed to save timetable.', {
        id: 'save',
        duration: 4000,
      });
    } finally {
      setSaving(false);
    }
  };

  /**
   * Helper function to update an existing timetable
   */
  const updateExistingTimetable = async (timetableId: number) => {
    setSaving(true);
    try {
      toast.loading('💾 Updating existing timetable...', { id: 'save' });
      await performSave(`/api/timetable/${timetableId}`, 'PUT');
    } catch (error) {
      console.error('Error updating timetable:', error);
      toast.error(error instanceof Error ? error.message : '❌ Failed to update timetable.', {
        id: 'save',
        duration: 4000,
      });
    } finally {
      setSaving(false);
    }
  };

  /**
   * Core save logic
   */
  const performSave = async (endpoint: string, method: string) => {
    const currentYear = new Date().getFullYear();

    const response = await fetch(endpoint, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        classId: selectedClass.id,
        academicYear: `${currentYear}/${currentYear + 1}`,
        term: 'Term 1',
        isActive: true,
        slots: editableSlots.map(slot => ({
          day: slot.day,
          period: slot.period,
          startTime: slot.startTime,
          endTime: slot.endTime,
          slotType: slot.slotType || 'REGULAR',
          subjectId: slot.subject?.id || slot.subjectId,
          teacherId: slot.teacher?.id || slot.teacherId,
          roomNumber: slot.roomNumber || null,
          notes: slot.notes || null,
        })),
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      
      // If timetable already exists (409 conflict), suggest using update
      if (response.status === 409 && errorData.existingTimetableId) {
        toast.error('Timetable already exists for this class!', { id: 'save' });
        
        // Reload the existing timetable
        setExistingTimetable({ id: errorData.existingTimetableId });
        
        // Show option to update
        setTimeout(() => {
          const shouldUpdate = confirm(
            'A timetable already exists for this class.\n\nDo you want to UPDATE the existing timetable with these changes?'
          );
          
          if (shouldUpdate) {
            // Retry with PUT to update
            updateExistingTimetable(errorData.existingTimetableId);
          }
        }, 500);
        
        return;
      }
      
      throw new Error(errorData.error || 'Failed to save timetable');
    }

    const savedData = await response.json();
    
    toast.success('✅ Timetable saved successfully!', { 
      id: 'save',
      duration: 2000 
    });

    setHasUnsavedChanges(false);
    setExistingTimetable(savedData.timetable);

    // Redirect to timetables list
    setTimeout(() => {
      router.push('/admin/timetable');
      router.refresh();
    }, 1500);
  };

  const getSlotForDayPeriod = (day: string, period: number): TimetableSlot | undefined => {
    return editableSlots.find(slot => slot.day === day && slot.period === period);
  };

  /**
   * Open edit dialog for a specific slot
   */
  const openEditDialog = (day: string, period: number) => {
    const existingSlot = getSlotForDayPeriod(day, period);
    const periodTime = PERIODS.find(p => p.period === period);

    if (existingSlot) {
      setSlotEditData({
        ...existingSlot,
        subjectId: existingSlot.subject?.id || existingSlot.subjectId,
        teacherId: existingSlot.teacher?.id || existingSlot.teacherId,
      });
    } else {
      setSlotEditData({
        day,
        period,
        startTime: periodTime?.startTime || '07:30',
        endTime: periodTime?.endTime || '08:15',
        slotType: 'REGULAR',
        subjectId: undefined,
        teacherId: undefined,
        roomNumber: null,
        notes: null,
        isBreak: false,
      });
    }

    setEditingSlot({ day, period });
  };

  /**
   * Save edited slot to editable slots array (not database yet)
   */
  const saveSlotEdit = () => {
    if (!editingSlot || !slotEditData.subjectId) {
      toast.error('Please select a subject');
      return;
    }

    const updatedSlots = [...editableSlots];
    const existingIndex = updatedSlots.findIndex(
      s => s.day === editingSlot.day && s.period === editingSlot.period
    );

    const subject = subjects.find(s => s.id === slotEditData.subjectId);
    const teacher = subject?.teachers.find(t => t.id === slotEditData.teacherId);

    const newSlot: TimetableSlot = {
      day: editingSlot.day,
      period: editingSlot.period,
      startTime: slotEditData.startTime || '07:30',
      endTime: slotEditData.endTime || '08:15',
      slotType: slotEditData.slotType || 'REGULAR',
      subjectId: slotEditData.subjectId,
      subject: subject ? { id: subject.id, name: subject.name } : undefined,
      teacherId: slotEditData.teacherId,
      teacher: teacher ? { id: teacher.id, name: teacher.name, surname: teacher.surname } : undefined,
      roomNumber: slotEditData.roomNumber || null,
      notes: slotEditData.notes || null,
      isBreak: false,
    };

    if (existingIndex >= 0) {
      updatedSlots[existingIndex] = newSlot;
    } else {
      updatedSlots.push(newSlot);
    }

    setEditableSlots(updatedSlots);
    setEditingSlot(null);
    setSlotEditData({});
    setHasUnsavedChanges(true);

    toast.success('✏️ Slot updated. Remember to click Save!', {
      duration: 2000,
    });
  };

  /**
   * Delete a slot from editable array
   */
  const deleteSlot = (day: string, period: number) => {
    const updatedSlots = editableSlots.filter(
      s => !(s.day === day && s.period === period)
    );
    setEditableSlots(updatedSlots);
    setHasUnsavedChanges(true);
    
    toast.success('🗑️ Slot removed. Remember to click Save!', {
      duration: 2000,
    });
  };

  const getDayDate = (day: string): string => {
    // Returns current week's date for the day
    const dayIndex = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'].indexOf(day);
    const today = new Date();
    const currentDay = today.getDay();
    const diff = dayIndex + 1 - currentDay;
    const date = new Date(today);
    date.setDate(today.getDate() + diff);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="w-full space-y-4">
      {/* Loading Existing Timetable */}
      {loadingExisting && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="flex items-center justify-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-gray-600">Checking for existing timetable...</p>
          </div>
        </div>
      )}

      {/* Loading Overlay - Clean and Simple */}
      {generating && (
        <div className="fixed inset-0 bg-gray-900/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-sm w-full mx-4">
            <div className="flex flex-col items-center">
              <div className="relative w-16 h-16 mb-4">
                <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Generating Timetable
              </h3>
              <p className="text-sm text-gray-600 text-center">
                Creating optimized schedule...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* No Subjects Warning */}
      {!loadingExisting && subjects.length === 0 && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-400 p-8 rounded-xl shadow-sm">
          <div className="flex items-start gap-4">
            <div className="bg-yellow-100 p-3 rounded-lg">
              <svg className="w-6 h-6 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-yellow-800 mb-2">
                No Subjects Available
              </h3>
              <p className="text-yellow-700 mb-4">
                Before creating a timetable for <span className="font-semibold">
                {selectedClass.name}</span>, you need to add subjects to the system first.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content - Auto-Generate Section */}
      {!loadingExisting && subjects.length > 0 && !showPreview && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            {/* Header */}
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                Generate Timetable
              </h2>
              <p className="text-gray-600">
                Automatically create an optimized timetable for <span className="font-medium text-primary-600">{selectedClass.name}</span>
              </p>
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-3 gap-4 py-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary-600">{subjects.length}</div>
                <div className="text-sm text-gray-600 mt-1">Subjects</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary-600">40</div>
                <div className="text-sm text-gray-600 mt-1">Periods/Week</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary-600">5</div>
                <div className="text-sm text-gray-600 mt-1">School Days</div>
              </div>
            </div>

            {/* Generate Button */}
            <div className="pt-2">
              <button
                onClick={autoGenerateTimetable}
                disabled={generating}
                className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
              >
                {generating ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Generate Timetable
                  </>
                )}
              </button>
              <p className="text-sm text-gray-500 mt-3">This will create a complete weekly timetable</p>
            </div>
          </div>
        </div>
      )}

      {/* Preview Generated Timetable */}
      {!loadingExisting && showPreview && generatedTimetable && (
        <div className="space-y-4">
          {/* Success Summary */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  {existingTimetable ? (
                    <>
                      <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Saved Timetable
                    </>
                  ) : (
                    'Timetable Generated'
                  )}
                </h3>
                <p className="text-sm text-gray-600">
                  {existingTimetable ? 'This timetable is saved and will persist after page refresh' : 'Review and save your timetable'}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowPreview(false);
                    setGeneratedTimetable(null);
                    setExistingTimetable(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium text-sm"
                >
                  Regenerate
                </button>
                {!existingTimetable ? (
                  <button
                    onClick={saveTimetable}
                    disabled={saving}
                    className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium text-sm disabled:opacity-50 flex items-center gap-2"
                  >
                    {saving ? (
                      <>
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Saving...
                      </>
                    ) : (
                      <>
                        💾 Save Timetable
                      </>
                    )}
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => router.push(`/admin/timetable/edit?id=${existingTimetable.id}`)}
                      className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm flex items-center gap-2"
                    >
                      <Image src="/update.png" alt="Edit" width={16} height={16} />
                      Edit Timetable
                    </button>
                    <button
                      onClick={() => router.push('/admin/timetable')}
                      className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium text-sm"
                    >
                      View All Timetables
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Compact Stats Grid */}
            <div className="grid grid-cols-4 gap-3">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-blue-900">{generatedTimetable.stats.totalSlots}</div>
                <div className="text-xs text-blue-700 font-medium">Total Periods</div>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-green-900">{generatedTimetable.stats.subjectsScheduled}</div>
                <div className="text-xs text-green-700 font-medium">Subjects</div>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-purple-900">
                  {Array.from(new Set(generatedTimetable.slots.map((s: any) => s.teacherId))).length}
                </div>
                <div className="text-xs text-purple-700 font-medium">Teachers</div>
              </div>
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-orange-900">{generatedTimetable.stats.daysScheduled}</div>
                <div className="text-xs text-orange-700 font-medium">School Days</div>
              </div>
            </div>
          </div>

          {/* Timetable Preview - Compact View */}
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
            {/* Compact Header with Stats */}
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white px-4 py-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold">
                    {generatedTimetable.timetable?.class?.name || selectedClass.name}
                  </h3>
                  <p className="text-xs text-primary-100 mt-0.5">
                    Grade {generatedTimetable.timetable?.class?.grade?.level || selectedClass.grade?.level} • {new Date().getFullYear()}/{new Date().getFullYear() + 1}
                  </p>
                </div>
                <div className="flex gap-3 text-xs">
                  <div className="bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded">
                    <span className="font-semibold">{generatedTimetable.stats.totalSlots}</span> Periods
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded">
                    <span className="font-semibold">{generatedTimetable.stats.subjectsScheduled}</span> Subjects
                  </div>
                </div>
              </div>
            </div>

            {/* Compact Table - No Scroll Design */}
            <div className="p-3">
              <div className="overflow-hidden rounded-lg border border-gray-200">
                <table className="w-full table-fixed">
                  <thead>
                    <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                      <th className="px-2 py-2 text-left text-[10px] font-semibold text-gray-700 uppercase w-20">
                        Period
                      </th>
                      {days.map(day => (
                        <th key={day} className="px-1 py-2 text-center text-[10px] font-semibold text-gray-700 uppercase">
                          {day.slice(0, 3)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(period => (
                      <React.Fragment key={period}>
                        <tr className="hover:bg-blue-50/30 transition-colors">
                          <td className="px-2 py-2 bg-gradient-to-r from-gray-50 to-gray-100 border-r border-gray-200">
                            <div className="text-[10px]">
                              <div className="font-bold text-gray-900">P{period}</div>
                              <div className="text-[9px] text-gray-500 leading-tight">
                                {getPeriodTime(period).start}
                              </div>
                            </div>
                          </td>
                          {days.map(day => {
                            const slot = getSlotForDayPeriod(day, period);
                            
                            return (
                              <td key={`${day}-${period}`} className="px-1 py-1.5 text-center border-r border-gray-100">
                                {slot?.isBreak ? (
                                  <div className="bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-300 rounded px-1 py-1">
                                    <div className="text-amber-700 font-bold text-[9px]">BREAK</div>
                                  </div>
                                ) : slot?.subject || slot?.subjectName ? (
                                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-primary-200 rounded p-1.5 hover:shadow-md transition-shadow">
                                    <div className="font-bold text-[10px] text-gray-900 leading-tight mb-0.5 truncate" title={slot.subject?.name || slot.subjectName}>
                                      {slot.subject?.name || slot.subjectName}
                                    </div>
                                    <div className="text-[8px] text-gray-600 truncate" title={slot.teacher ? `${slot.teacher.name} ${slot.teacher.surname}` : slot.teacherName}>
                                      {slot.teacher ? `${slot.teacher.name} ${slot.teacher.surname}` : slot.teacherName || 'No Teacher'}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-gray-300 text-[9px]">
                                    —
                                  </div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                        {period === 4 && (
                          <tr className="bg-gradient-to-r from-amber-100 to-orange-100">
                            <td colSpan={6} className="px-2 py-1.5 text-center border-y-2 border-amber-300">
                              <div className="text-[10px]">
                                <span className="font-bold text-amber-800">☕ Interval Break</span>
                                <span className="text-amber-600 ml-1.5">10:20 - 10:40</span>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Color Legend */}
              <div className="mt-3 flex items-center justify-center gap-4 text-[10px] text-gray-600">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-gradient-to-br from-blue-50 to-indigo-50 border border-primary-200 rounded"></div>
                  <span>Subject</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-300 rounded"></div>
                  <span>Break</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-white border border-gray-200 rounded"></div>
                  <span>Free Period</span>
                </div>
              </div>
            </div>
          </div>

          {/* Subject Summary - Compact View */}
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <svg className="w-4 h-4 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                </svg>
                Subject Distribution
              </h4>
              <span className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded-full font-semibold">
                {generatedTimetable.stats.subjectsScheduled} Subjects
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {generatedTimetable.slots.reduce((acc: any[], slot: any) => {
                if (slot.subject) {
                  const existing = acc.find(s => s.subjectId === slot.subject.id);
                  if (existing) {
                    existing.periodsPerWeek++;
                  } else {
                    acc.push({
                      subjectId: slot.subject.id,
                      subjectName: slot.subject.name,
                      periodsPerWeek: 1
                    });
                  }
                }
                return acc;
              }, []).sort((a: any, b: any) => b.periodsPerWeek - a.periodsPerWeek).map((subject: any, index: number) => {
                const colors = [
                  'from-blue-50 to-blue-100 border-blue-200 text-blue-900',
                  'from-green-50 to-green-100 border-green-200 text-green-900',
                  'from-purple-50 to-purple-100 border-purple-200 text-purple-900',
                  'from-orange-50 to-orange-100 border-orange-200 text-orange-900',
                  'from-pink-50 to-pink-100 border-pink-200 text-pink-900',
                  'from-indigo-50 to-indigo-100 border-indigo-200 text-indigo-900'
                ];
                const colorClass = colors[index % colors.length];
                
                return (
                  <div key={subject.subjectId} className={`bg-gradient-to-br ${colorClass} rounded-lg p-2 border hover:shadow-md transition-shadow`}>
                    <div className="font-bold text-[10px] leading-tight mb-1 truncate" title={subject.subjectName}>
                      {subject.subjectName}
                    </div>
                    <div className="text-[9px] font-semibold opacity-75">
                      {subject.periodsPerWeek}p/week
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimetableWrapper;
