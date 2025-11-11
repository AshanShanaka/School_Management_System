"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { X, GraduationCap, Users, School, User } from "lucide-react";
import toast from "react-hot-toast";

interface GradeStudent {
  id: string;
  name: string;
  surname: string;
  email: string;
  phone?: string;
  img?: string;
}

interface GradeClass {
  id: number;
  name: string;
  capacity: number;
  supervisor?: {
    id: string;
    name: string;
    surname: string;
    email: string;
  };
  students: GradeStudent[];
  _count: {
    students: number;
  };
}

interface GradeData {
  id: number;
  level: number;
  classes: GradeClass[];
}

interface GradeViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  gradeId?: number;
}

const GradeViewModal = ({ isOpen, onClose, gradeId }: GradeViewModalProps) => {
  const [gradeData, setGradeData] = useState<GradeData | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "classes">("overview");

  useEffect(() => {
    if (isOpen && gradeId) {
      fetchGradeData();
    }
  }, [isOpen, gradeId]);

  const fetchGradeData = async () => {
    if (!gradeId) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/grades/${gradeId}/view`, {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setGradeData(data);
      } else {
        toast.error("Failed to load grade data");
      }
    } catch (error) {
      console.error("Error fetching grade data:", error);
      toast.error("An error occurred while loading grade data");
    } finally {
      setLoading(false);
    }
  };

  const getTotalStudents = () => {
    if (!gradeData) return 0;
    return gradeData.classes.reduce((sum, cls) => sum + cls._count.students, 0);
  };

  const getTotalCapacity = () => {
    if (!gradeData) return 0;
    return gradeData.classes.reduce((sum, cls) => sum + cls.capacity, 0);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <GraduationCap className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {gradeData ? `Grade ${gradeData.level} Details` : "Grade Details"}
              </h2>
              {gradeData && (
                <p className="text-sm text-gray-600">
                  <School className="w-4 h-4 inline mr-1" />
                  {gradeData.classes.length} classes • {getTotalStudents()} students
                  {getTotalCapacity() > 0 && (
                    <span className="ml-2">
                      • Capacity: {getTotalStudents()}/{getTotalCapacity()}
                    </span>
                  )}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab("overview")}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "overview"
                  ? "border-purple-500 text-purple-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab("classes")}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "classes"
                  ? "border-purple-500 text-purple-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Classes & Students
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
              <p className="text-gray-500 ml-4">Loading grade data...</p>
            </div>
          ) : gradeData ? (
            <div className="space-y-6">
              {activeTab === "overview" && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Statistics */}
                  <div className="bg-purple-50 rounded-lg p-6 border border-purple-200">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <School className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm text-purple-600 font-medium">Total Classes</p>
                        <p className="text-2xl font-bold text-purple-900">
                          {gradeData.classes.length}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Users className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-blue-600 font-medium">Total Students</p>
                        <p className="text-2xl font-bold text-blue-900">
                          {getTotalStudents()}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 rounded-lg p-6 border border-green-200">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <GraduationCap className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-green-600 font-medium">Total Capacity</p>
                        <p className="text-2xl font-bold text-green-900">
                          {getTotalCapacity()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Classes Overview */}
                  <div className="col-span-full">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Classes Overview
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {gradeData.classes.map((cls) => (
                        <div
                          key={cls.id}
                          className="bg-white rounded-lg p-4 border border-gray-200 hover:border-gray-300 transition-colors"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-gray-900">{cls.name}</h4>
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                              {cls._count.students}/{cls.capacity}
                            </span>
                          </div>
                          {cls.supervisor && (
                            <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                              <User className="w-4 h-4" />
                              <span>
                                {cls.supervisor.name} {cls.supervisor.surname}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Users className="w-4 h-4" />
                            <span>{cls._count.students} students</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "classes" && (
                <div className="space-y-6">
                  {gradeData.classes.length === 0 ? (
                    <div className="text-center py-12">
                      <School className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No Classes Found
                      </h3>
                      <p className="text-gray-500">
                        This grade doesn't have any classes assigned yet.
                      </p>
                    </div>
                  ) : (
                    gradeData.classes.map((cls) => (
                      <div
                        key={cls.id}
                        className="bg-gray-50 rounded-lg p-6 border border-gray-200"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                              <School className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">
                                {cls.name}
                              </h3>
                              <p className="text-sm text-gray-600">
                                Capacity: {cls._count.students}/{cls.capacity}
                                {cls.supervisor && (
                                  <span className="ml-3">
                                    • Supervisor: {cls.supervisor.name} {cls.supervisor.surname}
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                        </div>

                        {cls.students.length === 0 ? (
                          <div className="text-center py-8">
                            <Users className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                            <p className="text-gray-500">No students in this class</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {cls.students.map((student) => (
                              <div
                                key={student.id}
                                className="bg-white rounded-lg p-3 border border-gray-200 hover:border-gray-300 transition-colors"
                              >
                                <div className="flex items-center space-x-3">
                                  <Image
                                    src={student.img || "/noAvatar.png"}
                                    alt={`${student.name} ${student.surname}`}
                                    width={40}
                                    height={40}
                                    className="rounded-full object-cover"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-gray-900 truncate">
                                      {student.name} {student.surname}
                                    </h4>
                                    <p className="text-sm text-gray-600 truncate">
                                      {student.email}
                                    </p>
                                    {student.phone && (
                                      <p className="text-xs text-gray-500">
                                        📞 {student.phone}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <GraduationCap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Failed to Load Grade Data
              </h3>
              <p className="text-gray-500">
                There was an error loading the grade information.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              {gradeData && (
                <>
                  Grade {gradeData.level} • {gradeData.classes.length} classes • {getTotalStudents()} students
                </>
              )}
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GradeViewModal;
