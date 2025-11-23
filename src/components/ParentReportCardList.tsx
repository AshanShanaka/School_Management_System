"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import LanguageSwitcher from "@/components/LanguageSwitcher";

interface Student {
  id: string;
  name: string;
  surname: string;
  username: string;
}

interface ReportCard {
  id: number;
  examId: number;
  classId: number;
  studentId: string;
  status: string;
  totalMarks: number;
  maxMarks: number;
  percentage: number;
  overallGrade: string;
  classRank: number;
  classAverage: number;
  generatedAt: string;
  exam: {
    id: number;
    title: string;
    year: number;
    term: number;
    status: string;
    examType?: {
      name: string;
    } | null;
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
  student: {
    id: string;
    name: string;
    surname: string;
    username: string;
  };
}

const ParentReportCardList: React.FC = () => {
  const router = useRouter();
  const { t } = useLanguage();
  const [reportCards, setReportCards] = useState<ReportCard[]>([]);
  const [children, setChildren] = useState<Student[]>([]);
  const [selectedChild, setSelectedChild] = useState<string | "all">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchReportCards();
  }, []);

  const fetchReportCards = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/parent/report-cards");

      if (!response.ok) {
        throw new Error("Failed to fetch report cards");
      }

      const data = await response.json();
      setReportCards(data.reportCards);
      setChildren(data.children);
    } catch (err: any) {
      console.error("Error fetching report cards:", err);
      setError(err.message || "Failed to load report cards");
      toast.error("Failed to load report cards");
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (examId: number, studentId: string) => {
    router.push(`/parent/report-card/${examId}/${studentId}`);
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case "A":
        return "bg-green-100 text-green-800 border-green-200";
      case "B":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "C":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "S":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "W":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1)
      return (
        <span className="text-yellow-500 text-xl" title="1st Place">
          🥇
        </span>
      );
    if (rank === 2)
      return (
        <span className="text-gray-400 text-xl" title="2nd Place">
          🥈
        </span>
      );
    if (rank === 3)
      return (
        <span className="text-orange-600 text-xl" title="3rd Place">
          🥉
        </span>
      );
    return null;
  };

  const filteredReportCards =
    selectedChild === "all"
      ? reportCards
      : reportCards.filter((card) => card.studentId === selectedChild);

  if (loading) {
    return (
      <div className="bg-white p-8 rounded-xl shadow-sm">
        <div className="flex items-center justify-center py-12">
          <svg
            className="animate-spin h-10 w-10 text-purple-600"
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
            {t("reportCard.loading")}
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
            {t("reportCard.errorLoading")}
          </h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={fetchReportCards}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            {t("reportCard.tryAgain")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Language Switcher */}
      <div className="flex justify-end">
        <LanguageSwitcher />
      </div>

      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-800 p-6 rounded-xl shadow-lg text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">{t("reportCard.title")}</h1>
            <p className="text-purple-100">
              {t("reportCard.subtitle")}
            </p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-lg px-6 py-4">
            <div className="text-sm text-purple-100">{t("reportCard.totalReports")}</div>
            <div className="text-4xl font-bold">{reportCards.length}</div>
          </div>
        </div>
      </div>

      {/* Child Filter */}
      {children.length > 1 && (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-4">
            <span className="font-semibold text-gray-700">{t("reportCard.filterByChild")}</span>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedChild("all")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedChild === "all"
                    ? "bg-purple-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {t("reportCard.allChildren")}
              </button>
              {children.map((child) => (
                <button
                  key={child.id}
                  onClick={() => setSelectedChild(child.id)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    selectedChild === child.id
                      ? "bg-purple-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {child.name} {child.surname}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Report Cards List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">{t("menu.reportCards")}</h2>
          <p className="text-gray-600 mt-1">
            {t("reportCard.clickToView")}
          </p>
        </div>

        <div className="p-6">
          {filteredReportCards.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-gray-300 text-6xl mb-4">📋</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {t("reportCard.noReportsYet")}
              </h3>
              <p className="text-gray-600">
                {t("reportCard.noReportsMessage")}
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredReportCards.map((card) => (
                <div
                  key={card.id}
                  className="border border-gray-200 rounded-xl p-6 hover:shadow-md hover:border-purple-300 transition-all cursor-pointer"
                  onClick={() => handleViewDetails(card.examId, card.studentId)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="px-3 py-1 bg-purple-100 text-purple-800 text-sm font-semibold rounded-full">
                          {card.student.name} {card.student.surname}
                        </span>
                        <h3 className="text-lg font-bold text-gray-900">
                          {card.exam.title}
                        </h3>
                        {card.exam.examType && (
                          <span className="px-3 py-1 bg-indigo-100 text-indigo-800 text-sm font-semibold rounded-full">
                            {card.exam.examType.name}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-6 text-sm text-gray-600 mb-4">
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
                          Year {card.exam.year}, Term {card.exam.term}
                        </div>
                        <div className="flex items-center gap-2">
                          <svg
                            className="w-4 h-4"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                          </svg>
                          {card.class.name}
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
                          {new Date(card.generatedAt).toLocaleDateString()}
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">Grade:</span>
                          <span
                            className={`px-4 py-1.5 text-lg font-bold rounded-lg border ${getGradeColor(
                              card.overallGrade
                            )}`}
                          >
                            {card.overallGrade}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">Percentage:</span>
                          <span className="text-lg font-bold text-purple-600">
                            {card.percentage?.toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">Rank:</span>
                          <div className="flex items-center gap-1">
                            {getRankBadge(card.classRank)}
                            <span className="text-lg font-bold text-gray-900">
                              #{card.classRank}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">Marks:</span>
                          <span className="text-sm font-semibold text-gray-900">
                            {card.totalMarks}/{card.maxMarks}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="ml-6">
                      <button className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 font-semibold">
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
                        {t("reportCard.viewDetails")}
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

export default ParentReportCardList;
