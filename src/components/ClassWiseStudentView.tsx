"use client";

import React, { useState, useEffect } from "react";
import {
  GraduationCap,
  Users,
  Search,
  Filter,
  Eye,
  UserCheck,
  Calendar,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { formatClassDisplay } from "@/lib/formatters";

interface Student {
  id: string;
  name: string;
  surname: string;
  email: string;
  phone?: string;
  address: string;
  img?: string;
  bloodType: string;
  sex: "MALE" | "FEMALE";
  createdAt: string;
  class: {
    id: number;
    name: string;
    capacity: number;
    grade: {
      id: number;
      level: number;
    };
  };
  parent: {
    id: string;
    name: string;
    surname: string;
  };
}

interface Class {
  id: number;
  name: string;
  capacity: number;
  grade: {
    id: number;
    level: number;
  };
  supervisor?: {
    id: string;
    name: string;
    surname: string;
  };
  students: Student[];
}

const ClassWiseStudentView = () => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [user, setUser] = useState<any>(null);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Get current user
      const userRes = await fetch("/api/auth/me");
      if (userRes.ok) {
        const userData = await userRes.json();
        setUser(userData.user);
      }

      // Get classes with students
      const classRes = await fetch("/api/classes");
      if (classRes.ok) {
        const classData = await classRes.json();

        // Fetch students for each class
        const classesWithStudents = await Promise.all(
          classData.classes.map(async (cls: any) => {
            const studentsRes = await fetch(`/api/students?classId=${cls.id}`);
            const studentsData = studentsRes.ok
              ? await studentsRes.json()
              : { students: [] };
            return {
              ...cls,
              students: studentsData.students || [],
            };
          })
        );

        setClasses(classesWithStudents);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredClasses = classes.filter(
    (cls) =>
      cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cls.grade.level.toString().includes(searchTerm)
  );

  const getClassStats = (cls: Class) => {
    const totalStudents = cls.students.length;
    const capacity = cls.capacity;
    const occupancyRate =
      capacity > 0 ? Math.round((totalStudents / capacity) * 100) : 0;

    return {
      totalStudents,
      capacity,
      occupancyRate,
      available: capacity - totalStudents,
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading class data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl p-6 md:p-8 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-full p-3">
              <GraduationCap className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                Class-wise Student View
              </h1>
              <p className="text-green-100 text-lg">
                View students organized by their classes
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">
              {classes.reduce((sum, cls) => sum + cls.students.length, 0)}
            </div>
            <div className="text-green-100 text-sm">Total Students</div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <div className="flex items-center space-x-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search classes by name or grade..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
            />
          </div>
          <button
            onClick={fetchData}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <Filter className="w-5 h-5" />
          </button>
        </div>
      </div>

      {selectedClass ? (
        /* Selected Class Students View */
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="bg-blue-100 rounded-full p-3">
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {formatClassDisplay(
                      selectedClass.name,
                      selectedClass.grade.level
                    )}
                  </h2>
                  <p className="text-gray-600">
                    Grade {selectedClass.grade.level} •{" "}
                    {selectedClass.students.length} of {selectedClass.capacity}{" "}
                    students
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedClass(null)}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Back to Classes
              </button>
            </div>

            {/* Students Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {selectedClass.students.map((student) => (
                <div
                  key={student.id}
                  className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 border border-gray-200 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {student.name.charAt(0)}
                      {student.surname.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {student.name} {student.surname}
                      </h3>
                      <p className="text-sm text-gray-600">{student.email}</p>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <div className="flex justify-between">
                      <span>Gender:</span>
                      <span className="font-medium">{student.sex}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Blood Type:</span>
                      <span className="font-medium">{student.bloodType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Parent:</span>
                      <span className="font-medium">
                        {student.parent.name} {student.parent.surname}
                      </span>
                    </div>
                  </div>

                  <Link
                    href={`/list/students/${student.id}`}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg flex items-center justify-center space-x-2 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    <span>View Details</span>
                  </Link>
                </div>
              ))}
            </div>

            {selectedClass.students.length === 0 && (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Students
                </h3>
                <p className="text-gray-500">
                  This class has no students enrolled yet.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Classes Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClasses.map((cls) => {
            const stats = getClassStats(cls);
            return (
              <div
                key={cls.id}
                className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer"
                onClick={() => setSelectedClass(cls)}
              >
                {/* Class Header */}
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="bg-white bg-opacity-20 rounded-full p-2">
                        <GraduationCap className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">
                          {formatClassDisplay(cls.name, cls.grade.level)}
                        </h3>
                        <p className="text-blue-100">Grade {cls.grade.level}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">
                        {stats.totalStudents}
                      </div>
                      <div className="text-blue-100 text-sm">Students</div>
                    </div>
                  </div>
                </div>

                {/* Class Stats */}
                <div className="p-6">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {stats.occupancyRate}%
                      </div>
                      <div className="text-sm text-gray-500">Occupancy</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {stats.available}
                      </div>
                      <div className="text-sm text-gray-500">Available</div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Capacity</span>
                      <span>
                        {stats.totalStudents}/{stats.capacity}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          stats.occupancyRate > 90
                            ? "bg-red-500"
                            : stats.occupancyRate > 75
                            ? "bg-yellow-500"
                            : "bg-green-500"
                        }`}
                        style={{
                          width: `${Math.min(stats.occupancyRate, 100)}%`,
                        }}
                      ></div>
                    </div>
                  </div>

                  {/* Supervisor */}
                  {cls.supervisor && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
                      <UserCheck className="w-4 h-4" />
                      <span>
                        Supervisor: {cls.supervisor.name}{" "}
                        {cls.supervisor.surname}
                      </span>
                    </div>
                  )}

                  {/* Action Button */}
                  <button className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white py-3 px-4 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center space-x-2">
                    <Eye className="w-5 h-5" />
                    <span>View Students</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {filteredClasses.length === 0 && !selectedClass && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
          <GraduationCap className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Classes Found
          </h3>
          <p className="text-gray-500">
            {searchTerm
              ? "No classes match your search criteria."
              : "No classes have been created yet."}
          </p>
        </div>
      )}
    </div>
  );
};

export default ClassWiseStudentView;
