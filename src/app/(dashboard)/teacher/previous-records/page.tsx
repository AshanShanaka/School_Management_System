"use client";

import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

const TeacherPreviousRecordsPage = () => {
  const router = useRouter();
  const [teacherClass, setTeacherClass] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTeacherClass = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/class-teacher/my-class');
        
        console.log("API Response Status:", response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log("API Response Data:", data);
          
          // API returns { class: {...} }
          if (data.class) {
            console.log("Class found:", data.class);
            setTeacherClass({
              ...data.class,
              _count: { students: data.class.studentCount || data.class.students?.length || 0 }
            });
          } else {
            console.log("No class assignment found");
          }
        } else {
          const errorData = await response.json();
          console.error("API Error:", errorData);
          toast.error(errorData.error || "Failed to fetch your class information");
        }
      } catch (error) {
        console.error("Error fetching teacher class:", error);
        toast.error("Failed to load your class information");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTeacherClass();
  }, []);

  const handleViewRecords = () => {
    if (teacherClass) {
      router.push(`/teacher/previous-records/${teacherClass.id}`);
    }
  };

  return (
    <div className="bg-white p-6 rounded-md flex-1 m-4 mt-0">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">📚 Previous Records</h1>
        <p className="text-sm text-gray-600">Grade 9 & 10 historical marks for your class students</p>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          <span className="ml-3 text-gray-600">Loading your class...</span>
        </div>
      )}

      {/* Class Information */}
      {!isLoading && teacherClass && (
        <div>
          {/* Class Card */}
          <div className="mb-6 p-6 bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-300 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-purple-700 mb-1">Your Assigned Class</h3>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl font-bold text-gray-800">{teacherClass.name}</span>
                  <span className="px-3 py-1 bg-purple-200 text-purple-800 rounded-full text-sm font-semibold">
                    Grade {teacherClass.grade?.level}
                  </span>
                </div>
                <span className="text-sm text-gray-600">
                  {teacherClass._count?.students || 0} Students with historical records
                </span>
              </div>
              <button
                onClick={handleViewRecords}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 font-semibold shadow-md hover:shadow-lg"
              >
                <span>�️</span>
                View Records
              </button>
            </div>
          </div>

          {/* Info Note */}
          <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
            <p className="text-sm text-indigo-900">
              <strong>� Info:</strong> Grade 9 & 10 historical data for prediction analysis.
            </p>
          </div>
        </div>
      )}

      {/* Not Assigned State */}
      {!isLoading && !teacherClass && (
        <div className="p-6 bg-amber-50 border-2 border-amber-300 rounded-xl">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
                <span className="text-2xl">⚠️</span>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-amber-900 mb-2">No Class Assignment Found</h3>
              <p className="text-sm text-amber-800 mb-3">
                You are not currently assigned as a class teacher. Please contact your administrator to assign you to a class.
              </p>
              <p className="text-xs text-amber-700">
                💡 Only class teachers can view previous records for their students.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherPreviousRecordsPage;
