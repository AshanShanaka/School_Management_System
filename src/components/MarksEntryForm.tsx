"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface Student {
  id: string;
  name: string;
  surname: string;
  username: string;
  admissionNumber: string;
}

interface ExistingResult {
  id: number;
  studentId: string;
  marks: number | null;
  grade: string | null;
}

interface MarksEntryFormProps {
  examId: number;
  subjectId: number;
  classId: number;
  students: Student[];
  existingResults: Record<string, ExistingResult>;
  maxMarks: number;
  marksEntered: boolean;
}

const MarksEntryForm: React.FC<MarksEntryFormProps> = ({
  examId,
  subjectId,
  classId,
  students,
  existingResults,
  maxMarks,
  marksEntered,
}) => {
  const router = useRouter();
  const [marks, setMarks] = useState<Record<string, string>>(() => {
    const initialMarks: Record<string, string> = {};
    students.forEach(student => {
      const existing = existingResults[student.id];
      initialMarks[student.id] = existing?.marks?.toString() || "";
    });
    return initialMarks;
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleMarksChange = (studentId: string, value: string) => {
    // Allow empty string or valid numbers
    if (value === "" || (/^\d*\.?\d*$/.test(value) && parseFloat(value) <= maxMarks)) {
      setMarks(prev => ({
        ...prev,
        [studentId]: value,
      }));
    }
  };

  const calculateGrade = (marks: number, maxMarks: number): string => {
    const percentage = (marks / maxMarks) * 100;
    
    if (percentage >= 85) return "A";
    if (percentage >= 75) return "B";
    if (percentage >= 65) return "C";
    if (percentage >= 55) return "S";
    if (percentage >= 35) return "W";
    return "F";
  };

  const handleSubmit = async (isDraft: boolean = false) => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const resultsData = students.map(student => ({
        studentId: student.id,
        marks: marks[student.id] ? parseFloat(marks[student.id]) : null,
        grade: marks[student.id] ? calculateGrade(parseFloat(marks[student.id]), maxMarks) : null,
      })).filter(result => result.marks !== null);

      const response = await fetch(`/api/marks-entry-new/${examId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subjectId,
          classId,
          results: resultsData,
          isDraft,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save marks");
      }

      setSuccess(isDraft ? "Marks saved as draft successfully!" : "Marks submitted successfully!");
      
      // Refresh the page to show updated data
      setTimeout(() => {
        router.refresh();
      }, 1500);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getEnteredCount = () => {
    return Object.values(marks).filter(mark => mark.trim() !== "").length;
  };

  const hasUnsavedChanges = () => {
    return students.some(student => {
      const currentMark = marks[student.id];
      const existingMark = existingResults[student.id]?.marks?.toString() || "";
      return currentMark !== existingMark;
    });
  };

  return (
    <div className="space-y-6">
      {/* Status Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <span className="text-red-600 text-lg">❌</span>
            <p className="text-red-800 font-medium">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <span className="text-green-600 text-lg">✅</span>
            <p className="text-green-800 font-medium">{success}</p>
          </div>
        </div>
      )}

      {/* Progress Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-blue-900">Entry Progress</h3>
            <p className="text-sm text-blue-700">
              {getEnteredCount()} of {students.length} students have marks entered
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-700">
              {Math.round((getEnteredCount() / students.length) * 100)}%
            </div>
            <div className="text-xs text-blue-600">Complete</div>
          </div>
        </div>
      </div>

      {/* Marks Entry Table */}
      <div className="bg-white border rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Student Marks</h3>
          <p className="text-sm text-gray-600">Maximum marks: {maxMarks}</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Admission No.
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Marks
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Grade
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Percentage
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {students.map((student, index) => {
                const studentMarks = marks[student.id];
                const marksValue = studentMarks ? parseFloat(studentMarks) : null;
                const grade = marksValue ? calculateGrade(marksValue, maxMarks) : "";
                const percentage = marksValue ? Math.round((marksValue / maxMarks) * 100) : "";

                return (
                  <tr key={student.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                          <Image src="/noAvatar.png" alt="" width={32} height={32} className="rounded-full" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {student.name} {student.surname}
                          </div>
                          <div className="text-sm text-gray-500">{student.username}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {student.admissionNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="number"
                        min="0"
                        max={maxMarks}
                        step="0.5"
                        value={studentMarks}
                        onChange={(e) => handleMarksChange(student.id, e.target.value)}
                        className="w-20 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0"
                        disabled={loading}
                      />
                      <span className="ml-1 text-sm text-gray-500">/ {maxMarks}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {grade && (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          grade === "A" ? "bg-green-100 text-green-800" :
                          grade === "B" ? "bg-blue-100 text-blue-800" :
                          grade === "C" ? "bg-yellow-100 text-yellow-800" :
                          grade === "S" ? "bg-orange-100 text-orange-800" :
                          grade === "W" ? "bg-red-100 text-red-800" :
                          "bg-gray-100 text-gray-800"
                        }`}>
                          {grade}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {percentage && `${percentage}%`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          {hasUnsavedChanges() && (
            <span className="text-orange-600 font-medium">⚠️ You have unsaved changes</span>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          <button
            onClick={() => handleSubmit(true)}
            disabled={loading || getEnteredCount() === 0}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? "Saving..." : "Save as Draft"}
          </button>
          
          <button
            onClick={() => handleSubmit(false)}
            disabled={loading || getEnteredCount() < students.length}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? "Submitting..." : "Submit Marks"}
          </button>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="font-semibold text-yellow-900 mb-2">Instructions</h4>
        <ul className="text-sm text-yellow-800 space-y-1">
          <li>• Enter marks for each student (0 to {maxMarks})</li>
          <li>• Grades are calculated automatically: A (85%+), B (75%+), C (65%+), S (55%+), W (35%+), F (&lt;35%)</li>
          <li>• Use "Save as Draft" to save your progress without submitting</li>
          <li>• "Submit Marks" requires all students to have marks entered</li>
          <li>• You can edit marks until the marks entry deadline</li>
        </ul>
      </div>
    </div>
  );
};

export default MarksEntryForm;
