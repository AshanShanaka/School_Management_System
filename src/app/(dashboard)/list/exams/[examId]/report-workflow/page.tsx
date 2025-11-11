"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "react-hot-toast";

interface ClassWorkflow {
  id: number;
  name: string;
  status: "MARKS_ENTRY" | "READY_FOR_REVIEW" | "REVIEWED" | "APPROVED" | "PUBLISHED";
  totalSubjects: number;
  completedSubjects: number;
  submittedAt?: Date;
  reviewedAt?: Date;
  approvedAt?: Date;
  publishedAt?: Date;
  submittedBy?: {
    name: string;
    surname: string;
  };
  reviewedBy?: {
    name: string;
    surname: string;
  };
  approvedBy?: {
    name: string;
    surname: string;
  };
}

interface User {
  role: string;
}

const ReportWorkflowPage = () => {
  const params = useParams();
  const router = useRouter();
  const examId = params.examId as string;

  const [classes, setClasses] = useState<ClassWorkflow[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch user info
        const userResponse = await fetch("/api/auth/current-user");
        if (!userResponse.ok) throw new Error("Failed to fetch user info");
        const userData = await userResponse.json();
        setUser(userData);

        // Fetch workflow status for all classes
        const workflowResponse = await fetch(`/api/report-workflow/${examId}`);
        if (!workflowResponse.ok) throw new Error("Failed to fetch workflow data");
        const workflowData = await workflowResponse.json();
        setClasses(workflowData.classes || []);

      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    if (examId) {
      fetchData();
    }
  }, [examId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "MARKS_ENTRY":
        return "bg-gray-100 text-gray-800";
      case "READY_FOR_REVIEW":
        return "bg-yellow-100 text-yellow-800";
      case "REVIEWED":
        return "bg-blue-100 text-blue-800";
      case "APPROVED":
        return "bg-green-100 text-green-800";
      case "PUBLISHED":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "MARKS_ENTRY":
        return "Marks Entry";
      case "READY_FOR_REVIEW":
        return "Ready for Review";
      case "REVIEWED":
        return "Reviewed";
      case "APPROVED":
        return "Approved";
      case "PUBLISHED":
        return "Published";
      default:
        return status;
    }
  };

  const handleAction = async (classId: number, action: string) => {
    try {
      const response = await fetch(`/api/report-workflow/${examId}/${classId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${action}`);
      }

      toast.success(`Successfully ${action.replace("_", " ")}ed`);
      
      // Refresh data
      window.location.reload();

    } catch (err) {
      toast.error(err instanceof Error ? err.message : `Failed to ${action}`);
    }
  };

  const canPerformAction = (classData: ClassWorkflow, action: string) => {
    if (!user) return false;

    switch (action) {
      case "submit_for_review":
        return user.role === "TEACHER" && 
               classData.status === "MARKS_ENTRY" && 
               classData.completedSubjects === classData.totalSubjects;
      case "approve":
        return user.role === "TEACHER" && classData.status === "READY_FOR_REVIEW";
      case "approve_final":
        return user.role === "ADMIN" && classData.status === "REVIEWED";
      case "publish":
        return user.role === "ADMIN" && classData.status === "APPROVED";
      case "reject":
        return (user.role === "TEACHER" && classData.status === "READY_FOR_REVIEW") ||
               (user.role === "ADMIN" && (classData.status === "REVIEWED" || classData.status === "APPROVED"));
      default:
        return false;
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-md flex-1 m-4 mt-0">
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">Loading workflow data...</div>
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

  return (
    <div className="bg-white p-6 rounded-md flex-1 m-4 mt-0 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Report Card Workflow</h1>
          <p className="text-gray-600 mt-1">Track and manage report card generation process</p>
        </div>
        <div className="flex space-x-3">
          <Link
            href={`/list/exams/${examId}/marks-entry-workflow`}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
          >
            Marks Entry
          </Link>
          <Link
            href={`/list/exams/${examId}`}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md"
          >
            Back to Exam
          </Link>
        </div>
      </div>

      {/* Workflow Summary */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-gray-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-gray-600">
            {classes.filter(c => c.status === "MARKS_ENTRY").length}
          </div>
          <div className="text-sm text-gray-600">Marks Entry</div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-yellow-600">
            {classes.filter(c => c.status === "READY_FOR_REVIEW").length}
          </div>
          <div className="text-sm text-yellow-600">Ready for Review</div>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-blue-600">
            {classes.filter(c => c.status === "REVIEWED").length}
          </div>
          <div className="text-sm text-blue-600">Reviewed</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-green-600">
            {classes.filter(c => c.status === "APPROVED").length}
          </div>
          <div className="text-sm text-green-600">Approved</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-purple-600">
            {classes.filter(c => c.status === "PUBLISHED").length}
          </div>
          <div className="text-sm text-purple-600">Published</div>
        </div>
      </div>

      {/* Classes List */}
      <div className="space-y-4">
        {classes.map((classData) => (
          <div key={classData.id} className="border border-gray-200 rounded-lg p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-3">
                  <h3 className="text-lg font-semibold">{classData.name}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(classData.status)}`}>
                    {getStatusText(classData.status)}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <div className="text-sm text-gray-600">Subjects Progress</div>
                    <div className="text-lg font-medium">
                      {classData.completedSubjects} / {classData.totalSubjects}
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${(classData.completedSubjects / classData.totalSubjects) * 100}%` }}
                      />
                    </div>
                  </div>

                  {classData.submittedAt && (
                    <div>
                      <div className="text-sm text-gray-600">Submitted</div>
                      <div className="text-sm">
                        {new Date(classData.submittedAt).toLocaleDateString()}
                      </div>
                      {classData.submittedBy && (
                        <div className="text-xs text-gray-500">
                          by {classData.submittedBy.name} {classData.submittedBy.surname}
                        </div>
                      )}
                    </div>
                  )}

                  {classData.reviewedAt && (
                    <div>
                      <div className="text-sm text-gray-600">Reviewed</div>
                      <div className="text-sm">
                        {new Date(classData.reviewedAt).toLocaleDateString()}
                      </div>
                      {classData.reviewedBy && (
                        <div className="text-xs text-gray-500">
                          by {classData.reviewedBy.name} {classData.reviewedBy.surname}
                        </div>
                      )}
                    </div>
                  )}

                  {classData.approvedAt && (
                    <div>
                      <div className="text-sm text-gray-600">Approved</div>
                      <div className="text-sm">
                        {new Date(classData.approvedAt).toLocaleDateString()}
                      </div>
                      {classData.approvedBy && (
                        <div className="text-xs text-gray-500">
                          by {classData.approvedBy.name} {classData.approvedBy.surname}
                        </div>
                      )}
                    </div>
                  )}

                  {classData.publishedAt && (
                    <div>
                      <div className="text-sm text-gray-600">Published</div>
                      <div className="text-sm">
                        {new Date(classData.publishedAt).toLocaleDateString()}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col space-y-2 ml-6">
                {/* Action Buttons */}
                {canPerformAction(classData, "submit_for_review") && (
                  <button
                    onClick={() => handleAction(classData.id, "submit_for_review")}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-md text-sm"
                  >
                    Submit for Review
                  </button>
                )}

                {canPerformAction(classData, "approve") && (
                  <button
                    onClick={() => handleAction(classData.id, "approve")}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm"
                  >
                    Approve
                  </button>
                )}

                {canPerformAction(classData, "approve_final") && (
                  <button
                    onClick={() => handleAction(classData.id, "approve_final")}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm"
                  >
                    Final Approval
                  </button>
                )}

                {canPerformAction(classData, "publish") && (
                  <button
                    onClick={() => handleAction(classData.id, "publish")}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm"
                  >
                    Publish
                  </button>
                )}

                {canPerformAction(classData, "reject") && (
                  <button
                    onClick={() => handleAction(classData.id, "reject")}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm"
                  >
                    Reject
                  </button>
                )}

                {/* View Reports */}
                {classData.status === "PUBLISHED" && (
                  <Link
                    href={`/list/exams/${examId}/report-cards/${classData.id}`}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm text-center"
                  >
                    View Reports
                  </Link>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Role-based Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-800 mb-2">Workflow Instructions:</h3>
        <div className="text-sm text-blue-700 space-y-2">
          {user?.role === "TEACHER" && (
            <div>
              <div className="font-medium">As a Class Teacher:</div>
              <ul className="ml-4 space-y-1">
                <li>• Wait for all subject teachers to complete marks entry</li>
                <li>• Submit classes for review once all subjects are complete</li>
                <li>• Review and approve classes submitted by other teachers</li>
              </ul>
            </div>
          )}
          {user?.role === "ADMIN" && (
            <div>
              <div className="font-medium">As an Admin:</div>
              <ul className="ml-4 space-y-1">
                <li>• Give final approval to reviewed classes</li>
                <li>• Publish approved report cards to make them available to students/parents</li>
                <li>• Monitor the overall workflow progress</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportWorkflowPage;
