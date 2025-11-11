"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

interface ExamType {
  id: number;
  name: string;
}

interface Grade {
  id: number;
  level: number;
}

interface ExamData {
  id: number;
  title: string;
  year: number;
  term: number;
  examTypeEnum: string;
  status: string;
  grade: {
    id: number;
    level: number;
  };
  examType: {
    id: number;
    name: string;
  };
}

const ExamEditPage = () => {
  const { examId } = useParams();
  const router = useRouter();
  const [examData, setExamData] = useState<ExamData | null>(null);
  const [examTypes, setExamTypes] = useState<ExamType[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    title: "",
    year: "",
    term: "",
    examTypeEnum: "",
    gradeId: "",
    status: ""
  });

  useEffect(() => {
    fetchExamData();
    fetchExamTypes();
    fetchGrades();
  }, [examId]);

  useEffect(() => {
    if (examData) {
      setFormData({
        title: examData.title,
        year: examData.year.toString(),
        term: examData.term.toString(),
        examTypeEnum: examData.examTypeEnum,
        gradeId: examData.grade.id.toString(),
        status: examData.status
      });
    }
  }, [examData]);

  const fetchExamData = async () => {
    try {
      const response = await fetch(`/api/exams/${examId}`);
      if (!response.ok) {
        if (response.status === 404) {
          setError("Exam not found");
        } else {
          throw new Error("Failed to fetch exam data");
        }
        return;
      }
      const data = await response.json();
      setExamData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const fetchExamTypes = async () => {
    try {
      const response = await fetch("/api/exam-types");
      if (response.ok) {
        const data = await response.json();
        setExamTypes(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Failed to fetch exam types:", error);
    }
  };

  const fetchGrades = async () => {
    try {
      const response = await fetch("/api/grades");
      if (response.ok) {
        const data = await response.json();
        const gradesArray = data.grades || data;
        setGrades(Array.isArray(gradesArray) ? gradesArray : []);
      }
    } catch (error) {
      console.error("Failed to fetch grades:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch(`/api/exams/${examId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: formData.title,
          year: parseInt(formData.year),
          term: parseInt(formData.term),
          examTypeEnum: formData.examTypeEnum,
          status: formData.status
        }),
      });

      if (response.ok) {
        toast.success("Exam updated successfully");
        router.push(`/list/exams/${examId}`);
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to update exam");
      }
    } catch (error) {
      toast.error("Failed to update exam");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-md flex-1 m-4 mt-0">
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">Loading exam data...</div>
        </div>
      </div>
    );
  }

  if (error) {
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

  if (!examData) {
    return (
      <div className="bg-white p-6 rounded-md flex-1 m-4 mt-0">
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">No exam data found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-md flex-1 m-4 mt-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Exam</h1>
          <p className="text-gray-600 mt-1">Update exam details and settings</p>
        </div>
        <button
          onClick={() => router.back()}
          className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md"
        >
          Cancel
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Title */}
          <div className="md:col-span-2">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Exam Title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter exam title"
            />
          </div>

          {/* Grade */}
          <div>
            <label htmlFor="gradeId" className="block text-sm font-medium text-gray-700 mb-2">
              Grade *
            </label>
            <select
              id="gradeId"
              name="gradeId"
              value={formData.gradeId}
              onChange={handleChange}
              required
              disabled // Grade should not be editable after creation to maintain data integrity
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-gray-100"
            >
              <option value="">Select Grade</option>
              {grades.map((grade) => (
                <option key={grade.id} value={grade.id}>
                  Grade {grade.level}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Grade cannot be changed after exam creation to maintain data integrity
            </p>
          </div>

          {/* Exam Type */}
          <div>
            <label htmlFor="examTypeEnum" className="block text-sm font-medium text-gray-700 mb-2">
              Exam Type *
            </label>
            <select
              id="examTypeEnum"
              name="examTypeEnum"
              value={formData.examTypeEnum}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select Exam Type</option>
              <option value="UNIT">Unit Test</option>
              <option value="TERM">Term Exam</option>
              <option value="TRIAL_OL">Trial O/L</option>
              <option value="NATIONAL_OL">National O/L</option>
            </select>
          </div>

          {/* Year */}
          <div>
            <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-2">
              Year *
            </label>
            <input
              type="number"
              id="year"
              name="year"
              value={formData.year}
              onChange={handleChange}
              required
              min="2020"
              max="2030"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Term */}
          <div>
            <label htmlFor="term" className="block text-sm font-medium text-gray-700 mb-2">
              Term *
            </label>
            <select
              id="term"
              name="term"
              value={formData.term}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select Term</option>
              <option value="1">Term 1</option>
              <option value="2">Term 2</option>
              <option value="3">Term 3</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
              Status *
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select Status</option>
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
            </select>
          </div>
        </div>

        {/* Warning for Published Exams */}
        {formData.status === "PUBLISHED" && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Published Exam Warning
                </h3>
                <p className="mt-1 text-sm text-yellow-700">
                  This exam is currently published and visible to students and teachers. 
                  Changes may affect existing results and student access.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-6 py-2 rounded-md"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving..." : "Update Exam"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ExamEditPage;
