"use client";

import ExamTimetableView from "@/components/ExamTimetableView";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

interface ExamTimetablePageProps {
  params: {
    examId: string;
  };
}

const ExamTimetablePage = ({ params }: ExamTimetablePageProps) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const examId = parseInt(params.examId);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
        <div className="flex items-center justify-center h-64">
          <div className="text-red-500">Access denied</div>
        </div>
      </div>
    );
  }

  if (isNaN(examId)) {
    return (
      <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
        <div className="flex items-center justify-center h-64">
          <div className="text-red-500">Invalid exam ID</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link 
            href="/list/exams"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <span>←</span>
            <span className="text-sm">Back to Exam Timetables</span>
          </Link>
        </div>
        
        <div className="flex items-center gap-4">
          {user.role === "admin" && (
            <Link href={`/list/exams/${examId}`}>
              <button className="bg-lamaPurple text-white px-4 py-2 rounded-md hover:bg-lamaPurpleLight flex items-center gap-2">
                <Image src="/update.png" alt="Edit" width={16} height={16} />
                Edit Exam
              </button>
            </Link>
          )}
          
          <button 
            onClick={handlePrint} 
            className="bg-lamaYellow text-white px-4 py-2 rounded-md hover:bg-lamaYellowLight flex items-center gap-2"
          >
            <Image src="/view.png" alt="Print" width={16} height={16} />
            Print
          </button>
        </div>
      </div>

      {/* Exam Timetable View */}
      <ExamTimetableView 
        examId={examId.toString()} 
        userRole={user.role}
        userId={user.id}
      />
    </div>
  );
};

export default ExamTimetablePage;
