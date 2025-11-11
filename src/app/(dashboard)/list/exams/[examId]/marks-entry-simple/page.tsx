"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";

interface Student {
  id: string;
  name: string;
  surname: string;
  username: string;
}

interface Subject {
  id: number;
  name: string;
}

interface ExamSubject {
  id: number;
  subjectId: number;
  maxMarks: number;
  subject: Subject;
}

interface ExamData {
  id: number;
  title: string;
  examSubjects: ExamSubject[];
}

const MarksEntryPage = () => {
  const { examId } = useParams();
  const searchParams = useSearchParams();
  const subjectIdParam = searchParams.get("subject");

  const [exam, setExam] = useState<ExamData | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<ExamSubject | null>(null);
  const [marks, setMarks] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch exam data
        const examResponse = await fetch(`/api/exams/${examId}`);
        if (!examResponse.ok) throw new Error("Failed to fetch exam data");
        const examData = await examResponse.json();
        setExam(examData);

        // Set selected subject
        if (subjectIdParam) {
          const subject = examData.examSubjects.find(
            (es: ExamSubject) => es.subjectId === parseInt(subjectIdParam)
          );
          setSelectedSubject(subject || null);
        } else if (examData.examSubjects.length > 0) {
          setSelectedSubject(examData.examSubjects[0]);
        }

        // Fetch students
        const studentsResponse = await fetch(`/api/students`);
        if (!studentsResponse.ok) throw new Error("Failed to fetch students");
        const studentsData = await studentsResponse.json();
        
        // Ensure studentsData is an array
        if (Array.isArray(studentsData)) {
          setStudents(studentsData);
        } else if (studentsData.students && Array.isArray(studentsData.students)) {
          setStudents(studentsData.students);
        } else {
          console.error("Invalid students data format:", studentsData);
          setStudents([]);
        }

      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    if (examId) {
      fetchData();
    }
  }, [examId, subjectIdParam]);

  const handleMarkChange = (studentId: string, mark: number) => {
    setMarks(prev => ({
      ...prev,
      [studentId]: mark
    }));
  };

  const handleSubmit = async () => {
    if (!selectedSubject) return;

    setSubmitting(true);
    try {
      const response = await fetch(`/api/marks-entry-simple/${examId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subjectId: selectedSubject.subjectId,
          marks: Object.entries(marks).map(([studentId, score]) => ({
            studentId,
            score: Number(score),
          })),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit marks");
      }

      alert("Marks submitted successfully!");
      setMarks({});
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to submit marks");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-600">Error: {error}</div>;
  }

  if (!exam) {
    return <div className="p-6">Exam not found</div>;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Marks Entry: {exam.title}
        </h1>
        <p className="text-gray-600 mt-2">
          Enter marks for students in the selected subject
        </p>
      </div>

      {/* Subject Selection */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Select Subject</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {exam.examSubjects.map((examSubject) => (
            <button
              key={examSubject.id}
              onClick={() => setSelectedSubject(examSubject)}
              className={`p-4 border rounded-lg text-left transition-colors ${
                selectedSubject?.id === examSubject.id
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <h3 className="font-medium">{examSubject.subject.name}</h3>
              <p className="text-sm text-gray-600">
                Max Marks: {examSubject.maxMarks}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Marks Entry */}
      {selectedSubject && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">
              Enter Marks for {selectedSubject.subject.name}
            </h2>
            <p className="text-sm text-gray-600">
              Max Marks: {selectedSubject.maxMarks}
            </p>
          </div>

          <div className="space-y-4">
            {Array.isArray(students) && students.length > 0 ? (
              students.slice(0, 10).map((student) => (
                <div
                  key={student.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
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
                      max={selectedSubject.maxMarks}
                      value={marks[student.id] || ""}
                      onChange={(e) =>
                        handleMarkChange(student.id, Number(e.target.value))
                      }
                      className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                    />
                    <span className="text-sm text-gray-600">
                      / {selectedSubject.maxMarks}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No students found for this exam.</p>
                <p className="text-sm mt-2">Please check if students are enrolled in the class.</p>
              </div>
            )}
          </div>

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
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? "Submitting..." : "Submit Marks"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarksEntryPage;
