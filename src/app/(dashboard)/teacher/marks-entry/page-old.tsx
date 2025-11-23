"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import Image from "next/image";
import Link from "next/link";

interface ExamSubject {
  id: number;
  marksEntered: boolean;
  marksEnteredAt?: string;
  exam: {
    id: number;
    title: string;
    year: number;
    term: number;
    status: string;
    grade: {
      level: number;
    };
  };
  subject: {
    id: number;
    name: string;
  };
}

const TeacherMarksEntryDashboard = () => {
  const router = useRouter();
  const [assignedExams, setAssignedExams] = useState<ExamSubject[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSubjects: 0,
    completedSubjects: 0,
    pendingSubjects: 0,
    activeExams: 0,
  });

  useEffect(() => {
    fetchAssignedExams();
  }, []);

  const fetchAssignedExams = async () => {
    try {
      const response = await fetch("/api/teacher/assigned-exams");
      if (response.ok) {
        const data = await response.json();
        setAssignedExams(data.examSubjects || []);
        
        // Calculate stats
        const totalSubjects = data.examSubjects?.length || 0;
        const completedSubjects = data.examSubjects?.filter((es: ExamSubject) => es.marksEntered).length || 0;
        const pendingSubjects = totalSubjects - completedSubjects;
        const activeExams = new Set(data.examSubjects?.map((es: ExamSubject) => es.exam.id)).size;
        
        setStats({
          totalSubjects,
          completedSubjects,
          pendingSubjects,
          activeExams,
        });
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to fetch assigned exams");
      }
    } catch (error) {
      console.error("Error fetching assigned exams:", error);
      toast.error("Failed to fetch assigned exams");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PUBLISHED":
        return "bg-green-100 text-green-800";
      case "MARKS_ENTRY":
        return "bg-blue-100 text-blue-800";
      case "CLASS_REVIEW":
        return "bg-yellow-100 text-yellow-800";
      case "DRAFT":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2">Loading your assigned exams...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-md flex-1 m-4 mt-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Marks Entry Dashboard</h1>
          <p className="text-gray-600">Manage marks for your assigned subjects</p>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/list/exams"
            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 flex items-center gap-2"
          >
            <Image src="/exam.png" alt="Exams" width={16} height={16} />
            View All Exams
          </Link>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm font-medium">Active Exams</p>
              <p className="text-3xl font-bold text-blue-900">{stats.activeExams}</p>
            </div>
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
              <Image src="/exam.png" alt="Exams" width={24} height={24} />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-lg border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-600 text-sm font-medium">Total Subjects</p>
              <p className="text-3xl font-bold text-purple-900">{stats.totalSubjects}</p>
            </div>
            <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
              <Image src="/subject.png" alt="Subjects" width={24} height={24} />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm font-medium">Completed</p>
              <p className="text-3xl font-bold text-green-900">{stats.completedSubjects}</p>
            </div>
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
              <Image src="/result.png" alt="Completed" width={24} height={24} />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-lg border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-600 text-sm font-medium">Pending</p>
              <p className="text-3xl font-bold text-orange-900">{stats.pendingSubjects}</p>
            </div>
            <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
              <Image src="/update.png" alt="Pending" width={24} height={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Progress Overview */}
      {stats.totalSubjects > 0 && (
        <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border">
          <h3 className="text-lg font-semibold mb-4">Overall Progress</h3>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700">
              Marks Entry Progress
            </span>
            <span className="text-sm text-gray-600">
              {stats.completedSubjects} / {stats.totalSubjects} subjects completed
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-300"
              style={{ 
                width: `${stats.totalSubjects > 0 ? (stats.completedSubjects / stats.totalSubjects) * 100 : 0}%` 
              }}
            />
          </div>
          <div className="text-right mt-2">
            <span className="text-lg font-bold text-gray-800">
              {stats.totalSubjects > 0 ? Math.round((stats.completedSubjects / stats.totalSubjects) * 100) : 0}%
            </span>
          </div>
        </div>
      )}

      {/* Assigned Exams List */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Your Assigned Exams & Subjects</h3>
        
        {assignedExams.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <div className="text-gray-400 mb-4">
              <Image src="/exam.png" alt="No exams" width={64} height={64} className="mx-auto opacity-50" />
            </div>
            <h3 className="text-xl font-semibold text-gray-500 mb-2">No Assigned Exams</h3>
            <p className="text-gray-400">You don't have any exam subjects assigned for marks entry yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assignedExams.map((examSubject) => (
              <div
                key={`${examSubject.exam.id}-${examSubject.subject.id}`}
                className={`border-2 rounded-lg p-6 transition-all hover:shadow-lg ${
                  examSubject.marksEntered
                    ? "border-green-200 bg-green-50"
                    : "border-blue-200 bg-blue-50 hover:border-blue-300"
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="font-semibold text-gray-800 text-lg">
                      {examSubject.exam.title}
                    </h4>
                    <p className="text-gray-600 text-sm">
                      Grade {examSubject.exam.grade.level} • {examSubject.exam.year} • Term {examSubject.exam.term}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(examSubject.exam.status || 'DRAFT')}`}>
                    {examSubject.exam.status ? examSubject.exam.status.replace("_", " ") : "DRAFT"}
                  </span>
                </div>

                <div className="mb-4">
                  <div className="flex items-center mb-2">
                    <Image src="/subject.png" alt="Subject" width={16} height={16} className="mr-2" />
                    <span className="font-medium text-gray-800">{examSubject.subject.name}</span>
                  </div>
                  
                  {examSubject.marksEntered ? (
                    <div className="flex items-center text-green-600">
                      <Image src="/result.png" alt="Completed" width={16} height={16} className="mr-2" />
                      <span className="text-sm font-medium">Marks Entered</span>
                      {examSubject.marksEnteredAt && (
                        <span className="text-xs ml-2 text-green-500">
                          ({new Date(examSubject.marksEnteredAt).toLocaleDateString()})
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center text-orange-600">
                      <Image src="/update.png" alt="Pending" width={16} height={16} className="mr-2" />
                      <span className="text-sm font-medium">Marks Entry Pending</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Link
                    href={`/teacher/marks-entry/${examSubject.exam.id}`}
                    className={`flex-1 px-4 py-2 rounded-md text-center text-sm font-medium transition-colors ${
                      examSubject.marksEntered
                        ? "bg-green-600 text-white hover:bg-green-700"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                  >
                    {examSubject.marksEntered ? "Update Marks" : "Enter Marks"}
                  </Link>
                  
                  <Link
                    href={`/teacher/exam-overview/${examSubject.exam.id}`}
                    className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                    title="View Exam Overview"
                  >
                    <Image src="/view.png" alt="View Overview" width={16} height={16} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherMarksEntryDashboard;
