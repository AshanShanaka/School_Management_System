"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Table from "@/components/Table";
import StudentForm from "@/components/StudentForm";
import ConfirmationModal from "@/components/ConfirmationModal";
import { formatClassName } from "@/lib/formatClassName";
import toast from "react-hot-toast";

type Student = {
  id: string;
  name: string;
  surname: string;
  email: string;
  username: string;
  indexNumber?: string;
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
  const [expandedClasses, setExpandedClasses] = useState<Set<string>>(new Set());
  const [bulkGenerating, setBulkGenerating] = useState(false);

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

  const handleBulkGenerateIndexNumbers = async () => {
    if (!confirm("Generate index numbers for all students without one? This action cannot be undone.")) {
      return;
    }

    try {
      setBulkGenerating(true);
      const response = await fetch("/api/students/index-number", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prefix: "" }),
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(`Successfully generated ${data.count} index numbers!`);
        fetchData(currentPage, searchTerm, selectedClassId);
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to generate index numbers");
      }
    } catch (error) {
      console.error("Error bulk generating index numbers:", error);
      toast.error("An error occurred while generating index numbers");
    } finally {
      setBulkGenerating(false);
    }
  };

  // Group students by class for class view
  const groupStudentsByClass = () => {
    const grouped: { [key: string]: Student[] } = {};
    students.forEach((student) => {
      const classKey = student.class
        ? `${formatClassName(student.class.name)} (Grade ${student.class.grade?.level})`
        : "No Class Assigned";
      if (!grouped[classKey]) {
        grouped[classKey] = [];
      }
      grouped[classKey].push(student);
    });
    return grouped;
  };

  // Toggle class expansion
  const toggleClass = (className: string) => {
    const newExpanded = new Set(expandedClasses);
    if (newExpanded.has(className)) {
      newExpanded.delete(className);
    } else {
      newExpanded.add(className);
    }
    setExpandedClasses(newExpanded);
  };

  const columns = [
    { header: "Info", accessor: "info" },
    { header: "Index No.", accessor: "indexNumber", className: "hidden lg:table-cell" },
    { header: "Class", accessor: "class", className: "hidden md:table-cell" },
    { header: "Parent/Guardian", accessor: "parent", className: "hidden md:table-cell" },
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
      className="border-b border-gray-100 even:bg-blue-50/30 text-sm hover:bg-indigo-50/50 transition-colors"
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
          <h3 className="font-semibold text-gray-800">
            {item.name} {item.surname}
          </h3>
          <p className="text-xs text-gray-500">{item.email}</p>
          <p className="text-xs text-indigo-600 font-medium">@{item.username}</p>
        </div>
      </td>
      <td className="hidden lg:table-cell">
        {item.indexNumber ? (
          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
            {item.indexNumber}
          </span>
        ) : (
          <span className="text-gray-400 text-sm">Not set</span>
        )}
      </td>
      <td className="hidden md:table-cell">
        {item.class ? (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            {formatClassName(item.class.name)}
          </span>
        ) : (
          <span className="text-gray-400 text-sm">No class</span>
        )}
      </td>
      <td className="hidden md:table-cell">
        {item.parent ? (
          <span className="text-sm text-gray-700">
            {item.parent.name} {item.parent.surname}
          </span>
        ) : (
          <span className="text-gray-400 text-sm">Not assigned</span>
        )}
      </td>
      <td className="hidden lg:table-cell">{item.phone || "N/A"}</td>
      <td className="hidden lg:table-cell">{item.address || "N/A"}</td>
      {user?.role === "admin" && (
        <td>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleEditStudent(item)}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 shadow-sm transition-all transform hover:scale-105"
              title="Edit Student"
            >
              <Image src="/update.png" alt="" width={16} height={16} />
            </button>
            <button
              onClick={() => handleDeleteClick(item)}
              disabled={deleting === item.id}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 shadow-sm transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Delete Student"
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
    <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6 rounded-xl shadow-lg flex-1 m-4 mt-0">
      {/* Header with gradient */}
      <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-md border border-white/20 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
              {user?.role === "teacher"
                ? "My Students"
                : user?.role === "parent"
                ? "My Children"
                : user?.role === "student"
                ? "My Classmates"
                : "All Students"}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Total: {total} student{total !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex flex-col md:flex-row items-center gap-3">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const value = (e.currentTarget[0] as HTMLInputElement).value;
                handleSearch(value);
              }}
              className="w-full md:w-auto flex items-center gap-2 text-sm rounded-lg border border-gray-300 px-3 py-2 bg-white/90 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 shadow-sm transition-all"
            >
              <Image src="/search.png" alt="" width={16} height={16} className="opacity-50" />
              <input
                type="text"
                placeholder="Search students..."
                className="w-[200px] bg-transparent outline-none text-gray-700 placeholder-gray-400"
                defaultValue={searchTerm}
              />
            </form>
            <div className="flex items-center gap-2">
              <button className="p-2 rounded-lg bg-white/90 border border-gray-200 hover:bg-indigo-50 hover:border-indigo-300 transition-all shadow-sm" title="Filter">
                <Image src="/filter.png" alt="" width={18} height={18} />
              </button>
              <button className="p-2 rounded-lg bg-white/90 border border-gray-200 hover:bg-indigo-50 hover:border-indigo-300 transition-all shadow-sm" title="Sort">
                <Image src="/sort.png" alt="" width={18} height={18} />
              </button>
              {user?.role === "admin" && (
                <>
                  <button
                    onClick={handleBulkGenerateIndexNumbers}
                    disabled={bulkGenerating}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium transition-all shadow-md transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Auto-Generate Index Numbers"
                  >
                    {bulkGenerating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span className="hidden md:inline">Generating...</span>
                      </>
                    ) : (
                      <>
                        <span className="text-lg">🔢</span>
                        <span className="hidden md:inline">Auto Index</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleCreateStudent}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium transition-all shadow-md transform hover:scale-105"
                    title="Add New Student"
                  >
                    <Image
                      src="/create.png"
                      alt="Add Student"
                      width={16}
                      height={16}
                    />
                    <span className="hidden sm:inline">Add Student</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Admin-specific filters and view controls */}
      {user?.role === "admin" && (
        <div className="flex items-center justify-between gap-4 mb-6 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
          <div className="flex items-center gap-4">
            <select
              value={selectedClassId}
              onChange={(e) => handleClassFilter(e.target.value)}
              className="px-3 py-2 border border-indigo-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400 bg-white"
            >
              <option value="all">All Classes ({total} total)</option>
              {classes.map((cls) => {
                const actualCount = students.filter(
                  (s) => s.class?.id === cls.id
                ).length;
                const displayCount =
                  viewMode === "class" && selectedClassId === cls.id.toString()
                    ? actualCount
                    : cls._count?.students || 0;

                return (
                  <option key={cls.id} value={cls.id.toString()}>
                    {formatClassName(cls.name)} - Grade {cls.grade?.level} ({displayCount})
                  </option>
                );
              })}
            </select>
          </div>

          <div className="flex bg-white border border-indigo-300 rounded-md overflow-hidden shadow-sm">
            <button
              onClick={() => setViewMode("list")}
              className={`px-3 py-2 text-sm transition-colors ${
                viewMode === "list"
                  ? "bg-indigo-500 text-white"
                  : "text-indigo-700 hover:bg-indigo-100"
              }`}
            >
              List
            </button>
            <button
              onClick={() => setViewMode("class")}
              className={`px-3 py-2 text-sm transition-colors ${
                viewMode === "class"
                  ? "bg-indigo-500 text-white"
                  : "text-indigo-700 hover:bg-indigo-100"
              }`}
            >
              Class View
            </button>
          </div>
        </div>
      )}

      {/* Simple Class View for Admin */}
      {user?.role === "admin" && viewMode === "class" ? (
        <div className="space-y-3">
          {Object.entries(groupStudentsByClass()).length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500 mb-4">No students found</div>
              {user?.role === "admin" && (
                <button
                  onClick={handleCreateStudent}
                  className="px-4 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 transition-colors"
                >
                  Add Student
                </button>
              )}
            </div>
          ) : (
            Object.entries(groupStudentsByClass()).map(
              ([className, classStudents]) => (
                <div key={className} className="border border-indigo-200 rounded-lg overflow-hidden shadow-sm bg-white">
                  {/* Clickable Class Header */}
                  <div 
                    className="bg-gradient-to-r from-indigo-400 to-purple-400 text-white px-4 py-3 cursor-pointer hover:from-indigo-500 hover:to-purple-500 transition-all duration-200"
                    onClick={() => toggleClass(className)}
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">{className}</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-indigo-100">
                          {classStudents.length} students
                        </span>
                        <svg 
                          className={`w-5 h-5 transition-transform ${expandedClasses.has(className) ? 'rotate-180' : ''}`}
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Collapsible Students List */}
                  {expandedClasses.has(className) && (
                    <div className="divide-y divide-indigo-100 bg-white">
                      {classStudents.map((student) => (
                        <div key={student.id} className="p-4 hover:bg-indigo-50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Image
                                src={student.img || "/noAvatar.png"}
                                alt=""
                                width={40}
                                height={40}
                                className="rounded-full object-cover border-2 border-indigo-200"
                              />
                              <div>
                                <div className="font-medium text-gray-800">
                                  {student.name} {student.surname}
                                </div>
                                <div className="text-sm text-gray-600">
                                  {student.email}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="text-sm text-gray-700">
                                Guardian: {student.parent
                                  ? `${student.parent.name} ${student.parent.surname}`
                                  : "Not assigned"}
                              </div>
                              <div className="flex gap-1">
                                <button
                                  onClick={() => handleEditStudent(student)}
                                  className="w-8 h-8 flex items-center justify-center rounded-full bg-teal-500 hover:bg-teal-600 transition-colors shadow-sm"
                                >
                                  <Image src="/update.png" alt="" width={14} height={14} />
                                </button>
                                <button
                                  onClick={() => handleDeleteClick(student)}
                                  disabled={deleting === student.id}
                                  className="w-8 h-8 flex items-center justify-center rounded-full bg-red-500 hover:bg-red-600 transition-colors shadow-sm"
                                >
                                  {deleting === student.id ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                  ) : (
                                    <Image src="/delete.png" alt="" width={14} height={14} />
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            )
          )}
        </div>
      ) : (
        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-md border border-white/20 overflow-hidden">
          <Table columns={columns} renderRow={renderRow} data={students} />

          {/* Pagination */}
          <div className="px-6 py-4 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-t border-gray-200 flex items-center justify-between">
            <button
              disabled={currentPage <= 1}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 text-sm font-medium hover:bg-blue-50 hover:border-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
              onClick={() => handlePageChange(currentPage - 1)}
            >
              <span>← Previous</span>
            </button>
            <div className="flex items-center gap-2">
              {Array.from({ length: totalPages }, (_, index) => {
                const pageIndex = index + 1;
                return (
                  <button
                    key={pageIndex}
                    className={`w-10 h-10 rounded-lg text-sm font-medium transition-all shadow-sm ${
                      currentPage === pageIndex
                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md transform scale-110"
                        : "bg-white border border-gray-300 text-gray-700 hover:bg-indigo-50 hover:border-indigo-400"
                    }`}
                    onClick={() => handlePageChange(pageIndex)}
                  >
                    {pageIndex}
                  </button>
                );
              })}
            </div>
            <button
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 text-sm font-medium hover:bg-blue-50 hover:border-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
              disabled={currentPage >= totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
            >
              <span>Next →</span>
            </button>
          </div>
        </div>
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
