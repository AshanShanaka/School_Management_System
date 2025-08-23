"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Table from "@/components/Table";
import StudentForm from "@/components/StudentForm";
import ConfirmationModal from "@/components/ConfirmationModal";
import { formatClassDisplay } from "@/lib/formatters";
import toast from "react-hot-toast";

type Student = {
  id: string;
  name: string;
  surname: string;
  email: string;
  username: string;
  phone?: string;
  address?: string;
  img?: string;
  birthday?: string;
  class?: {
    id: number;
    name: string;
    grade: { level: number };
  };
  parent?: {
    name: string;
    surname: string;
  };
};

type Class = {
  id: number;
  name: string;
  grade: { level: number };
  _count: { students: number };
};

type User = {
  id: string;
  role: string;
};

const StudentListPage = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"list" | "class">("list");

  const fetchData = async (page = 1, search = "", classId = "") => {
    try {
      setLoading(true);

      // Fetch current user
      const userRes = await fetch("/api/auth/me", { credentials: "include" });
      if (userRes.ok) {
        const userData = await userRes.json();
        setUser(userData.user);

        // Fetch classes if admin
        if (userData.user?.role === "admin") {
          const classesRes = await fetch("/api/classes", {
            credentials: "include",
          });
          if (classesRes.ok) {
            const classesData = await classesRes.json();
            setClasses(classesData.classes);
          }
        }
      }

      // Fetch students with viewMode parameter
      const params = new URLSearchParams({
        page: page.toString(),
        viewMode: viewMode, // Include current view mode
        ...(search && { search }),
        ...(classId && classId !== "all" && { classId }),
      });

      const res = await fetch(`/api/students?${params}`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setStudents(data.students);
        setTotal(data.total);
        setTotalPages(data.totalPages);
        setCurrentPage(page);
      } else {
        console.error("Failed to fetch students");
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Refetch data when view mode changes
  useEffect(() => {
    if (user) {
      fetchData(currentPage, searchTerm, selectedClassId);
    }
  }, [viewMode]);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    fetchData(1, term, selectedClassId);
  };

  const handlePageChange = (page: number) => {
    fetchData(page, searchTerm, selectedClassId);
  };

  const handleClassFilter = (classId: string) => {
    setSelectedClassId(classId);
    setCurrentPage(1);
    fetchData(1, searchTerm, classId);
  };

  const handleCreateStudent = () => {
    setSelectedStudent(null);
    setShowForm(true);
  };

  const handleEditStudent = (student: Student) => {
    setSelectedStudent(student);
    setShowForm(true);
  };

  const handleDeleteClick = (student: Student) => {
    setStudentToDelete(student);
    setShowDeleteModal(true);
  };

  const handleDeleteStudent = async () => {
    if (!studentToDelete) return;

    try {
      setDeleting(studentToDelete.id);
      const response = await fetch(`/api/students/${studentToDelete.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (response.ok) {
        toast.success("Student deleted successfully!");
        fetchData(currentPage, searchTerm);
        setShowDeleteModal(false);
        setStudentToDelete(null);
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to delete student");
      }
    } catch (error) {
      console.error("Error deleting student:", error);
      toast.error("An error occurred while deleting student");
    } finally {
      setDeleting(null);
    }
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setStudentToDelete(null);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setSelectedStudent(null);
  };

  const handleFormSuccess = () => {
    fetchData(currentPage, searchTerm, selectedClassId);
  };

  // Group students by class for class view
  const groupStudentsByClass = () => {
    const grouped: { [key: string]: Student[] } = {};
    students.forEach((student) => {
      const classKey = student.class
        ? `${student.class.name} (Grade ${student.class.grade?.level})`
        : "No Class Assigned";
      if (!grouped[classKey]) {
        grouped[classKey] = [];
      }
      grouped[classKey].push(student);
    });
    return grouped;
  };

  const columns = [
    { header: "Info", accessor: "info" },
    {
      header: "Student ID",
      accessor: "studentId",
      className: "hidden md:table-cell",
    },
    { header: "Class", accessor: "class", className: "hidden md:table-cell" },
    { header: "Phone", accessor: "phone", className: "hidden lg:table-cell" },
    {
      header: "Address",
      accessor: "address",
      className: "hidden lg:table-cell",
    },
    ...(user?.role === "admin"
      ? [{ header: "Actions", accessor: "action" }]
      : []),
  ];

  const renderRow = (item: Student) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
    >
      <td className="flex items-center gap-4 p-4">
        <Image
          src={item.img || "/noAvatar.png"}
          alt=""
          width={40}
          height={40}
          className="md:hidden xl:block w-10 h-10 rounded-full object-cover"
        />
        <div className="flex flex-col">
          <h3 className="font-semibold">
            {item.name} {item.surname}
          </h3>
          <p className="text-xs text-gray-500">{item.email}</p>
        </div>
      </td>
      <td className="hidden md:table-cell">{item.username}</td>
      <td className="hidden md:table-cell">
        {item.class
          ? formatClassDisplay(item.class.name, item.class.grade?.level)
          : "No class"}
      </td>
      <td className="hidden lg:table-cell">{item.phone || "N/A"}</td>
      <td className="hidden lg:table-cell">{item.address || "N/A"}</td>
      {user?.role === "admin" && (
        <td>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleEditStudent(item)}
              className="w-7 h-7 flex items-center justify-center rounded-full bg-lamaSky"
            >
              <Image src="/update.png" alt="" width={16} height={16} />
            </button>
            <button
              onClick={() => handleDeleteClick(item)}
              disabled={deleting === item.id}
              className="w-7 h-7 flex items-center justify-center rounded-full bg-lamaPurple"
            >
              {deleting === item.id ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Image src="/delete.png" alt="" width={16} height={16} />
              )}
            </button>
          </div>
        </td>
      )}
    </tr>
  );

  if (loading) {
    return (
      <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading students...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      <div className="flex items-center justify-between mb-4">
        <h1 className="hidden md:block text-lg font-semibold">
          {user?.role === "teacher"
            ? "My Students"
            : user?.role === "parent"
            ? "My Children"
            : user?.role === "student"
            ? "My Classmates"
            : "All Students"}
        </h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const value = (e.currentTarget[0] as HTMLInputElement).value;
              handleSearch(value);
            }}
            className="w-full md:w-auto flex items-center gap-2 text-xs rounded-full ring-[1.5px] ring-gray-300 px-2"
          >
            <Image src="/search.png" alt="" width={14} height={14} />
            <input
              type="text"
              placeholder="Search..."
              className="w-[200px] p-2 bg-transparent outline-none"
              defaultValue={searchTerm}
            />
          </form>
          <div className="flex items-center gap-4 self-end">
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/filter.png" alt="" width={14} height={14} />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/sort.png" alt="" width={14} height={14} />
            </button>
            {user?.role === "admin" && (
              <button
                onClick={handleCreateStudent}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow hover:bg-yellow-500 transition-colors"
                title="Add New Student"
              >
                <Image
                  src="/create.png"
                  alt="Add Student"
                  width={16}
                  height={16}
                />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Admin-specific class filters and view controls */}
      {user?.role === "admin" && (
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 shadow-sm">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4 w-full">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Image src="/class.png" alt="" width={20} height={20} />
              </div>
              <div className="flex flex-col">
                <label className="text-sm font-semibold text-gray-800">
                  Filter by Class
                </label>
                <p className="text-xs text-gray-500">
                  Select a specific class to view students
                </p>
              </div>
            </div>
            <select
              value={selectedClassId}
              onChange={(e) => handleClassFilter(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm min-w-[250px]"
            >
              <option value="all">
                🏫 All Classes ({total} students total)
              </option>
              {classes.map((cls) => {
                // Get actual count for this specific class
                const actualCount = students.filter(
                  (s) => s.class?.id === cls.id
                ).length;
                const displayCount =
                  viewMode === "class" && selectedClassId === cls.id.toString()
                    ? actualCount
                    : cls._count?.students || 0;

                return (
                  <option key={cls.id} value={cls.id.toString()}>
                    📚 {cls.name} - Grade {cls.grade?.level} ({displayCount}{" "}
                    students)
                  </option>
                );
              })}
            </select>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end">
              <label className="text-sm font-semibold text-gray-800">
                View Mode
              </label>
              <p className="text-xs text-gray-500">
                Choose how to display students
              </p>
            </div>
            <div className="flex bg-white border border-gray-300 rounded-lg shadow-sm overflow-hidden">
              <button
                onClick={() => setViewMode("list")}
                className={`px-4 py-3 text-sm font-medium transition-all duration-200 ${
                  viewMode === "list"
                    ? "bg-blue-500 text-white shadow-sm"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                📋 List View
              </button>
              <button
                onClick={() => setViewMode("class")}
                className={`px-4 py-3 text-sm font-medium transition-all duration-200 ${
                  viewMode === "class"
                    ? "bg-blue-500 text-white shadow-sm"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                🏫 Class View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Class View for Admin */}
      {user?.role === "admin" && viewMode === "class" ? (
        <div className="space-y-8">
          {Object.entries(groupStudentsByClass()).length === 0 ? (
            <div className="text-center py-16">
              <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Image
                  src="/student.png"
                  alt=""
                  width={40}
                  height={40}
                  className="opacity-50"
                />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Students Found
              </h3>
              <p className="text-gray-500">
                {selectedClassId !== "all"
                  ? "No students in the selected class."
                  : "No students have been added yet."}
              </p>
              {user?.role === "admin" && (
                <button
                  onClick={handleCreateStudent}
                  className="mt-4 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Add First Student
                </button>
              )}
            </div>
          ) : (
            Object.entries(groupStudentsByClass()).map(
              ([className, classStudents]) => (
                <div
                  key={className}
                  className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200"
                >
                  {/* Class Header */}
                  <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 text-white px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                          <Image
                            src="/class.png"
                            alt=""
                            width={24}
                            height={24}
                          />
                        </div>
                        <div>
                          <h3 className="font-bold text-xl">{className}</h3>
                          <p className="text-blue-100 text-sm">
                            {classStudents.length} student
                            {classStudents.length !== 1 ? "s" : ""} enrolled
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm font-medium">
                          {classStudents.length} 👥
                        </span>
                        <button className="p-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-colors">
                          <Image
                            src="/more.png"
                            alt=""
                            width={16}
                            height={16}
                          />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Students Grid/List */}
                  <div className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                      {classStudents.map((student) => (
                        <div
                          key={student.id}
                          className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors duration-200 border border-gray-200"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3 flex-1">
                              <div className="relative">
                                <Image
                                  src={student.img || "/noAvatar.png"}
                                  alt=""
                                  width={48}
                                  height={48}
                                  className="rounded-full object-cover border-2 border-white shadow-sm"
                                />
                                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-gray-900 truncate">
                                  {student.name} {student.surname}
                                </h4>
                                <p className="text-sm text-gray-600 truncate">
                                  {student.email}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                    ID: {student.username}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 ml-2">
                              <button
                                onClick={() => handleEditStudent(student)}
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-500 hover:bg-blue-600 transition-colors shadow-sm"
                                title="Edit Student"
                              >
                                <Image
                                  src="/update.png"
                                  alt=""
                                  width={14}
                                  height={14}
                                />
                              </button>
                              <button
                                onClick={() => handleDeleteClick(student)}
                                disabled={deleting === student.id}
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-red-500 hover:bg-red-600 transition-colors shadow-sm"
                                title="Delete Student"
                              >
                                {deleting === student.id ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                ) : (
                                  <Image
                                    src="/delete.png"
                                    alt=""
                                    width={14}
                                    height={14}
                                  />
                                )}
                              </button>
                            </div>
                          </div>

                          {/* Additional Info */}
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <span className="text-gray-500">Parent:</span>
                                <p className="font-medium text-gray-700 truncate">
                                  {student.parent
                                    ? `${student.parent.name} ${student.parent.surname}`
                                    : "Not assigned"}
                                </p>
                              </div>
                              <div>
                                <span className="text-gray-500">Phone:</span>
                                <p className="font-medium text-gray-700">
                                  {student.phone || "Not provided"}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Class Summary Footer */}
                    <div className="mt-6 pt-4 border-t border-gray-200">
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <div className="flex items-center gap-4">
                          <span>
                            👥 Total Students:{" "}
                            <strong>{classStudents.length}</strong>
                          </span>
                          <span>
                            📧 With Email:{" "}
                            <strong>
                              {classStudents.filter((s) => s.email).length}
                            </strong>
                          </span>
                          <span>
                            👨‍👩‍👧‍👦 With Parents:{" "}
                            <strong>
                              {classStudents.filter((s) => s.parent).length}
                            </strong>
                          </span>
                        </div>
                        <button
                          onClick={handleCreateStudent}
                          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
                        >
                          + Add Student to {className}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            )
          )}
        </div>
      ) : (
        <>
          <Table columns={columns} renderRow={renderRow} data={students} />

          <div className="p-4 flex items-center justify-between text-gray-500">
            <button
              disabled={currentPage <= 1}
              className="py-2 px-4 rounded-md bg-slate-200 text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => handlePageChange(currentPage - 1)}
            >
              Prev
            </button>
            <div className="flex items-center gap-2 text-sm">
              {Array.from({ length: totalPages }, (_, index) => {
                const pageIndex = index + 1;
                return (
                  <button
                    key={pageIndex}
                    className={`px-2 rounded-sm ${
                      currentPage === pageIndex ? " bg-lamaSky" : ""
                    }`}
                    onClick={() => handlePageChange(pageIndex)}
                  >
                    {pageIndex}
                  </button>
                );
              })}
            </div>
            <button
              className="py-2 px-4 rounded-md bg-slate-200 text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={currentPage >= totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
            >
              Next
            </button>
          </div>
        </>
      )}

      {/* Student Form Modal */}
      <StudentForm
        isOpen={showForm}
        onClose={handleFormClose}
        student={selectedStudent}
        onSuccess={handleFormSuccess}
      />

      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={handleCloseDeleteModal}
        onConfirm={handleDeleteStudent}
        title="Delete Student"
        message={`Are you sure you want to delete ${studentToDelete?.name} ${studentToDelete?.surname}? This action cannot be undone.`}
        type="danger"
        loading={deleting === studentToDelete?.id}
      />
    </div>
  );
};

export default StudentListPage;
