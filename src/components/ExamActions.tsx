"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, Edit, Trash2, Calendar, PenLine, BarChart3, AlertTriangle, Loader2 } from "lucide-react";

interface ExamActionsProps {
  examId: number;
  role: string;
  onDelete?: () => void;
}

export default function ExamActions({ examId, role, onDelete }: ExamActionsProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this exam? This action cannot be undone.")) {
      setShowDeleteConfirm(false);
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/exams/${examId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete exam");
      }

      // Show success message
      alert("Exam deleted successfully");
      
      // Refresh the page to update the list
      router.refresh();
      
      if (onDelete) {
        onDelete();
      }
    } catch (error) {
      console.error("Error deleting exam:", error);
      alert(error instanceof Error ? error.message : "Failed to delete exam");
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Timetable Button */}
      <Link href={`/list/exams/timetable/${examId}`} className="flex-1">
        <button
          className="w-full px-4 py-2 bg-white/70 hover:bg-blue-500 text-gray-700 hover:text-white rounded-lg transition-all font-semibold text-sm border border-blue-200 hover:border-blue-600 flex items-center justify-center gap-2 group"
          title="View Timetable"
        >
          <Calendar className="w-4 h-4 opacity-70 group-hover:opacity-100" />
          <span>Timetable</span>
        </button>
      </Link>

      {role === "admin" && (
        <>
          {/* View Button */}
          <Link href={`/list/exams/${examId}`}>
            <button 
              className="w-10 h-10 bg-white/70 hover:bg-blue-500 text-gray-700 hover:text-white rounded-lg transition-all border border-blue-200 hover:border-blue-600 flex items-center justify-center group" 
              title="View Details"
            >
              <Eye className="w-4 h-4 opacity-70 group-hover:opacity-100" />
            </button>
          </Link>

          {/* Edit Button */}
          <Link href={`/list/exams/${examId}/edit`}>
            <button 
              className="w-10 h-10 bg-white/70 hover:bg-purple-500 text-gray-700 hover:text-white rounded-lg transition-all border border-purple-200 hover:border-purple-600 flex items-center justify-center group" 
              title="Edit Exam"
            >
              <Edit className="w-4 h-4 opacity-70 group-hover:opacity-100" />
            </button>
          </Link>

          {/* Delete Button */}
          <button
            onClick={() => setShowDeleteConfirm(true)}
            disabled={isDeleting}
            className="w-10 h-10 bg-white/70 hover:bg-red-500 text-gray-700 hover:text-white rounded-lg transition-all border border-red-200 hover:border-red-600 flex items-center justify-center group disabled:opacity-50 disabled:cursor-not-allowed"
            title="Delete Exam"
          >
            {isDeleting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4 opacity-70 group-hover:opacity-100" />
            )}
          </button>
        </>
      )}

      {role === "teacher" && (
        <>
          {/* Marks Entry Button */}
          <Link href={`/teacher/marks-entry/${examId}`}>
            <button 
              className="w-10 h-10 bg-white/70 hover:bg-yellow-500 text-gray-700 hover:text-white rounded-lg transition-all border border-yellow-200 hover:border-yellow-600 flex items-center justify-center group" 
              title="Enter Marks"
            >
              <PenLine className="w-4 h-4 opacity-70 group-hover:opacity-100" />
            </button>
          </Link>

          {/* View Results Button */}
          <Link href={`/teacher/exam-results/${examId}`}>
            <button 
              className="w-10 h-10 bg-white/70 hover:bg-green-500 text-gray-700 hover:text-white rounded-lg transition-all border border-green-200 hover:border-green-600 flex items-center justify-center group" 
              title="View Results"
            >
              <BarChart3 className="w-4 h-4 opacity-70 group-hover:opacity-100" />
            </button>
          </Link>
        </>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowDeleteConfirm(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Exam?</h3>
              <p className="text-gray-600">
                Are you sure you want to delete this exam? This action cannot be undone.
              </p>
              <p className="text-sm text-red-600 mt-2">
                Note: You cannot delete exams with existing results.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-semibold transition-all"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
