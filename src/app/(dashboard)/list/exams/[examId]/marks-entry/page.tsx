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

const MarksEntryPage = () => {
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
        setStudents(data.students || []);
        
        // Auto-select first subject if teacher has only one
        if (data.exam.examSubjects.length === 1) {
          setSelectedSubject(data.exam.examSubjects[0]);
        }
        
        // Initialize marks object
        const initialMarks: Record<string, number | null> = {};
        (data.students || []).forEach((student: Student) => {
          initialMarks[student.id] = null;
        });
        setMarks(initialMarks);
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

  const handleSubmitMarks = async () => {
    if (!selectedSubject) {
      toast.error("Please select a subject");
      return;
    }

    // Validate marks
    const marksArray = Object.entries(marks).map(([studentId, marksObtained]) => ({
      studentId,
      marksObtained
    }));

    // Check for invalid marks
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
        
        if (result.allSubjectsCompleted) {
          toast.success("All subjects completed! Exam moved to class review phase.");
        }
        
        // Refresh data
        fetchMarksEntryData();
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

  const filteredStudents = students.filter(student =>
    `${student.name} ${student.surname} ${student.username}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "DRAFT":
        return "bg-gray-100 text-gray-800";
      case "MARKS_ENTRY":
        return "bg-blue-100 text-blue-800";
      case "CLASS_REVIEW":
        return "bg-yellow-100 text-yellow-800";
      case "READY_TO_PUBLISH":
        return "bg-green-100 text-green-800";
      case "PUBLISHED":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
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
          <p className="text-gray-500">Exam not found or you don't have access</p>
        </div>
      </div>
    );
  }

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
            <h1 className="text-xl font-semibold">Marks Entry - {exam.title}</h1>
            <p className="text-gray-600">Grade {exam.grade.level}</p>
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(exam.status)}`}>
          {exam.status.replace('_', ' ')}
        </div>
      </div>

      {/* Subject Selection */}
      {exam.examSubjects.length > 1 && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Subject
          </label>
          <select
            value={selectedSubject?.id || ""}
            onChange={(e) => {
              const subject = exam.examSubjects.find(s => s.id === parseInt(e.target.value));
              setSelectedSubject(subject || null);
            }}
            className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select a subject</option>
            {exam.examSubjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.subject.name} (Max: {subject.maxMarks})
                {subject.marksEntered && " ✓"}
              </option>
            ))}
          </select>
        </div>
      )}

      {selectedSubject && (
        <>
          {/* Subject Info */}
          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-blue-900">
                  {selectedSubject.subject.name}
                </h3>
                <p className="text-blue-700">
                  Maximum Marks: {selectedSubject.maxMarks}
                </p>
                <p className="text-blue-700">
                  Teacher: {selectedSubject.teacher.name} {selectedSubject.teacher.surname}
                </p>
              </div>
              {selectedSubject.marksEntered && (
                <div className="flex items-center gap-2 text-green-600">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <span className="font-medium">Marks Entered</span>
                </div>
              )}
            </div>
          </div>

          {/* Search */}
          <div className="mb-4">
            <div className="relative">
              <Image
                src="/search.png"
                alt="Search"
                width={16}
                height={16}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full max-w-md border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Marks Entry Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Username
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Marks (Max: {selectedSubject.maxMarks})
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {student.name} {student.surname}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {student.username}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="number"
                        min="0"
                        max={selectedSubject.maxMarks}
                        value={marks[student.id] ?? ""}
                        onChange={(e) => handleMarkChange(student.id, e.target.value)}
                        className="w-24 px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Submit Button */}
          <div className="mt-6 flex justify-end gap-4">
            <button
              onClick={() => router.back()}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmitMarks}
              disabled={saving}
              className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <Image src="/create.png" alt="" width={14} height={14} />
                  Submit Marks
                </>
              )}
            </button>
          </div>
        </>
      )}

      {!selectedSubject && exam.examSubjects.length > 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">Please select a subject to enter marks</p>
          <div className="space-y-2">
            {exam.examSubjects.map((subject) => (
              <button
                key={subject.id}
                onClick={() => setSelectedSubject(subject)}
                className="block w-full max-w-md mx-auto p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-left"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{subject.subject.name}</h3>
                    <p className="text-sm text-gray-600">Max Marks: {subject.maxMarks}</p>
                  </div>
                  {subject.marksEntered && (
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {exam.examSubjects.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No subjects assigned to you for this exam</p>
        </div>
      )}
    </div>
  );
};

export default MarksEntryPage;
