"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface ExamData {
  id: number;
  title: string;
  status: string;
  grade: {
    id: number;
    level: number;
  };
  examSubjects: Array<{
    id: number;
    subject: {
      id: number;
      name: string;
    };
    teacher: {
      id: string;
      name: string;
      surname: string;
    };
  }>;
}

interface WorkflowData {
  exam: ExamData;
  progress: {
    totalSubjects: number;
    studentsWithResults: number;
    totalStudents: number;
    percentage: number;
  };
  results: number;
}

const ExamWorkflowPage = () => {
  const { examId } = useParams();
  const [workflowData, setWorkflowData] = useState<WorkflowData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWorkflowData = async () => {
      try {
        const response = await fetch(`/api/exam-workflow/${examId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch workflow data");
        }
        const data = await response.json();
        setWorkflowData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    if (examId) {
      fetchWorkflowData();
    }
  }, [examId]);

  const handleWorkflowAction = async (action: string) => {
    try {
      const response = await fetch(`/api/exam-workflow/${examId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
      });

      if (!response.ok) {
        throw new Error("Failed to update workflow");
      }

      // Refresh data
      window.location.reload();
    } catch (err) {
      alert(err instanceof Error ? err.message : "An error occurred");
    }
  };

  if (loading) {
    return <div className="p-6">Loading workflow data...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-600">Error: {error}</div>;
  }

  if (!workflowData) {
    return <div className="p-6">No workflow data found</div>;
  }

  const { exam, progress } = workflowData;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Exam Workflow: {exam.title}
        </h1>
        <p className="text-gray-600 mt-2">
          Grade {exam.grade.level} • Status: {exam.status}
        </p>
      </div>

      {/* Progress Overview */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Progress Overview</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {progress.totalSubjects}
            </div>
            <div className="text-sm text-gray-600">Total Subjects</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {progress.studentsWithResults}
            </div>
            <div className="text-sm text-gray-600">Students with Results</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {progress.totalStudents}
            </div>
            <div className="text-sm text-gray-600">Total Students</div>
          </div>
        </div>
        
        <div className="mt-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Overall Progress</span>
            <span>{progress.percentage.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress.percentage}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Subject Status */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Subject Status</h2>
        <div className="grid gap-4">
          {exam.examSubjects.map((subject) => (
            <div
              key={subject.id}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div>
                <h3 className="font-medium">{subject.subject.name}</h3>
                <p className="text-sm text-gray-600">
                  Teacher: {subject.teacher.name} {subject.teacher.surname}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-sm">
                  Pending
                </span>
                <a
                  href={`/list/exams/${exam.id}/marks-entry-simple?subject=${subject.subject.id}`}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                >
                  Enter Marks
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Workflow Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Workflow Actions</h2>
        <div className="flex space-x-4">
          <button
            onClick={() => handleWorkflowAction("start_marks_entry")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Start Marks Entry
          </button>
          <button
            onClick={() => handleWorkflowAction("publish_results")}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Publish Results
          </button>
          <a
            href={`/list/results?examId=${exam.id}`}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors inline-block"
          >
            View Results
          </a>
        </div>
      </div>
    </div>
  );
};

export default ExamWorkflowPage;
