"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "react-hot-toast";
import Image from "next/image";

interface Student {
  id: string;
  name: string;
  surname: string;
  username: string;
  classId: number;
  class: {
    name: string;
  };
}

interface ExamSubject {
  id: number;
  maxMarks: number;
  marksEntered: boolean;
  marksEnteredAt?: string;
  subject: {
    id: number;
    name: string;
  };
  teacher: {
    id: string;
    name: string;
    surname: string;
  };
  subjectResults?: Array<{
    studentId: string;
    marks: number;
    grade: string;
  }>;
}

interface Exam {
  id: number;
  title: string;
  status: string;
  grade: {
    id: number;
    level: number;
  };
  examSubjects: ExamSubject[];
}

interface MarkEntry {
  studentId: string;
  marksObtained: number | null;
  isAbsent?: boolean;
}

const TeacherMarksEntryPage = () => {
  const router = useRouter();
  const params = useParams();
  const examId = params.examId as string;

  const [exam, setExam] = useState<Exam | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<ExamSubject | null>(null);
  const [selectedClass, setSelectedClass] = useState<string | null>(null); // Changed: null initially
  const [marks, setMarks] = useState<Record<string, { value: number | null; isAbsent: boolean }>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editMode, setEditMode] = useState(false); // New: Track if in edit mode

  useEffect(() => {
    if (examId) {
      fetchMarksEntryData();
    }
  }, [examId]);

  const fetchMarksEntryData = async () => {
    try {
      const response = await fetch(`/api/marks-entry/${examId}`);
      if (response.ok) {
        const data = await response.json();
        console.log("📊 Marks Entry Data:", data);
        console.log("👥 Students fetched:", data.students?.length || 0);
        console.log("📚 Exam subjects:", data.exam?.examSubjects?.length || 0);
        
        setExam(data.exam);
        setStudents(data.students || []);
        
        // Auto-select first class if available
        if (data.students && data.students.length > 0) {
          const classes = Array.from(new Set(data.students.map((s: Student) => s.class.name))).sort();
          console.log("🏫 Available classes:", classes);
          if (classes.length > 0 && !selectedClass) {
            setSelectedClass(classes[0] as string);
            console.log("✅ Auto-selected class:", classes[0]);
          }
        }
        
        // Auto-select first subject if teacher has only one
        if (data.exam.examSubjects.length === 1) {
          setSelectedSubject(data.exam.examSubjects[0]);
          console.log("📖 Auto-selected subject:", data.exam.examSubjects[0].subject.name);
          // Load existing marks for the selected subject if available
          loadExistingMarks(data.exam.examSubjects[0], data.students);
        } else {
          // Initialize marks object with absent status
          const initialMarks: Record<string, { value: number | null; isAbsent: boolean }> = {};
          (data.students || []).forEach((student: Student) => {
            initialMarks[student.id] = { value: null, isAbsent: false };
          });
          setMarks(initialMarks);
        }
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to fetch marks entry data");
      }
    } catch (error) {
      console.error("Error fetching marks entry data:", error);
      toast.error("Failed to fetch marks entry data");
    } finally {
      setLoading(false);
    }
  };

  const loadExistingMarks = async (examSubject: ExamSubject, studentsList: Student[]) => {
    if (!examSubject.marksEntered) {
      // No marks entered yet, initialize empty
      const initialMarks: Record<string, { value: number | null; isAbsent: boolean }> = {};
      studentsList.forEach((student: Student) => {
        initialMarks[student.id] = { value: null, isAbsent: false };
      });
      setMarks(initialMarks);
      setEditMode(false);
      return;
    }

    // Marks already entered, load them from subjectResults
    const loadedMarks: Record<string, { value: number | null; isAbsent: boolean }> = {};
    
    studentsList.forEach((student: Student) => {
      const result = examSubject.subjectResults?.find((r: any) => r.studentId === student.id);
      if (result) {
        loadedMarks[student.id] = {
          value: result.grade === "AB" ? null : result.marks,
          isAbsent: result.grade === "AB"
        };
      } else {
        loadedMarks[student.id] = { value: null, isAbsent: false };
      }
    });
    
    setMarks(loadedMarks);
    setEditMode(false); // Start in view mode when marks exist
  };

  const handleMarkChange = (studentId: string, value: string) => {
    const numValue = value === "" ? null : parseInt(value);
    setMarks(prev => ({
      ...prev,
      [studentId]: { value: numValue, isAbsent: prev[studentId]?.isAbsent || false }
    }));
  };

  const handleAbsentToggle = (studentId: string) => {
    setMarks(prev => ({
      ...prev,
      [studentId]: { 
        value: prev[studentId]?.isAbsent ? prev[studentId].value : null, 
        isAbsent: !prev[studentId]?.isAbsent 
      }
    }));
  };

  const handleSubjectSelect = (examSubject: ExamSubject) => {
    setSelectedSubject(examSubject);
    loadExistingMarks(examSubject, students);
  };

  const handleDeleteMarks = async () => {
    if (!selectedSubject) {
      toast.error("Please select a subject");
      return;
    }

    if (!confirm(`Are you sure you want to delete all marks for ${selectedSubject.subject.name}? This action cannot be undone.`)) {
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/marks-entry/${examId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subjectId: selectedSubject.subject.id,
        }),
      });

      if (response.ok) {
        toast.success("Marks deleted successfully!");
        
        // Reset marks and edit mode
        setEditMode(false);
        
        // Refresh data
        fetchMarksEntryData();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to delete marks");
      }
    } catch (error) {
      console.error("Error deleting marks:", error);
      toast.error("Failed to delete marks");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedSubject) {
      toast.error("Please select a subject");
      return;
    }

    // Prepare marks array for submission
    const marksArray = Object.entries(marks).map(([studentId, markData]) => ({
      studentId,
      marksObtained: markData.isAbsent ? null : markData.value,
      isAbsent: markData.isAbsent
    }));

    // Validate marks
    const invalidMarks = marksArray.filter(mark => 
      !mark.isAbsent && mark.marksObtained !== null && 
      (mark.marksObtained < 0 || mark.marksObtained > selectedSubject.maxMarks)
    );

    if (invalidMarks.length > 0) {
      toast.error(`Marks must be between 0 and ${selectedSubject.maxMarks}`);
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/marks-entry/${examId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subjectId: selectedSubject.subject.id,
          marks: marksArray,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(editMode ? "Marks updated successfully!" : "Marks submitted successfully!");
        
        // Reset edit mode
        setEditMode(false);
        
        // Refresh data
        fetchMarksEntryData();
        
        if (result.allSubjectsCompleted) {
          toast.success("All subjects completed! Exam moved to review phase.");
        }
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to submit marks");
      }
    } catch (error) {
      console.error("Error submitting marks:", error);
      toast.error("Failed to submit marks");
    } finally {
      setSaving(false);
    }
  };

  const filteredStudents = students.filter(student => {
    // Filter by class (required - must select a class)
    if (!selectedClass || student.class.name !== selectedClass) {
      return false;
    }
    
    // Filter by search term
    if (!searchTerm) return true;
    const fullName = `${student.name} ${student.surname}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase()) || 
           student.username.toLowerCase().includes(searchTerm.toLowerCase());
  });

  console.log("🔍 Filtered students for class", selectedClass, ":", filteredStudents.length);

  // Get unique classes from students
  const availableClasses = Array.from(new Set(students.map(s => s.class.name))).sort();
  
  // Auto-select first class if none selected
  useEffect(() => {
    if (!selectedClass && availableClasses.length > 0) {
      console.log("🔄 Auto-selecting first class:", availableClasses[0]);
      setSelectedClass(availableClasses[0]);
    }
  }, [availableClasses, selectedClass]);

  const calculateStats = () => {
    const enteredMarks = Object.values(marks)
      .filter(mark => !mark.isAbsent && mark.value !== null)
      .map(mark => mark.value) as number[];
      
    if (enteredMarks.length === 0) return { average: 0, total: enteredMarks.length, highest: 0, lowest: 0 };
    
    const total = enteredMarks.length;
    const sum = enteredMarks.reduce((acc, mark) => acc + mark, 0);
    const average = sum / total;
    const highest = Math.max(...enteredMarks);
    const lowest = Math.min(...enteredMarks);
    
    return { average: Math.round(average * 100) / 100, total, highest, lowest };
  };

  if (loading) {
    return (
      <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2">Loading marks entry...</span>
        </div>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
        <div className="text-center py-12">
          <p className="text-gray-500">Exam not found or you don't have access to enter marks for this exam.</p>
          <button
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const stats = calculateStats();

  return (
    <div className="bg-white p-6 rounded-md flex-1 m-4 mt-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
          >
            <span className="text-lg">←</span>
            <span className="text-sm font-medium">Back</span>
          </button>
          <div>
            <h1 className="text-xl font-semibold">{exam.title}</h1>
            <p className="text-gray-600">
              Grade {exam.grade.level} • Marks Entry
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-600">
            {exam.examSubjects.filter(s => s.marksEntered).length} / {exam.examSubjects.length} subjects completed
          </div>
        </div>
      </div>

      {/* Quick Action Cards */}
      <div className="mb-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Current Marks Card */}
        <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg shadow-md">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Image src="/exam.png" alt="Current" width={20} height={20} className="filter invert" />
                <h3 className="font-semibold text-lg">Current Exam Marks</h3>
              </div>
              <p className="text-blue-100 text-sm">
                Grade {exam.grade.level} • Report Cards & Grading
              </p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <span className="text-2xl">📝</span>
            </div>
          </div>
        </div>

        {/* Historical Marks Card */}
        <button
          onClick={() => router.push('/teacher/historical-marks-import')}
          className="p-4 bg-gradient-to-br from-purple-500 to-indigo-600 text-white rounded-lg shadow-md hover:shadow-lg transition-all text-left group"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Image src="/ai-prediction.svg" alt="AI" width={20} height={20} className="filter invert" />
                <h3 className="font-semibold text-lg">Historical Marks Import</h3>
              </div>
              <p className="text-purple-100 text-sm mb-2">
                Grade 9 & 10 • For Prediction Analysis
              </p>
              <div className="flex items-center gap-2 text-xs text-purple-100">
                <span>🤖 Predictions</span>
                <span>•</span>
                <span>📊 Excel Upload</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center group-hover:bg-white/30 transition-colors">
              <Image src="/upload.png" alt="Import" width={20} height={20} className="filter invert" />
            </div>
          </div>
        </button>
      </div>

      {/* Subject Selection */}
      {exam.examSubjects.length > 1 && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-medium text-blue-800 mb-3">Select Subject</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {exam.examSubjects.map((examSubject) => (
              <div key={examSubject.id} className="relative">
                <button
                  onClick={() => handleSubjectSelect(examSubject)}
                  className={`w-full p-3 rounded-lg border-2 transition-all ${
                    selectedSubject?.id === examSubject.id
                      ? "border-blue-500 bg-blue-100 text-blue-800"
                      : "border-gray-200 bg-white hover:border-blue-300"
                  }`}
                >
                  <div className="font-medium">{examSubject.subject.name}</div>
                  <div className="text-sm text-gray-600">Max: {examSubject.maxMarks} marks</div>
                  {examSubject.marksEntered && (
                    <div className="text-xs text-green-600 mt-1 flex items-center justify-center gap-1">
                      <span>✓</span> Marks Entered
                    </div>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No subjects assigned */}
      {exam.examSubjects.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Image src="/subject.png" alt="No subjects" width={64} height={64} className="mx-auto opacity-50" />
          </div>
          <h3 className="text-xl font-semibold text-gray-500 mb-2">No Subjects Assigned</h3>
          <p className="text-gray-400">You are not assigned to any subjects for this exam.</p>
        </div>
      )}

      {/* Marks Entry Interface */}
      {selectedSubject && (
        <div>
          {/* Subject Info */}
          <div className="mb-6 p-4 bg-green-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-green-800">
                  {selectedSubject.subject.name}
                </h3>
                <p className="text-green-600">
                  Maximum Marks: {selectedSubject.maxMarks}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {selectedSubject.marksEntered && (
                  <>
                    <div className="text-green-600 flex items-center">
                      <Image src="/result.png" alt="Completed" width={20} height={20} className="mr-2" />
                      <span className="font-medium">Marks Entered</span>
                      {selectedSubject.marksEnteredAt && (
                        <span className="text-sm ml-2">
                          ({new Date(selectedSubject.marksEnteredAt).toLocaleDateString()})
                        </span>
                      )}
                    </div>
                    {!editMode ? (
                      <>
                        <button
                          onClick={() => setEditMode(true)}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          <Image src="/update.png" alt="Edit" width={16} height={16} />
                          Edit Marks
                        </button>
                        <button
                          onClick={handleDeleteMarks}
                          disabled={saving}
                          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                        >
                          <Image src="/delete.png" alt="Delete" width={16} height={16} />
                          Delete Marks
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setEditMode(false)}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                      >
                        Cancel Edit
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Class Selection Cards */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              Select Class to Enter/View Marks
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {availableClasses.map((className) => {
                const classStudents = students.filter(s => s.class.name === className);
                const classStudentCount = classStudents.length;
                const enteredCount = classStudents.filter(s => {
                  const mark = marks[s.id];
                  return mark && (mark.value !== null || mark.isAbsent);
                }).length;
                const isCompleted = enteredCount === classStudentCount && enteredCount > 0;
                const isSelected = selectedClass === className;

                return (
                  <button
                    key={className}
                    onClick={() => setSelectedClass(className)}
                    className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                      isSelected
                        ? "border-blue-500 bg-blue-50 shadow-lg scale-105"
                        : "border-gray-200 bg-white hover:border-blue-300 hover:shadow-md"
                    }`}
                  >
                    {/* Class Badge */}
                    <div className="flex items-center justify-between mb-3">
                      <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                        isSelected
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-700"
                      }`}>
                        {className}
                      </div>
                      {isCompleted && (
                        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">✓</span>
                        </div>
                      )}
                    </div>

                    {/* Student Count */}
                    <div className={`text-2xl font-bold mb-1 ${
                      isSelected ? "text-blue-700" : "text-gray-800"
                    }`}>
                      {classStudentCount}
                    </div>
                    <div className={`text-sm ${
                      isSelected ? "text-blue-600" : "text-gray-600"
                    }`}>
                      Students
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-3">
                      <div className="flex justify-between text-xs mb-1">
                        <span className={isSelected ? "text-blue-600 font-medium" : "text-gray-500"}>
                          Marks Entered
                        </span>
                        <span className={isSelected ? "text-blue-700 font-bold" : "text-gray-600"}>
                          {enteredCount}/{classStudentCount}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            isCompleted ? "bg-green-500" : isSelected ? "bg-blue-600" : "bg-gray-400"
                          }`}
                          style={{ width: `${classStudentCount > 0 ? (enteredCount / classStudentCount) * 100 : 0}%` }}
                        />
                      </div>
                    </div>

                    {/* Selected Indicator */}
                    {isSelected && (
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center shadow-lg">
                        <span className="text-white text-lg font-bold">✓</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Class Info Banner */}
          {selectedClass && (
            <div className="mb-4 p-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-md">
              <div className="flex items-center justify-between text-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-lg font-bold">Class {selectedClass}</div>
                    <div className="text-blue-100 text-sm">
                      {filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''} in this class
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Search Students */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Students in Class {selectedClass}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Image src="/search.png" alt="Search" width={16} height={16} />
              </div>
              <input
                type="text"
                placeholder="Search by name or username..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Statistics */}
          {stats.total > 0 && (
            <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="text-blue-600 text-sm font-medium">Students</div>
                <div className="text-blue-900 text-xl font-bold">{stats.total}/{filteredStudents.length}</div>
                <div className="text-blue-600 text-xs">marks entered</div>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="text-green-600 text-sm font-medium">Average</div>
                <div className="text-green-900 text-xl font-bold">{stats.average}</div>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg">
                <div className="text-purple-600 text-sm font-medium">Highest</div>
                <div className="text-purple-900 text-xl font-bold">{stats.highest}</div>
              </div>
              <div className="bg-orange-50 p-3 rounded-lg">
                <div className="text-orange-600 text-sm font-medium">Lowest</div>
                <div className="text-orange-900 text-xl font-bold">{stats.lowest}</div>
              </div>
            </div>
          )}

          {/* Students Marks Entry */}
          <div className="bg-gray-50 rounded-lg overflow-hidden">
            <div className="grid grid-cols-4 gap-4 p-4 bg-gray-100 font-medium text-gray-700">
              <div>Student</div>
              <div>Marks (Max: {selectedSubject.maxMarks})</div>
              <div>Absent</div>
              <div>Grade</div>
            </div>
            
            {filteredStudents.length === 0 ? (
              <div className="p-8 text-center bg-white">
                <div className="text-gray-400 mb-4">
                  <Image src="/student.png" alt="No students" width={64} height={64} className="mx-auto opacity-50" />
                </div>
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No Students Found</h3>
                <p className="text-gray-500 mb-4">
                  {!selectedClass 
                    ? "Please select a class to view students."
                    : searchTerm 
                      ? `No students match your search "${searchTerm}" in class ${selectedClass}.`
                      : `No students found in class ${selectedClass} for Grade ${exam.grade.level}.`
                  }
                </p>
                {availableClasses.length === 0 && (
                  <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      <strong>Note:</strong> There are no students in Grade {exam.grade.level}. 
                      Please contact the admin to add students to this grade.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredStudents.map((student, index) => {
                const markData = marks[student.id];
                const markValue = markData?.value;
                const isAbsent = markData?.isAbsent || false;
                const percentage = markValue !== null && !isAbsent ? (markValue / selectedSubject.maxMarks) * 100 : 0;
                let grade = "N/A";
                if (isAbsent) {
                  grade = "AB";
                } else if (markValue !== null) {
                  if (percentage >= 75) grade = "A";
                  else if (percentage >= 65) grade = "B";
                  else if (percentage >= 50) grade = "C";
                  else if (percentage >= 35) grade = "S";
                  else grade = "W";
                }

                return (
                  <div key={student.id} className="grid grid-cols-4 gap-4 p-4 hover:bg-gray-50 border-b border-gray-100">
                    <div>
                      <div className="font-medium text-gray-900">
                        {student.name} {student.surname}
                      </div>
                      <div className="text-xs text-gray-400">
                        {student.username}
                      </div>
                    </div>
                    <div>
                      <input
                        type="number"
                        min="0"
                        max={selectedSubject.maxMarks}
                        value={isAbsent ? "" : (markValue || "")}
                        onChange={(e) => handleMarkChange(student.id, e.target.value)}
                        disabled={isAbsent || (selectedSubject.marksEntered && !editMode)}
                        className={`w-24 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          (isAbsent || (selectedSubject.marksEntered && !editMode)) ? "bg-gray-100 cursor-not-allowed" : ""
                        }`}
                        placeholder={isAbsent ? "Absent" : "0"}
                      />
                    </div>
                    <div className="flex items-center">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isAbsent}
                          onChange={() => handleAbsentToggle(student.id)}
                          disabled={selectedSubject.marksEntered && !editMode}
                          className="w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-red-500 disabled:cursor-not-allowed"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          {isAbsent ? "Absent" : "Present"}
                        </span>
                      </label>
                    </div>
                    <div>
                      <span className={`px-2 py-1 rounded text-sm font-medium ${
                        grade === "AB" ? "bg-gray-100 text-gray-800" :
                        grade === "A" ? "bg-green-100 text-green-800" :
                        grade === "B" ? "bg-blue-100 text-blue-800" :
                        grade === "C" ? "bg-yellow-100 text-yellow-800" :
                        grade === "S" ? "bg-orange-100 text-orange-800" :
                        grade === "W" ? "bg-red-100 text-red-800" :
                        "bg-gray-100 text-gray-500"
                      }`}>
                        {grade}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            )}
          </div>

          {/* Submit Button */}
          {(!selectedSubject.marksEntered || editMode) && (
            <div className="mt-6 flex justify-end">
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    {editMode ? "Updating..." : "Submitting..."}
                  </>
                ) : (
                  <>
                    <Image src="/result.png" alt="Submit" width={16} height={16} />
                    {editMode ? "Save Changes" : "Submit Marks"}
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TeacherMarksEntryPage;
