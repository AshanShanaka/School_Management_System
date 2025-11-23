"use client";

import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import Link from "next/link";

const PreviousRecordsPage = () => {
  const router = useRouter();
  const [classes, setClasses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setIsLoading(true);
        
        // Fetch all grades to find Grade 9 and Grade 10
        const gradesResponse = await fetch('/api/grades?all=true');
        if (!gradesResponse.ok) {
          throw new Error('Failed to fetch grades');
        }
        const gradesData = await gradesResponse.json();
        const allGrades = gradesData.grades || [];
        const grade9 = allGrades.find((g: any) => g.level === 9);
        const grade10 = allGrades.find((g: any) => g.level === 10);
        
        if (!grade9 && !grade10) {
          toast.info("Grade 9 and Grade 10 not found. Please create these grades first.");
          setClasses([]);
          return;
        }
        
        // Fetch classes for Grade 9 and Grade 10
        const allClasses: any[] = [];
        
        if (grade9) {
          const classes9Response = await fetch(`/api/classes?gradeId=${grade9.id}`);
          if (classes9Response.ok) {
            const classes9Data = await classes9Response.json();
            allClasses.push(...(classes9Data.classes || []));
          }
        }
        
        if (grade10) {
          const classes10Response = await fetch(`/api/classes?gradeId=${grade10.id}`);
          if (classes10Response.ok) {
            const classes10Data = await classes10Response.json();
            allClasses.push(...(classes10Data.classes || []));
          }
        }
        
        // Sort by grade level and name
        allClasses.sort((a, b) => {
          if (a.grade.level !== b.grade.level) {
            return a.grade.level - b.grade.level;
          }
          return a.name.localeCompare(b.name);
        });
        
        setClasses(allClasses);
        
        if (allClasses.length === 0) {
          toast.info("No Grade 9 or Grade 10 classes found. Please create these classes first.");
        }
      } catch (error) {
        console.error("Error fetching classes:", error);
        toast.error("Failed to load classes");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchClasses();
  }, []);

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Previous Records (Grade 9 & 10)
            </h1>
            <p className="text-sm text-gray-600">
              View historical marks for Grade 11 students by class
            </p>
          </div>
          <Link
            href="/admin/historical-marks-import"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <span>📤</span>
            Import Historical Marks
          </Link>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h2 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
          <span className="text-xl">ℹ️</span>
          Instructions
        </h2>
        <ul className="list-disc list-inside space-y-1 text-sm text-blue-800">
          <li>Select a Grade 9 or Grade 10 class below to view historical records</li>
          <li>Shows marks from when students were in those grades (now they are in Grade 11)</li>
          <li>Click "Import Historical Marks" to add new records via Excel</li>
        </ul>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Classes Grid */}
      {!isLoading && classes.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map((cls) => (
            <Link
              key={cls.id}
              href={`/admin/previous-records/${cls.id}`}
              className="group block p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:shadow-lg transition-all duration-200"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  <span className="text-2xl">📚</span>
                </div>
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                  Grade {cls.grade?.level}
                </span>
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                {cls.name}
              </h3>
              
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>{cls._count?.students || 0} Students</span>
                <span className="text-blue-600 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                  View Records
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && classes.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="w-20 h-20 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-xl font-medium text-gray-500 mb-2">No Classes Available</h3>
          <p className="text-gray-400 text-center max-w-md">
            No Grade 9 or Grade 10 classes found. Please create these classes first.
          </p>
        </div>
      )}
    </div>
  );
};

export default PreviousRecordsPage;
