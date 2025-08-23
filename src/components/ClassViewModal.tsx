"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { X, Users, GraduationCap } from "lucide-react";
import toast from "react-hot-toast";

interface ClassStudent {
  id: string;
  name: string;
  surname: string;
  email: string;
  username: string;
  phone?: string;
  img?: string;
  parent?: {
    name: string;
    surname: string;
    phone?: string;
  };
}

interface ClassData {
  id: number;
  name: string;
  capacity: number;
  grade: {
    level: number;
  };
  supervisor?: {
    name: string;
    surname: string;
  };
  students: ClassStudent[];
}

interface ClassViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  classId?: number;
}

const ClassViewModal = ({ isOpen, onClose, classId }: ClassViewModalProps) => {
  const [classData, setClassData] = useState<ClassData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && classId) {
      fetchClassData();
    }
  }, [isOpen, classId]);

  const fetchClassData = async () => {
    if (!classId) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/classes/${classId}/students`, {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setClassData(data.classData);
      } else {
        toast.error("Failed to load class data");
      }
    } catch (error) {
      console.error("Error fetching class data:", error);
      toast.error("An error occurred while loading class data");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {classData ? `${classData.name} Students` : "Class Students"}
              </h2>
              {classData && (
                <p className="text-sm text-gray-600">
                  <GraduationCap className="w-4 h-4 inline mr-1" />
                  Grade {classData.grade.level} • {classData.students.length} /{" "}
                  {classData.capacity} students
                  {classData.supervisor && (
                    <span className="ml-2">
                      • Supervisor: {classData.supervisor.name}{" "}
                      {classData.supervisor.surname}
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

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="text-gray-500 ml-4">Loading students...</p>
            </div>
          ) : classData ? (
            <div className="space-y-4">
              {classData.students.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No Students Found
                  </h3>
                  <p className="text-gray-500">
                    This class doesn't have any students assigned yet.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {classData.students.map((student) => (
                    <div
                      key={student.id}
                      className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors border border-gray-200"
                    >
                      <div className="flex items-start space-x-4">
                        <Image
                          src={student.img || "/noAvatar.png"}
                          alt={`${student.name} ${student.surname}`}
                          width={48}
                          height={48}
                          className="rounded-full object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 truncate">
                            {student.name} {student.surname}
                          </h4>
                          <p className="text-sm text-gray-600 truncate">
                            {student.email}
                          </p>
                          <p className="text-xs text-gray-500">
                            ID: {student.username}
                          </p>
                          {student.phone && (
                            <p className="text-xs text-gray-500 mt-1">
                              📞 {student.phone}
                            </p>
                          )}
                          {student.parent && (
                            <div className="mt-2 p-2 bg-white rounded border">
                              <p className="text-xs font-medium text-gray-700">
                                Parent: {student.parent.name}{" "}
                                {student.parent.surname}
                              </p>
                              {student.parent.phone && (
                                <p className="text-xs text-gray-500">
                                  📞 {student.parent.phone}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">Failed to load class data</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              {classData && (
                <>
                  Showing {classData.students.length} student
                  {classData.students.length !== 1 ? "s" : ""}
                  {classData.capacity && (
                    <span className="ml-2">
                      • Capacity: {classData.students.length}/
                      {classData.capacity}
                    </span>
                  )}
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

export default ClassViewModal;
