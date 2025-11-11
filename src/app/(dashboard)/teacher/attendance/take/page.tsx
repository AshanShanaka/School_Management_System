'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import toast from 'react-hot-toast';

interface Student {
  id: string;
  name: string;
  surname: string;
  studentId: string;
}

interface AttendanceRecord {
  studentId: string;
  present: boolean;
  late: boolean;
  excused: boolean;
  note?: string;
}

const QuickAttendanceContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const classId = searchParams.get('classId');
  const subjectId = searchParams.get('subjectId');
  const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
  const teacherId = searchParams.get('teacherId');

  const [students, setStudents] = useState<Student[]>([]);
  const [classInfo, setClassInfo] = useState<any>(null);
  const [subjectInfo, setSubjectInfo] = useState<any>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!classId || !subjectId) {
        toast.error('Missing required parameters');
        router.push('/teacher/timetable');
        return;
      }

      try {
        // Fetch class and students data
        const classResponse = await fetch(`/api/classes/${classId}/students`);
        if (classResponse.ok) {
          const response = await classResponse.json();
          setClassInfo(response.classData);
          setStudents(response.classData.students);
          
          // Initialize attendance records
          const initialAttendance = response.classData.students.map((student: Student) => ({
            studentId: student.id,
            present: true, // Default to present
            late: false,
            excused: false,
            note: ''
          }));
          setAttendance(initialAttendance);
        }

        // Fetch subject data
        const subjectResponse = await fetch(`/api/subjects`);
        if (subjectResponse.ok) {
          const subjectsData = await subjectResponse.json();
          const subject = subjectsData.find((s: any) => s.id === parseInt(subjectId!));
          if (subject) {
            setSubjectInfo(subject);
          }
        }

      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load attendance data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [classId, subjectId, router]);

  const updateAttendance = (studentId: string, field: keyof AttendanceRecord, value: boolean | string) => {
    setAttendance(prev => prev.map(record => 
      record.studentId === studentId 
        ? { ...record, [field]: value }
        : record
    ));
  };

  const saveAttendance = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/attendance/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          classId: parseInt(classId!),
          subjectId: parseInt(subjectId!),
          teacherId,
          date,
          attendanceRecords: attendance
        }),
      });

      if (response.ok) {
        toast.success('🎉 Attendance saved successfully!', {
          duration: 3000,
          position: 'top-center',
        });
        router.push('/teacher/timetable');
      } else {
        throw new Error('Failed to save attendance');
      }
    } catch (error) {
      console.error('Error saving attendance:', error);
      toast.error('Failed to save attendance. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const markAllPresent = () => {
    setAttendance(prev => prev.map(record => ({
      ...record,
      present: true,
      late: false,
      excused: false
    })));
    toast.success('All students marked as present');
  };

  const markAllAbsent = () => {
    setAttendance(prev => prev.map(record => ({
      ...record,
      present: false,
      late: false,
      excused: false
    })));
    toast.success('All students marked as absent');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-sm">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading attendance data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-green-600 text-white p-6 rounded-xl shadow-lg mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">Quick Attendance</h1>
            <div className="space-y-1 text-blue-100">
              <p><strong>Class:</strong> {classInfo?.name} (Grade {classInfo?.grade?.level})</p>
              <p><strong>Subject:</strong> {subjectInfo?.name}</p>
              <p><strong>Date:</strong> {new Date(date).toLocaleDateString()}</p>
            </div>
          </div>
          <button
            onClick={() => router.push('/teacher/timetable')}
            className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors"
          >
            ← Back to Timetable
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
        <h3 className="font-semibold mb-3">Quick Actions</h3>
        <div className="flex gap-3">
          <button
            onClick={markAllPresent}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Mark All Present
          </button>
          <button
            onClick={markAllAbsent}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Mark All Absent
          </button>
        </div>
      </div>

      {/* Attendance List */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-4 border-b">
          <h3 className="font-semibold">Student Attendance ({students.length} students)</h3>
        </div>
        
        <div className="p-4">
          <div className="space-y-3">
            {students.map((student) => {
              const record = attendance.find(a => a.studentId === student.id);
              return (
                <div key={student.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Image 
                      src="/noAvatar.png" 
                      alt="" 
                      width={40} 
                      height={40} 
                      className="rounded-full"
                    />
                    <div>
                      <h4 className="font-medium">{student.name} {student.surname}</h4>
                      <p className="text-sm text-gray-500">ID: {student.studentId}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={`attendance-${student.id}`}
                        checked={record?.present === true}
                        onChange={() => updateAttendance(student.id, 'present', true)}
                        className="text-green-600"
                      />
                      <span className="text-green-600">Present</span>
                    </label>
                    
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={`attendance-${student.id}`}
                        checked={record?.present === false}
                        onChange={() => updateAttendance(student.id, 'present', false)}
                        className="text-red-600"
                      />
                      <span className="text-red-600">Absent</span>
                    </label>
                    
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={record?.late || false}
                        onChange={(e) => updateAttendance(student.id, 'late', e.target.checked)}
                        className="text-yellow-600"
                      />
                      <span className="text-yellow-600">Late</span>
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Save Button */}
        <div className="p-4 border-t bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Present: {attendance.filter(a => a.present).length} | 
              Absent: {attendance.filter(a => !a.present).length} | 
              Late: {attendance.filter(a => a.late).length}
            </div>
            <button
              onClick={saveAttendance}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Attendance'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const QuickAttendancePage = () => {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-sm">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading attendance...</p>
        </div>
      </div>
    }>
      <QuickAttendanceContent />
    </Suspense>
  );
};

export default QuickAttendancePage;
