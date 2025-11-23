'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Grade {
  id: number;
  level: number;
}

interface Subject {
  id: number;
  name: string;
}

interface CreateHistoricalExamFormProps {
  grades: Grade[];
  subjects: Subject[];
}

export default function CreateHistoricalExamForm({
  grades,
  subjects,
}: CreateHistoricalExamFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    term: '',
    year: new Date().getFullYear(),
    gradeId: '',
    selectedSubjects: [] as number[],
  });

  const handleSubjectToggle = (subjectId: number) => {
    setFormData((prev) => {
      const isSelected = prev.selectedSubjects.includes(subjectId);
      return {
        ...prev,
        selectedSubjects: isSelected
          ? prev.selectedSubjects.filter((id) => id !== subjectId)
          : [...prev.selectedSubjects, subjectId],
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/exams/create-historical', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          term: formData.term,
          year: formData.year,
          gradeId: parseInt(formData.gradeId),
          subjectIds: formData.selectedSubjects,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create historical exam');
      }

      const result = await response.json();
      alert(`✓ Historical exam created successfully!\n\nExam ID: ${result.examId}\n\nYou can now enter marks for this exam.`);
      router.push(`/teacher/marks-entry?examId=${result.examId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-lg shadow p-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          {error}
        </div>
      )}

      {/* Exam Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Exam Title *
        </label>
        <input
          type="text"
          required
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="e.g., Grade 9 - Term 1, Grade 10 - Annual Exam"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <p className="text-xs text-gray-500 mt-1">
          Use a descriptive name that includes the grade and term/year
        </p>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Optional description..."
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Term and Year */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Term *
          </label>
          <input
            type="text"
            required
            value={formData.term}
            onChange={(e) => setFormData({ ...formData, term: e.target.value })}
            placeholder="e.g., Term 1, Annual"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Year *
          </label>
          <input
            type="number"
            required
            value={formData.year}
            onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
            min="2020"
            max={new Date().getFullYear()}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Grade Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Grade Level *
        </label>
        <select
          required
          value={formData.gradeId}
          onChange={(e) => setFormData({ ...formData, gradeId: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">-- Select Grade --</option>
          {grades.map((grade) => (
            <option key={grade.id} value={grade.id}>
              Grade {grade.level}
            </option>
          ))}
        </select>
      </div>

      {/* Subject Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Subjects * (Select at least one)
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-4">
          {subjects.map((subject) => (
            <label
              key={subject.id}
              className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
            >
              <input
                type="checkbox"
                checked={formData.selectedSubjects.includes(subject.id)}
                onChange={() => handleSubjectToggle(subject.id)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm">{subject.name}</span>
            </label>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Selected: {formData.selectedSubjects.length} subjects
        </p>
      </div>

      {/* Submit Buttons */}
      <div className="flex gap-4 pt-4 border-t">
        <button
          type="submit"
          disabled={loading || formData.selectedSubjects.length === 0}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Creating...' : 'Create Historical Exam'}
        </button>

        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
