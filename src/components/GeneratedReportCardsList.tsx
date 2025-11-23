"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

interface ReportCardGeneration {
  id: string;
  examId: number;
  classId: number;
  teacherId: string;
  label: string;
  examTitle: string;
  examYear: number;
  examTerm: number;
  examType: string;
  className: string;
  gradeLevel: number;
  totalStudents: number;
  averagePercentage: number;
  status: string;
  createdAt: string;
  exam: {
    id: number;
    title: string;
    year: number;
    term: number;
    examType: {
      name: string;
    };
    grade: {
      level: number;
    };
  };
  class: {
    name: string;
    grade: {
      level: number;
    };
  };
  teacher: {
    id: string;
    name: string;
    surname: string;
  };
  reportCards: {
    id: number;
    status: string;
  }[];
}

const GeneratedReportCardsList: React.FC = () => {
  const router = useRouter();
  const [generations, setGenerations] = useState<ReportCardGeneration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterYear, setFilterYear] = useState<number | "all">("all");
  const [filterTerm, setFilterTerm] = useState<number | "all">("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchGenerations();
  }, []);

  const fetchGenerations = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await fetch("/api/report-cards/generations");

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to fetch`);
      }

      const data = await response.json();
      console.log("Fetched generations:", data);
      setGenerations(data.generations || []);
    } catch (err: any) {
      console.error("Error fetching generations:", err);
      const errorMessage = err.message || "Failed to load generated report cards";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleViewReportCards = (generation: ReportCardGeneration) => {
    // Navigate to view saved report cards table
    router.push(`/teacher/view-generated-reports/${generation.id}`);
  };

  const handleDeleteGeneration = async (generation: ReportCardGeneration, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click

    const confirmed = window.confirm(
      `Are you sure you want to delete this generation?\n\n` +
      `${generation.label}\n` +
      `This will delete ${generation.reportCards.length} report cards.\n\n` +
      `This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setDeletingId(generation.id);
      toast.loading("Deleting generation...");

      const response = await fetch(`/api/report-cards/generations/${generation.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete generation");
      }

      const data = await response.json();
      toast.dismiss();
      toast.success(`Deleted successfully! ${data.deletedReportCards} report cards removed.`);

      // Refresh the list
      fetchGenerations();
    } catch (err: any) {
      toast.dismiss();
      console.error("Error deleting generation:", err);
      toast.error(err.message || "Failed to delete generation");
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 text-green-800 border-green-200";
      case "PROCESSING":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "FAILED":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getGradeColor = (percentage: number) => {
    if (percentage >= 75) return "text-green-600";
    if (percentage >= 65) return "text-blue-600";
    if (percentage >= 50) return "text-yellow-600";
    if (percentage >= 35) return "text-orange-600";
    return "text-red-600";
  };

  // Get unique years and terms for filtering
  const uniqueYears = Array.from(new Set(generations.map((g) => g.examYear))).sort(
    (a, b) => b - a
  );
  const uniqueTerms = Array.from(new Set(generations.map((g) => g.examTerm))).sort();

  // Filter generations
  const filteredGenerations = generations.filter((gen) => {
    if (filterYear !== "all" && gen.examYear !== filterYear) return false;
    if (filterTerm !== "all" && gen.examTerm !== filterTerm) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="bg-white p-8 rounded-xl shadow-sm">
        <div className="flex items-center justify-center py-12">
          <svg
            className="animate-spin h-10 w-10 text-indigo-600"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span className="ml-3 text-lg text-gray-600">
            Loading generated report cards...
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-8 rounded-xl shadow-sm">
        <div className="text-center py-12">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Error Loading Generated Report Cards
          </h3>
          <p className="text-gray-600 mb-2">{error}</p>
          <p className="text-sm text-gray-500 mb-6">
            Check the browser console for more details
          </p>
          <button
            onClick={fetchGenerations}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 rounded-xl shadow-lg text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Generated Report Cards</h1>
            <p className="text-indigo-100">
              View and manage all report cards you've generated
            </p>
          </div>
          <button
            onClick={() => router.push("/teacher/report-cards")}
            className="px-6 py-3 bg-white text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors font-semibold flex items-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Generate New Report Cards
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      {generations.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-100 rounded-lg">
                <svg
                  className="w-6 h-6 text-indigo-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                  <path
                    fillRule="evenodd"
                    d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <div className="text-sm text-gray-600">Total Generations</div>
                <div className="text-2xl font-bold text-gray-900">
                  {generations.length}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg>
              </div>
              <div>
                <div className="text-sm text-gray-600">Total Students</div>
                <div className="text-2xl font-bold text-gray-900">
                  {generations.reduce((sum, gen) => sum + gen.totalStudents, 0)}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                </svg>
              </div>
              <div>
                <div className="text-sm text-gray-600">Average %</div>
                <div className="text-2xl font-bold text-gray-900">
                  {generations.length > 0
                    ? (
                        generations.reduce(
                          (sum, gen) => sum + gen.averagePercentage,
                          0
                        ) / generations.length
                      ).toFixed(1)
                    : "0"}
                  %
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <svg
                  className="w-6 h-6 text-purple-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <div className="text-sm text-gray-600">Recent</div>
                <div className="text-sm font-bold text-gray-900">
                  {generations.length > 0
                    ? new Date(generations[0].createdAt).toLocaleDateString()
                    : "N/A"}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-semibold text-gray-700">
              Year:
            </label>
            <select
              value={filterYear}
              onChange={(e) =>
                setFilterYear(
                  e.target.value === "all" ? "all" : parseInt(e.target.value)
                )
              }
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Years</option>
              {uniqueYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-semibold text-gray-700">
              Term:
            </label>
            <select
              value={filterTerm}
              onChange={(e) =>
                setFilterTerm(
                  e.target.value === "all" ? "all" : parseInt(e.target.value)
                )
              }
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Terms</option>
              {uniqueTerms.map((term) => (
                <option key={term} value={term}>
                  Term {term}
                </option>
              ))}
            </select>
          </div>

          <div className="ml-auto text-sm text-gray-600">
            Showing {filteredGenerations.length} of {generations.length}{" "}
            generations
          </div>
        </div>
      </div>

      {/* Generated Report Cards List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            Generated Report Cards History
          </h2>
          <p className="text-gray-600 mt-1">
            Click on any card to view the full report
          </p>
        </div>

        <div className="p-6">
          {filteredGenerations.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-gray-300 text-6xl mb-4">📋</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No Generated Report Cards Yet
              </h3>
              <p className="text-gray-600 mb-6">
                Start by generating report cards for your classes.
              </p>
              <button
                onClick={() => router.push("/teacher/report-cards")}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Generate Report Cards
              </button>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredGenerations.map((generation) => (
                <div
                  key={generation.id}
                  className="border border-gray-200 rounded-xl p-6 hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer"
                  onClick={() => handleViewReportCards(generation)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Title and Status */}
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-lg font-bold text-gray-900">
                          {generation.label}
                        </h3>
                        <span
                          className={`px-3 py-1 text-sm font-semibold rounded-full border ${getStatusColor(
                            generation.status
                          )}`}
                        >
                          {generation.status}
                        </span>
                      </div>

                      {/* Details */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <div className="text-xs text-gray-500 mb-1">
                            Exam Type
                          </div>
                          <div className="text-sm font-semibold text-gray-900">
                            {generation.examType}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">
                            Class
                          </div>
                          <div className="text-sm font-semibold text-gray-900">
                            {generation.className}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">
                            Students
                          </div>
                          <div className="text-sm font-semibold text-gray-900 flex items-center gap-1">
                            <svg
                              className="w-4 h-4 text-gray-400"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                            </svg>
                            {generation.totalStudents}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">
                            Class Average
                          </div>
                          <div
                            className={`text-sm font-bold ${getGradeColor(
                              generation.averagePercentage
                            )}`}
                          >
                            {generation.averagePercentage.toFixed(1)}%
                          </div>
                        </div>
                      </div>

                      {/* Footer Info */}
                      <div className="flex items-center gap-6 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <svg
                            className="w-4 h-4"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Generated by {generation.teacher.name}{" "}
                          {generation.teacher.surname}
                        </div>
                        <div className="flex items-center gap-2">
                          <svg
                            className="w-4 h-4"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                              clipRule="evenodd"
                            />
                          </svg>
                          {new Date(generation.createdAt).toLocaleString()}
                        </div>
                        <div className="flex items-center gap-2">
                          <svg
                            className="w-4 h-4"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                            <path
                              fillRule="evenodd"
                              d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
                              clipRule="evenodd"
                            />
                          </svg>
                          {generation.reportCards.length} Report Cards
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="ml-6 flex flex-col gap-2">
                      <button
                        onClick={() => handleViewReportCards(generation)}
                        disabled={deletingId === generation.id}
                        className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                        View Reports
                      </button>
                      <button
                        onClick={(e) => handleDeleteGeneration(generation, e)}
                        disabled={deletingId === generation.id}
                        className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {deletingId === generation.id ? (
                          <>
                            <svg
                              className="animate-spin h-5 w-5"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              />
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              />
                            </svg>
                            Deleting...
                          </>
                        ) : (
                          <>
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                            Delete
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GeneratedReportCardsList;
