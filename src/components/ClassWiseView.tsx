"use client";

import React, { useState, useEffect } from "react";
import {
  GraduationCap,
  Users,
  User,
  Search,
  ChevronRight,
  BookOpen,
  Phone,
  Mail,
  MapPin,
  Calendar,
} from "lucide-react";
import { formatClassDisplay } from "@/lib/formatters";

interface ClassData {
  id: number;
  name: string;
  capacity: number;
  grade: {
    id: number;
    level: number;
  };
  supervisor?: {
    name: string;
    surname: string;
  };
  students: Student[];
  _count: {
    students: number;
  };
}

interface Student {
  id: string;
  name: string;
  surname: string;
  email: string;
  phone?: string;
  address: string;
  sex: string;
  bloodType?: string;
  parent?: {
    name: string;
    surname: string;
    phone: string;
    email?: string;
  };
}

interface Parent {
  id: string;
  name: string;
  surname: string;
  email?: string;
  phone: string;
  address: string;
  students: {
    id: string;
    name: string;
    surname: string;
    class: {
      name: string;
      grade: { level: number };
    };
  }[];
}

const ClassWiseView = () => {
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [parents, setParents] = useState<Parent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState<ClassData | null>(null);
  const [selectedParents, setSelectedParents] = useState<Parent[]>([]);
  const [viewMode, setViewMode] = useState<"students" | "parents">("students");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [classesRes, parentsRes] = await Promise.all([
        fetch("/api/classes"),
        fetch("/api/parents"),
      ]);

      const [classesData, parentsData] = await Promise.all([
        classesRes.json(),
        parentsRes.json(),
      ]);

      setClasses(classesData.classes || []);
      setParents(parentsData.parents || []);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClassClick = (classData: ClassData) => {
    setSelectedClass(classData);

    if (viewMode === "parents") {
      // Find parents of students in this class
      const classStudentIds = classData.students.map((s) => s.id);
      const classParents = parents.filter((parent) =>
        parent.students.some((student) => classStudentIds.includes(student.id))
      );
      setSelectedParents(classParents);
    }
  };

  const filteredClasses = classes.filter(
    (cls) =>
      formatClassDisplay(cls.name, cls.grade.level)
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      cls.supervisor?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cls.supervisor?.surname.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getOccupancyColor = (studentCount: number, capacity: number) => {
    const percentage = (studentCount / capacity) * 100;
    if (percentage >= 90) return "text-red-600 bg-red-100";
    if (percentage >= 70) return "text-orange-600 bg-orange-100";
    return "text-green-600 bg-green-100";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading class information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-full p-3">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Class-wise View
                </h1>
                <p className="text-gray-600">
                  Organize students and parents by class
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">
                  {classes.length}
                </div>
                <div className="text-sm text-gray-500">Total Classes</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="mb-6">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-2">
          <div className="flex space-x-1">
            <button
              onClick={() => {
                setViewMode("students");
                setSelectedClass(null);
              }}
              className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                viewMode === "students"
                  ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <GraduationCap className="w-5 h-5" />
              <span>Students by Class</span>
            </button>
            <button
              onClick={() => {
                setViewMode("parents");
                setSelectedClass(null);
              }}
              className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                viewMode === "parents"
                  ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <Users className="w-5 h-5" />
              <span>Parents by Class</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Classes List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Classes
              </h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search classes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {filteredClasses.map((classData) => (
                <div
                  key={classData.id}
                  onClick={() => handleClassClick(classData)}
                  className={`p-4 border-b border-gray-100 cursor-pointer transition-all duration-200 hover:bg-blue-50 ${
                    selectedClass?.id === classData.id
                      ? "bg-blue-50 border-l-4 border-l-blue-500"
                      : ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">
                        {formatClassDisplay(
                          classData.name,
                          classData.grade.level
                        )}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {classData.supervisor
                          ? `${classData.supervisor.name} ${classData.supervisor.surname}`
                          : "No supervisor"}
                      </p>
                      <div className="flex items-center mt-2">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getOccupancyColor(
                            classData._count.students,
                            classData.capacity
                          )}`}
                        >
                          {classData._count.students}/{classData.capacity}{" "}
                          students
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Details Panel */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            {selectedClass ? (
              <>
                {/* Class Header */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-bold">
                        {formatClassDisplay(
                          selectedClass.name,
                          selectedClass.grade.level
                        )}
                      </h3>
                      <p className="text-blue-100">
                        {viewMode === "students" ? "Students" : "Parents"} in
                        this class
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">
                        {viewMode === "students"
                          ? selectedClass.students.length
                          : selectedParents.length}
                      </div>
                      <div className="text-blue-100 text-sm">
                        {viewMode === "students" ? "Students" : "Parents"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  {viewMode === "students" ? (
                    <div className="space-y-4">
                      {selectedClass.students.map((student) => (
                        <div
                          key={student.id}
                          className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start space-x-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                              {student.name.charAt(0)}
                              {student.surname.charAt(0)}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900">
                                {student.name} {student.surname}
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 text-sm text-gray-600">
                                <div className="flex items-center">
                                  <Mail className="w-4 h-4 mr-2 text-blue-500" />
                                  {student.email}
                                </div>
                                {student.phone && (
                                  <div className="flex items-center">
                                    <Phone className="w-4 h-4 mr-2 text-green-500" />
                                    {student.phone}
                                  </div>
                                )}
                                <div className="flex items-center">
                                  <User className="w-4 h-4 mr-2 text-purple-500" />
                                  {student.sex} • {student.bloodType || "N/A"}
                                </div>
                                <div className="flex items-center">
                                  <MapPin className="w-4 h-4 mr-2 text-red-500" />
                                  {student.address}
                                </div>
                              </div>
                              {student.parent && (
                                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                  <p className="text-sm font-medium text-gray-700">
                                    Parent:
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    {student.parent.name}{" "}
                                    {student.parent.surname} •{" "}
                                    {student.parent.phone}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {selectedParents.map((parent) => (
                        <div
                          key={parent.id}
                          className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start space-x-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                              {parent.name.charAt(0)}
                              {parent.surname.charAt(0)}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900">
                                {parent.name} {parent.surname}
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 text-sm text-gray-600">
                                <div className="flex items-center">
                                  <Mail className="w-4 h-4 mr-2 text-blue-500" />
                                  {parent.email || "No email"}
                                </div>
                                <div className="flex items-center">
                                  <Phone className="w-4 h-4 mr-2 text-green-500" />
                                  {parent.phone}
                                </div>
                                <div className="flex items-center">
                                  <MapPin className="w-4 h-4 mr-2 text-red-500" />
                                  {parent.address}
                                </div>
                              </div>
                              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                <p className="text-sm font-medium text-gray-700">
                                  Children in this class:
                                </p>
                                <div className="mt-1">
                                  {parent.students
                                    .filter(
                                      (student) =>
                                        student.class.name ===
                                        selectedClass.name
                                    )
                                    .map((student) => (
                                      <span
                                        key={student.id}
                                        className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mr-2 mb-1"
                                      >
                                        {student.name} {student.surname}
                                      </span>
                                    ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="p-12 text-center">
                <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Select a Class
                </h3>
                <p className="text-gray-500">
                  Choose a class from the left to view its {viewMode}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClassWiseView;
