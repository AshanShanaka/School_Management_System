"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Table from "@/components/Table";
import ParentForm from "@/components/ParentForm";
import ConfirmationModal from "@/components/ConfirmationModal";
import toast from "react-hot-toast";
import { formatClassName } from "@/lib/formatClassName";

type Parent = {
  id: string;
  name: string;
  surname: string;
  email: string;
  phone?: string;
  address?: string;
  students?: {
    id: string;
    name: string;
    surname: string;
    class?: {
      id: number;
      name: string;
      grade: { level: number };
    };
  }[];
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

const ParentListPage = () => {
  const [parents, setParents] = useState<Parent[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [selectedParent, setSelectedParent] = useState<Parent | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [parentToDelete, setParentToDelete] = useState<Parent | null>(null);
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"list" | "class">("list");
  const [expandedClasses, setExpandedClasses] = useState<Set<string>>(new Set());

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

      // Fetch parents with viewMode parameter
      const params = new URLSearchParams({
        page: page.toString(),
        viewMode: viewMode, // Include current view mode
        ...(search && { search }),
        ...(classId && classId !== "all" && { classId }),
      });

      const res = await fetch(`/api/parents?${params}`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setParents(data.parents);
        setTotal(data.total);
        setTotalPages(data.totalPages);
        setCurrentPage(page);
      } else {
        console.error("Failed to fetch parents");
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

  const handleCreateParent = () => {
    setSelectedParent(null);
    setShowForm(true);
  };

  const handleEditParent = (parent: Parent) => {
    setSelectedParent(parent);
    setShowForm(true);
  };

  const handleDeleteClick = (parent: Parent) => {
    setParentToDelete(parent);
    setShowDeleteModal(true);
  };

  const handleDeleteParent = async () => {
    if (!parentToDelete) return;

    try {
      setDeleting(parentToDelete.id);
      const response = await fetch(`/api/parents/${parentToDelete.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (response.ok) {
        toast.success("Guardian deleted successfully!");
        fetchData(currentPage, searchTerm);
        setShowDeleteModal(false);
        setParentToDelete(null);
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to delete guardian");
      }
    } catch (error) {
      console.error("Error deleting guardian:", error);
      toast.error("An error occurred while deleting guardian");
    } finally {
      setDeleting(null);
    }
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setParentToDelete(null);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setSelectedParent(null);
  };

  const handleFormSuccess = () => {
    fetchData(currentPage, searchTerm, selectedClassId);
  };

  // Group parents by their children's classes
  const groupParentsByClass = () => {
    const grouped: { [key: string]: Parent[] } = {};

    parents.forEach((parent) => {
      if (parent.students && parent.students.length > 0) {
        parent.students.forEach((student) => {
          const classKey = student.class
            ? `${formatClassName(student.class.name)} (Grade ${student.class.grade?.level})`
            : "No Class Assigned";

          if (!grouped[classKey]) {
            grouped[classKey] = [];
          }

          // Only add parent if not already in this class group
          if (!grouped[classKey].find((p) => p.id === parent.id)) {
            grouped[classKey].push(parent);
          }
        });
      } else {
        // Parents with no children
        const classKey = "No Children Assigned";
        if (!grouped[classKey]) {
          grouped[classKey] = [];
        }
        grouped[classKey].push(parent);
      }
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
    {
      header: "Students",
      accessor: "students",
      className: "hidden md:table-cell",
    },
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

  const renderRow = (item: Parent) => (
    <tr
      key={item.id}
      className="border-b border-gray-100 even:bg-blue-50/30 text-sm hover:bg-indigo-50/50 transition-colors"
    >
      <td className="flex items-center gap-4 p-4">
        <Image
          src="/noAvatar.png"
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
          <p className="text-xs text-indigo-600 font-medium">
            {item.students?.length || 0} child{item.students?.length !== 1 ? 'ren' : ''}
          </p>
        </div>
      </td>
      <td className="hidden md:table-cell">
        <div className="flex flex-col gap-1">
          {item.students?.length > 0 ? item.students.map((student) => (
            <div key={student.id} className="flex items-center gap-2">
              <span className="text-sm text-gray-700">{student.name} {student.surname}</span>
              {student.class?.name && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  {formatClassName(student.class.name)}
                </span>
              )}
            </div>
          )) : <span className="text-gray-400 text-sm">No children</span>}
        </div>
      </td>
      <td className="hidden lg:table-cell">{item.phone || "N/A"}</td>
      <td className="hidden lg:table-cell">{item.address || "N/A"}</td>
      {user?.role === "admin" && (
        <td>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleEditParent(item)}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 shadow-sm transition-all transform hover:scale-105"
              title="Edit Guardian"
            >
              <Image src="/update.png" alt="" width={16} height={16} />
            </button>
            <button
              onClick={() => handleDeleteClick(item)}
              disabled={deleting === item.id}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 shadow-sm transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Delete Guardian"
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
          <div className="text-lg">Loading parents...</div>
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
              {user?.role === "student"
                ? "My Guardian"
                : user?.role === "teacher"
                ? "Student Guardians"
                : "All Guardians"}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Total: {total} guardian{total !== 1 ? 's' : ''}
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
                placeholder="Search guardians..."
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
                <button
                  onClick={handleCreateParent}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium transition-all shadow-md transform hover:scale-105"
                  title="Add New Guardian"
                >
                  <Image
                    src="/create.png"
                    alt="Add Guardian"
                    width={16}
                    height={16}
                  />
                  <span className="hidden sm:inline">Add Guardian</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Admin-specific filters and view controls */}
      {user?.role === "admin" && (
        <div className="flex items-center justify-between gap-4 mb-6 p-4 bg-white/80 backdrop-blur-sm rounded-lg border border-white/20 shadow-md">
          <div className="flex items-center gap-4">
            <select
              value={selectedClassId}
              onChange={(e) => handleClassFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option value="all">All Guardians ({total} total)</option>
              {classes.map((cls) => {
                const parentsInClass = parents.filter((parent) =>
                  parent.students?.some(
                    (student) => student.class?.id === cls.id
                  )
                ).length;
                const displayCount =
                  viewMode === "class" && selectedClassId === cls.id.toString()
                    ? parentsInClass
                    : `${cls._count?.students || 0} students`;

                return (
                  <option key={cls.id} value={cls.id.toString()}>
                    {formatClassName(cls.name)} - Grade {cls.grade?.level} ({displayCount})
                  </option>
                );
              })}
            </select>
          </div>

          <div className="flex bg-white border border-gray-300 rounded-md overflow-hidden shadow-sm">
            <button
              onClick={() => setViewMode("list")}
              className={`px-3 py-2 text-sm transition-all ${
                viewMode === "list"
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                  : "text-gray-700 hover:bg-indigo-50"
              }`}
            >
              List
            </button>
            <button
              onClick={() => setViewMode("class")}
              className={`px-3 py-2 text-sm transition-all ${
                viewMode === "class"
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                  : "text-gray-700 hover:bg-indigo-50"
              }`}
            >
              Guardian View
            </button>
          </div>
        </div>
      )}

      {/* Simple Guardian View for Admin */}
      {user?.role === "admin" && viewMode === "class" ? (
        <div className="space-y-3">
          {Object.entries(groupParentsByClass()).length === 0 ? (
            <div className="text-center py-12 bg-white/80 backdrop-blur-sm rounded-xl border border-white/20">
              <div className="text-gray-500 mb-4">No guardians found</div>
              {user?.role === "admin" && (
                <button
                  onClick={handleCreateParent}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg shadow-md transition-all transform hover:scale-105"
                >
                  Add Guardian
                </button>
              )}
            </div>
          ) : (
            Object.entries(groupParentsByClass()).map(
              ([className, classParents]) => (
                <div key={className} className="border border-white/20 rounded-lg overflow-hidden shadow-md bg-white/90 backdrop-blur-sm">
                  {/* Clickable Class Header */}
                  <div 
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-3 cursor-pointer hover:from-blue-700 hover:to-indigo-700 transition-all duration-200"
                    onClick={() => toggleClass(className)}
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">{className}</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-blue-100">
                          {classParents.length} guardians
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

                  {/* Collapsible Guardians List */}
                  {expandedClasses.has(className) && (
                    <div className="divide-y divide-gray-100 bg-white">
                      {classParents.map((parent) => (
                        <div key={parent.id} className="p-4 hover:bg-indigo-50/50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Image
                                src="/noAvatar.png"
                                alt=""
                                width={40}
                                height={40}
                                className="rounded-full object-cover border-2 border-indigo-200"
                              />
                              <div>
                                <div className="font-medium text-gray-800">
                                  {parent.name} {parent.surname}
                                </div>
                                <div className="text-sm text-gray-600">
                                  {parent.email}
                                </div>
                                <div className="text-sm text-gray-700">
                                  Phone: {parent.phone || "Not provided"}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-sm text-gray-700">
                                <div className="font-medium">Children:</div>
                                {parent.students && parent.students.length > 0 ? (
                                  <div className="space-y-1">
                                    {parent.students.map((student) => (
                                      <div key={student.id} className="text-xs">
                                        {student.name} {student.surname}
                                        {student.class && (
                                          <span className="text-gray-600">
                                            {" "}({formatClassName(student.class.name)})
                                          </span>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-xs text-gray-600">No children assigned</div>
                                )}
                              </div>
                              <div className="flex gap-1">
                                <button
                                  onClick={() => handleEditParent(parent)}
                                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 transition-all shadow-sm transform hover:scale-105"
                                >
                                  <Image src="/update.png" alt="" width={14} height={14} />
                                </button>
                                <button
                                  onClick={() => handleDeleteClick(parent)}
                                  disabled={deleting === parent.id}
                                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 transition-all shadow-sm transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {deleting === parent.id ? (
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
          <Table columns={columns} renderRow={renderRow} data={parents} />

          <div className="p-4 flex items-center justify-between bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50">
            <button
              disabled={currentPage <= 1}
              className="py-2 px-4 rounded-lg bg-white border border-gray-300 text-sm font-medium text-gray-700 hover:bg-indigo-50 hover:border-indigo-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
              onClick={() => handlePageChange(currentPage - 1)}
            >
              ← Previous
            </button>
            <div className="flex items-center gap-2">
              {Array.from({ length: totalPages }, (_, index) => {
                const pageIndex = index + 1;
                return (
                  <button
                    key={pageIndex}
                    className={`w-9 h-9 rounded-lg font-medium text-sm transition-all ${
                      currentPage === pageIndex
                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md transform scale-110"
                        : "bg-white text-gray-700 hover:bg-indigo-50 border border-gray-300 hover:border-indigo-300"
                    }`}
                    onClick={() => handlePageChange(pageIndex)}
                  >
                    {pageIndex}
                  </button>
                );
              })}
            </div>
            <button
              className="py-2 px-4 rounded-lg bg-white border border-gray-300 text-sm font-medium text-gray-700 hover:bg-indigo-50 hover:border-indigo-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
              disabled={currentPage >= totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Parent Form Modal */}
      <ParentForm
        isOpen={showForm}
        onClose={handleFormClose}
        parent={selectedParent}
        onSuccess={handleFormSuccess}
      />

      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={handleCloseDeleteModal}
        onConfirm={handleDeleteParent}
        title="Delete Guardian"
        message={`Are you sure you want to delete ${parentToDelete?.name} ${parentToDelete?.surname}? This action cannot be undone.`}
        type="danger"
        loading={deleting === parentToDelete?.id}
      />
    </div>
  );
};

export default ParentListPage;
