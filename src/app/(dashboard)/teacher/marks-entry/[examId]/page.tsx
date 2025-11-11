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
}

const TeacherMarksEntryPage = () => {
  const router = useRouter();
  const params = useParams();
  const examId = params.examId as string;

  const [exam, setExam] = useState<Exam | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<ExamSubject | null>(null);
  const [marks, setMarks] = useState<Record<string, number | null>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

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
        setExam(data.exam);
        
        // Auto-select first subject if teacher has only one
        if (data.exam.examSubjects.length === 1) {
          setSelectedSubject(data.exam.examSubjects[0]);
        }
        
        // Get students for this grade
        const studentsResponse = await fetch(`/api/students?gradeId=${data.exam.gradeId}`);
        if (studentsResponse.ok) {
          const studentsData = await studentsResponse.json();
          setStudents(studentsData.students || []);
          
          // Initialize marks object
          const initialMarks: Record<string, number | null> = {};
          (studentsData.students || []).forEach((student: Student) => {
            initialMarks[student.id] = null;
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

  const handleMarkChange = (studentId: string, value: string) => {
    const numValue = value === "" ? null : parseInt(value);
    setMarks(prev => ({
      ...prev,
      [studentId]: numValue
    }));
  };

  const handleSubmit = async () => {
    if (!selectedSubject) {
      toast.error("Please select a subject");
      return;
    }

    // Validate marks
    const marksArray = Object.entries(marks).map(([studentId, marksObtained]) => ({
      studentId,
      marksObtained
    }));

    const invalidMarks = marksArray.filter(mark => 
      mark.marksObtained !== null && 
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
        toast.success("Marks submitted successfully!");
        
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
    if (!searchTerm) return true;
    const fullName = `${student.name} ${student.surname}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase()) || 
           student.username.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const calculateStats = () => {
    const enteredMarks = Object.values(marks).filter(mark => mark !== null) as number[];
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
            className="p-2 rounded-full bg-gray-200 hover:bg-gray-300"
          >
            <Image src="/arrow-left.png" alt="Back" width={16} height={16} />
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

      {/* Subject Selection */}
      {exam.examSubjects.length > 1 && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-medium text-blue-800 mb-3">Select Subject</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {exam.examSubjects.map((examSubject) => (
              <button
                key={examSubject.id}
                onClick={() => setSelectedSubject(examSubject)}
                className={`p-3 rounded-lg border-2 transition-all ${
                  selectedSubject?.id === examSubject.id
                    ? "border-blue-500 bg-blue-100 text-blue-800"
                    : "border-gray-200 bg-white hover:border-blue-300"
                }`}
              >
                <div className="font-medium">{examSubject.subject.name}</div>
                <div className="text-sm text-gray-600">Max: {examSubject.maxMarks} marks</div>
                {examSubject.marksEntered && (
                  <div className="text-xs text-green-600 mt-1">✓ Completed</div>
                )}
              </button>
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
              {selectedSubject.marksEntered && (
                <div className="text-green-600 flex items-center">
                  <Image src="/result.png" alt="Completed" width={20} height={20} className="mr-2" />
                  <span className="font-medium">Marks Already Entered</span>
                  {selectedSubject.marksEnteredAt && (
                    <span className="text-sm ml-2">
                      ({new Date(selectedSubject.marksEnteredAt).toLocaleDateString()})
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Search Students */}
          <div className="mb-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Image src="/search.png" alt="Search" width={16} height={16} />
              </div>
              <input
                type="text"
                placeholder="Search students by name or username..."
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
                <div className="text-blue-900 text-xl font-bold">{stats.total}/{students.length}</div>
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
              <div>Username</div>
              <div>Marks (Max: {selectedSubject.maxMarks})</div>
              <div>Grade</div>
            </div>
            
            <div className="divide-y divide-gray-200">
              {filteredStudents.map((student, index) => {
                const mark = marks[student.id];
                const percentage = mark !== null ? (mark / selectedSubject.maxMarks) * 100 : 0;
                let grade = "N/A";
                if (mark !== null) {
                  if (percentage >= 90) grade = "A+";
                  else if (percentage >= 80) grade = "A";
                  else if (percentage >= 70) grade = "B+";
                  else if (percentage >= 60) grade = "B";
                  else if (percentage >= 50) grade = "C+";
                  else if (percentage >= 40) grade = "C";
                  else if (percentage >= 30) grade = "D";
                  else grade = "F";
                }

                return (
                  <div key={student.id} className="grid grid-cols-4 gap-4 p-4 hover:bg-gray-50">
                    <div>
                      <div className="font-medium text-gray-900">
                        {student.name} {student.surname}
                      </div>
                      <div className="text-sm text-gray-500">
                        Student #{index + 1}
                      </div>
                    </div>
                    <div className="text-gray-600">{student.username}</div>
                    <div>
                      <input
                        type="number"
                        min="0"
                        max={selectedSubject.maxMarks}
                        value={mark || ""}
                        onChange={(e) => handleMarkChange(student.id, e.target.value)}
                        className="w-24 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <span className={`px-2 py-1 rounded text-sm font-medium ${
                        grade === "A+" || grade === "A" ? "bg-green-100 text-green-800" :
                        grade === "B+" || grade === "B" ? "bg-blue-100 text-blue-800" :
                        grade === "C+" || grade === "C" ? "bg-yellow-100 text-yellow-800" :
                        grade === "D" ? "bg-orange-100 text-orange-800" :
                        grade === "F" ? "bg-red-100 text-red-800" :
                        "bg-gray-100 text-gray-500"
                      }`}>
                        {grade}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Submit Button */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <Image src="/result.png" alt="Submit" width={16} height={16} />
                  Submit Marks
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherMarksEntryPage;
