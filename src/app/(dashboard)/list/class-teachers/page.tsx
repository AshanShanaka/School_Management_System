"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { toast } from "react-toastify";

interface Teacher {
  id: string;
  name: string;
  surname: string;
  fullName: string;
  email: string;
  phone: string;
  img: string | null;
  assignedClassId: number | null;
  assignedClass: {
    id: number;
    name: string;
    grade: {
      level: number;
    };
  } | null;
}

interface Class {
  id: number;
  name: string;
  capacity: number;
  grade: {
    id: number;
    level: number;
  };
  classTeacherId: string | null;
  classTeacher: {
    id: string;
    name: string;
    surname: string;
  } | null;
}

const ClassTeachersPage = () => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignmentLoading, setAssignmentLoading] = useState<number | null>(null);

  // Fetch all classes and teachers
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [classesRes, teachersRes] = await Promise.all([
        fetch("/api/classes"),
        fetch("/api/teachers"),
      ]);

      if (classesRes.ok && teachersRes.ok) {
        const classesData = await classesRes.json();
        const teachersData = await teachersRes.json();
        setClasses(classesData);
        setTeachers(teachersData);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (classId: number, teacherId: string) => {
    if (!teacherId) {
      toast.error("Please select a teacher");
      return;
    }

    try {
      setAssignmentLoading(classId);
      const response = await fetch("/api/class-teacher/assign", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ classId, teacherId }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message);
        fetchData(); // Refresh the data
      } else {
        toast.error(data.error || "Failed to assign class teacher");
      }
    } catch (error) {
      console.error("Error assigning class teacher:", error);
      toast.error("An error occurred");
    } finally {
      setAssignmentLoading(null);
    }
  };

  const handleRemove = async (classId: number) => {
    if (!confirm("Are you sure you want to remove this class teacher assignment?")) {
      return;
    }

    try {
      setAssignmentLoading(classId);
      const response = await fetch("/api/class-teacher/assign", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ classId }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message);
        fetchData(); // Refresh the data
      } else {
        toast.error(data.error || "Failed to remove class teacher");
      }
    } catch (error) {
      console.error("Error removing class teacher:", error);
      toast.error("An error occurred");
    } finally {
      setAssignmentLoading(null);
    }
  };

  // Get available teachers (not already assigned as class teacher)
  const getAvailableTeachers = () => {
    return teachers.filter((teacher) => !teacher.assignedClassId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Class Teachers Management</h1>
        <p className="text-gray-600 mt-2">
          Assign and manage class teachers for Grade 11 classes
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-600">Total Classes</h3>
          <p className="text-2xl font-bold text-blue-600">{classes.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-600">Assigned</h3>
          <p className="text-2xl font-bold text-green-600">
            {classes.filter((c) => c.classTeacherId).length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-600">Unassigned</h3>
          <p className="text-2xl font-bold text-red-600">
            {classes.filter((c) => !c.classTeacherId).length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-600">Available Teachers</h3>
          <p className="text-2xl font-bold text-purple-600">
            {getAvailableTeachers().length}
          </p>
        </div>
      </div>

      {/* Classes List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 bg-gray-100 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">
            Class Teacher Assignments
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Class
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Grade
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Capacity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current Class Teacher
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assign Teacher
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {classes.map((classItem) => (
                <tr key={classItem.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {classItem.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      Grade {classItem.grade.level}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{classItem.capacity}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {classItem.classTeacher ? (
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-gray-900">
                          {classItem.classTeacher.name} {classItem.classTeacher.surname}
                        </div>
                      </div>
                    ) : (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                        Not Assigned
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {!classItem.classTeacherId && (
                      <select
                        id={`teacher-select-${classItem.id}`}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        defaultValue=""
                        disabled={assignmentLoading === classItem.id}
                      >
                        <option value="">Select a teacher...</option>
                        {getAvailableTeachers().map((teacher) => (
                          <option key={teacher.id} value={teacher.id}>
                            {teacher.name} {teacher.surname}
                          </option>
                        ))}
                      </select>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {classItem.classTeacherId ? (
                      <button
                        onClick={() => handleRemove(classItem.id)}
                        disabled={assignmentLoading === classItem.id}
                        className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {assignmentLoading === classItem.id ? "Removing..." : "Remove"}
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          const select = document.getElementById(
                            `teacher-select-${classItem.id}`
                          ) as HTMLSelectElement;
                          if (select && select.value) {
                            handleAssign(classItem.id, select.value);
                          }
                        }}
                        disabled={assignmentLoading === classItem.id}
                        className="text-blue-600 hover:text-blue-900 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {assignmentLoading === classItem.id ? "Assigning..." : "Assign"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assigned Teachers Summary */}
      <div className="mt-6 bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 bg-gray-100 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">
            Current Class Teachers ({teachers.filter((t) => t.assignedClassId).length})
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
          {teachers
            .filter((teacher) => teacher.assignedClassId)
            .map((teacher) => (
              <div
                key={teacher.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
              >
                <div className="flex items-center gap-3">
                  {teacher.img ? (
                    <Image
                      src={teacher.img}
                      alt={`${teacher.name} ${teacher.surname}`}
                      width={48}
                      height={48}
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-blue-600 font-semibold text-lg">
                        {teacher.name.charAt(0)}
                      </span>
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800">
                      {teacher.name} {teacher.surname}
                    </h3>
                    <p className="text-sm text-gray-600">{teacher.email}</p>
                    {teacher.assignedClass && (
                      <p className="text-sm text-blue-600 font-medium mt-1">
                        Class: {teacher.assignedClass.name} (Grade{" "}
                        {teacher.assignedClass.grade.level})
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
        </div>
        {teachers.filter((t) => t.assignedClassId).length === 0 && (
          <div className="p-6 text-center text-gray-500">
            No class teachers assigned yet
          </div>
        )}
      </div>
    </div>
  );
};

export default ClassTeachersPage;
