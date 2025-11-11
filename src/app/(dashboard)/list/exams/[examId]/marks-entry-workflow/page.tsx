"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "react-hot-toast";

interface Student {
  id: string;
  name: string;
  surname: string;
  username: string;
  currentMarks: number | null;
}

interface ExamSubject {
  id: number;
  subjectId: number;
  maxMarks: number;
  marksEntered: boolean;
  subject: {
    id: number;
    name: string;
    code?: string;
  };
  teacher: {
    id: string;
    name: string;
    surname: string;
  } | null;
}

interface Class {
  id: number;
  name: string;
}

const MarksEntryPage = () => {
  const params = useParams();
  const router = useRouter();
  const examId = params.examId as string;

  const [classes, setClasses] = useState<Class[]>([]);
  const [examSubjects, setExamSubjects] = useState<ExamSubject[]>([]);
  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<number | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [marks, setMarks] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [examSubjectData, setExamSubjectData] = useState<ExamSubject | null>(null);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Fetch exam details and subjects
        const examResponse = await fetch(`/api/exams/${examId}`);
        if (!examResponse.ok) throw new Error("Failed to fetch exam data");
        const examData = await examResponse.json();

        setExamSubjects(examData.examSubjects || []);

        // Fetch classes for this grade
        const classesResponse = await fetch(`/api/classes?gradeId=${examData.gradeId}`);
        if (!classesResponse.ok) throw new Error("Failed to fetch classes");
        const classesData = await classesResponse.json();
        setClasses(Array.isArray(classesData) ? classesData : classesData.classes || []);

      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    if (examId) {
      fetchInitialData();
    }
  }, [examId]);

  useEffect(() => {
    const fetchStudents = async () => {
      if (!selectedClass || !selectedSubject) {
        setStudents([]);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(`/api/marks-entry/${examId}/${selectedClass}/${selectedSubject}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to fetch students");
        }

        const data = await response.json();
        setStudents(data.students || []);
        setExamSubjectData(data.examSubject);

        // Initialize marks with existing values
        const initialMarks: Record<string, number> = {};
        data.students.forEach((student: Student) => {
          if (student.currentMarks !== null) {
            initialMarks[student.id] = student.currentMarks;
          }
        });
        setMarks(initialMarks);

      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch students");
        setStudents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [examId, selectedClass, selectedSubject]);

  const handleMarkChange = (studentId: string, mark: number) => {
    setMarks(prev => ({
      ...prev,
      [studentId]: mark
    }));
  };

  const handleSubmit = async () => {
    if (!selectedClass || !selectedSubject || !examSubjectData) {
      toast.error("Please select class and subject");
      return;
    }

    // Validate all marks are entered
    const marksArray = students.map(student => ({
      studentId: student.id,
      marks: marks[student.id] || 0,
    }));

    const missingMarks = students.filter(student => 
      marks[student.id] === undefined || marks[student.id] === null
    );

    if (missingMarks.length > 0) {
      toast.error(`Please enter marks for all students. Missing: ${missingMarks.length} students`);
      return;
    }

    // Validate marks are within range
    const invalidMarks = marksArray.filter(entry => 
      entry.marks < 0 || entry.marks > examSubjectData.maxMarks
    );

    if (invalidMarks.length > 0) {
      toast.error(`Some marks are invalid. Marks should be between 0 and ${examSubjectData.maxMarks}`);
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`/api/marks-entry/${examId}/${selectedClass}/${selectedSubject}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          marks: marksArray,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit marks");
      }

      toast.success("Marks submitted successfully! Subject marks are now locked.");
      
      // Refresh the page to show updated status
      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit marks");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !selectedClass) {
    return (
      <div className="bg-white p-6 rounded-md flex-1 m-4 mt-0">
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">Loading...</div>
        </div>
      </div>
    );
  }

  if (error && !selectedClass) {
    return (
      <div className="bg-white p-6 rounded-md flex-1 m-4 mt-0">
        <div className="flex flex-col items-center justify-center h-64">
          <div className="text-red-600 text-lg mb-4">Error: {error}</div>
          <button
            onClick={() => router.back()}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-md flex-1 m-4 mt-0 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Subject-wise Marks Entry</h1>
          <p className="text-gray-600 mt-1">Enter marks for each subject by class</p>
        </div>
        <Link
          href={`/list/exams/${examId}`}
          className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md"
        >
          Back to Exam
        </Link>
      </div>

      {/* Class Selection */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-3">Step 1: Select Class</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {classes.map((cls) => (
            <button
              key={cls.id}
              onClick={() => {
                setSelectedClass(cls.id);
                setSelectedSubject(null);
                setStudents([]);
              }}
              className={`p-3 rounded-lg border-2 transition-colors ${ 
                selectedClass === cls.id
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              {cls.name}
            </button>
          ))}
        </div>
      </div>

      {/* Subject Selection */}
      {selectedClass && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-3">Step 2: Select Subject</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {examSubjects.map((subject) => (
              <button
                key={subject.id}
                onClick={() => setSelectedSubject(subject.subjectId)}
                disabled={subject.marksEntered}
                className={`p-4 rounded-lg border-2 text-left transition-colors ${
                  selectedSubject === subject.subjectId
                    ? "border-blue-500 bg-blue-50"
                    : subject.marksEntered
                    ? "border-green-500 bg-green-50 text-green-700 cursor-not-allowed"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="font-medium">{subject.subject.name}</div>
                <div className="text-sm text-gray-600 mt-1">
                  Max Marks: {subject.maxMarks}
                </div>
                <div className="text-sm mt-1">
                  Teacher: {subject.teacher ? `${subject.teacher.name} ${subject.teacher.surname}` : "Not assigned"}
                </div>
                {subject.marksEntered && (
                  <div className="text-xs text-green-600 mt-1 font-medium">
                    ✓ Marks Entered & Locked
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Marks Entry */}
      {selectedClass && selectedSubject && examSubjectData && (
        <div className="bg-white border rounded-lg">
          <div className="p-4 border-b bg-gray-50">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">
                Enter Marks for {examSubjectData.subject.name}
              </h2>
              <div className="text-sm text-gray-600">
                Max Marks: {examSubjectData.maxMarks}
              </div>
            </div>
            {examSubjectData.marksEntered && (
              <div className="mt-2 text-sm text-green-600 font-medium">
                ⚠️ Marks for this subject have been entered and locked
              </div>
            )}
          </div>

          <div className="p-4">
            {loading ? (
              <div className="text-center py-8">Loading students...</div>
            ) : error ? (
              <div className="text-center py-8 text-red-600">{error}</div>
            ) : students.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No students found for this class
              </div>
            ) : (
              <div className="space-y-3">
                {students.map((student) => (
                  <div
                    key={student.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <h3 className="font-medium">
                        {student.name} {student.surname}
                      </h3>
                      <p className="text-sm text-gray-600">ID: {student.username}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        min="0"
                        max={examSubjectData.maxMarks}
                        value={marks[student.id] || ""}
                        onChange={(e) =>
                          handleMarkChange(student.id, Number(e.target.value))
                        }
                        disabled={examSubjectData.marksEntered}
                        className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                        placeholder="0"
                      />
                      <span className="text-sm text-gray-600">
                        / {examSubjectData.maxMarks}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Action Buttons */}
            {!examSubjectData.marksEntered && students.length > 0 && (
              <div className="mt-6 flex justify-end space-x-4">
                <button
                  onClick={() => setMarks({})}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Clear All
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting || Object.keys(marks).length === 0}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {submitting ? "Submitting..." : "Submit & Lock Marks"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="font-medium text-yellow-800 mb-2">Instructions:</h3>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• Select a class first, then choose the subject you want to enter marks for</li>
          <li>• You can only enter marks for subjects assigned to you</li>
          <li>• Once submitted, marks will be locked and cannot be changed</li>
          <li>• Make sure all marks are accurate before submitting</li>
          <li>• Green subjects indicate marks have already been entered</li>
        </ul>
      </div>
    </div>
  );
};

export default MarksEntryPage;
