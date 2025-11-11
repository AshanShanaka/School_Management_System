"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "react-hot-toast";
import Image from "next/image";

interface Exam {
  id: number;
  title: string;
  status: string;
  year: number;
  term: number;
  examTypeEnum: string;
  grade: {
    id: number;
    level: number;
  };
  examSubjects: Array<{
    id: number;
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
  }>;
}

interface WorkflowProgress {
  totalSubjects: number;
  completedSubjects: number;
  percentage: number;
}

const ExamWorkflowPage = () => {
  const router = useRouter();
  const params = useParams();
  const examId = params.examId as string;

  const [exam, setExam] = useState<Exam | null>(null);
  const [progress, setProgress] = useState<WorkflowProgress>({
    totalSubjects: 0,
    completedSubjects: 0,
    percentage: 0,
  });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (examId) {
      fetchExamWorkflow();
    }
  }, [examId]);

  const fetchExamWorkflow = async () => {
    try {
      const response = await fetch(`/api/exam-workflow/${examId}`);
      if (response.ok) {
        const data = await response.json();
        setExam(data.exam);
        setProgress(data.progress);
      } else {
        toast.error("Failed to fetch exam workflow");
      }
    } catch (error) {
      console.error("Error fetching exam workflow:", error);
      toast.error("Failed to fetch exam workflow");
    } finally {
      setLoading(false);
    }
  };

  const handleWorkflowAction = async (action: string, comments?: string) => {
    setActionLoading(true);
    try {
      const response = await fetch(`/api/exam-workflow/${examId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
          comments,
        }),
      });

      if (response.ok) {
        toast.success("Action completed successfully");
        fetchExamWorkflow(); // Refresh data
      } else {
        const error = await response.json();
        toast.error(error.error || "Action failed");
      }
    } catch (error) {
      console.error("Error performing action:", error);
      toast.error("Action failed");
    } finally {
      setActionLoading(false);
    }
  };

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

  const getStatusText = (status: string) => {
    switch (status) {
      case "DRAFT":
        return "Draft";
      case "MARKS_ENTRY":
        return "Marks Entry Phase";
      case "CLASS_REVIEW":
        return "Class Review Phase";
      case "READY_TO_PUBLISH":
        return "Ready to Publish";
      case "PUBLISHED":
        return "Published";
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2">Loading exam workflow...</span>
        </div>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
        <div className="text-center py-12">
          <p className="text-gray-500">Exam not found</p>
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
            <h1 className="text-xl font-semibold">{exam.title}</h1>
            <p className="text-gray-600">
              Grade {exam.grade.level} • {exam.examTypeEnum} • {exam.year}
            </p>
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(exam.status)}`}>
          {getStatusText(exam.status)}
        </div>
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">Total Subjects</p>
              <p className="text-2xl font-bold text-blue-900">{progress.totalSubjects}</p>
            </div>
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
              <Image src="/subject.png" alt="Subjects" width={20} height={20} />
            </div>
          </div>
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">Completed</p>
              <p className="text-2xl font-bold text-green-900">{progress.completedSubjects}</p>
            </div>
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
              <Image src="/result.png" alt="Completed" width={20} height={20} />
            </div>
          </div>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 font-medium">Progress</p>
              <p className="text-2xl font-bold text-purple-900">{progress.percentage.toFixed(0)}%</p>
            </div>
            <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold">%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-medium">Overall Progress</h3>
          <span className="text-sm text-gray-600">
            {progress.completedSubjects} of {progress.totalSubjects} subjects completed
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-blue-500 h-3 rounded-full transition-all duration-300"
            style={{ width: `${progress.percentage}%` }}
          ></div>
        </div>
      </div>

      {/* Subject Status */}
      <div className="mb-8">
        <h3 className="text-lg font-medium mb-4">Subject Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {exam.examSubjects.map((examSubject) => (
            <div
              key={examSubject.id}
              className={`p-4 rounded-lg border-2 ${
                examSubject.marksEntered
                  ? "border-green-200 bg-green-50"
                  : "border-gray-200 bg-gray-50"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">{examSubject.subject.name}</h4>
                <div
                  className={`w-3 h-3 rounded-full ${
                    examSubject.marksEntered ? "bg-green-500" : "bg-gray-300"
                  }`}
                ></div>
              </div>
              <p className="text-sm text-gray-600 mb-1">
                Teacher: {examSubject.teacher.name} {examSubject.teacher.surname}
              </p>
              <p className={`text-sm font-medium ${
                examSubject.marksEntered ? "text-green-600" : "text-gray-500"
              }`}>
                {examSubject.marksEntered ? "Marks Entered" : "Pending"}
              </p>
              {examSubject.marksEnteredAt && (
                <p className="text-xs text-gray-500 mt-1">
                  Completed: {new Date(examSubject.marksEnteredAt).toLocaleDateString()}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-medium mb-4">Workflow Actions</h3>
        <div className="flex flex-wrap gap-4">
          {exam.status === "DRAFT" && (
            <button
              onClick={() => handleWorkflowAction("start_marks_entry")}
              disabled={actionLoading}
              className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {actionLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Image src="/create.png" alt="" width={14} height={14} />
              )}
              Start Marks Entry
            </button>
          )}

          {exam.status === "READY_TO_PUBLISH" && (
            <button
              onClick={() => handleWorkflowAction("publish_results")}
              disabled={actionLoading}
              className="px-6 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {actionLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Image src="/result.png" alt="" width={14} height={14} />
              )}
              Publish Results
            </button>
          )}

          <button
            onClick={() => router.push(`/list/exams/${examId}/marks-entry`)}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 flex items-center gap-2"
          >
            <Image src="/update.png" alt="" width={14} height={14} />
            View Marks Entry
          </button>

          <button
            onClick={() => router.push(`/list/exams`)}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 flex items-center gap-2"
          >
            <Image src="/view.png" alt="" width={14} height={14} />
            Back to Exams
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExamWorkflowPage;
