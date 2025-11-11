"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Table from "@/components/Table";
import TeacherForm from "@/components/TeacherForm";
import ConfirmationModal from "@/components/ConfirmationModal";
import toast from "react-hot-toast";
import { formatClassName } from "@/lib/formatClassName";

type Teacher = {
  id: string;
  name: string;
  surname: string;
  email: string;
  username: string;
  phone?: string;
  address?: string;
  img?: string;
  subjects: { name: string }[];
  classes: { name: string }[];
};

type User = {
  id: string;
  role: string;
};

const TeacherListPage = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [teacherToDelete, setTeacherToDelete] = useState<Teacher | null>(null);

  const fetchData = async (page = 1, search = "") => {
    try {
      setLoading(true);

      // Fetch current user
      const userRes = await fetch("/api/auth/me", { credentials: "include" });
      if (userRes.ok) {
        const userData = await userRes.json();
        setUser(userData.user);
      }

      // Fetch teachers
      const params = new URLSearchParams({
        page: page.toString(),
        ...(search && { search }),
      });

      const res = await fetch(`/api/teachers?${params}`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setTeachers(data.teachers);
        setTotal(data.total);
        setTotalPages(data.totalPages);
        setCurrentPage(page);
      } else {
        console.error("Failed to fetch teachers");
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

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    fetchData(1, term);
  };

  const handlePageChange = (page: number) => {
    fetchData(page, searchTerm);
  };

  const handleCreateTeacher = () => {
    setSelectedTeacher(null);
    setShowForm(true);
  };

  const handleEditTeacher = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setShowForm(true);
  };

  const handleDeleteClick = (teacher: Teacher) => {
    setTeacherToDelete(teacher);
    setShowDeleteModal(true);
  };

  const handleDeleteTeacher = async () => {
    if (!teacherToDelete) return;

    try {
      setDeleting(teacherToDelete.id);
      const response = await fetch(`/api/teachers/${teacherToDelete.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (response.ok) {
        toast.success("Teacher deleted successfully!");
        fetchData(currentPage, searchTerm);
        setShowDeleteModal(false);
        setTeacherToDelete(null);
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to delete teacher");
      }
    } catch (error) {
      console.error("Error deleting teacher:", error);
      toast.error("An error occurred while deleting teacher");
    } finally {
      setDeleting(null);
    }
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setTeacherToDelete(null);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setSelectedTeacher(null);
  };

  const handleFormSuccess = () => {
    fetchData(currentPage, searchTerm);
  };

  const columns = [
    { header: "Info", accessor: "info" },
    {
      header: "Subjects",
      accessor: "subjects",
      className: "hidden md:table-cell",
    },
    {
      header: "Classes",
      accessor: "classes",
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

  const renderRow = (item: Teacher) => (
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
      <td className="hidden md:table-cell">
        <div className="flex flex-wrap gap-1">
          {item.subjects?.length > 0 ? item.subjects.map((s) => (
            <span key={s.name} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {s.name}
            </span>
          )) : <span className="text-gray-400 text-sm">No subjects</span>}
        </div>
      </td>
      <td className="hidden md:table-cell">
        <div className="flex flex-wrap gap-1">
          {item.classes?.length > 0 ? item.classes.map((c) => (
            <span key={c.name} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              {formatClassName(c.name)}
            </span>
          )) : <span className="text-gray-400 text-sm">No classes</span>}
        </div>
      </td>
      <td className="hidden lg:table-cell">{item.phone || "N/A"}</td>
      <td className="hidden lg:table-cell">{item.address || "N/A"}</td>
      {user?.role === "admin" && (
        <td>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleEditTeacher(item)}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 shadow-sm transition-all transform hover:scale-105"
              title="Edit Teacher"
            >
              <Image src="/update.png" alt="" width={16} height={16} />
            </button>
            <button
              onClick={() => handleDeleteClick(item)}
              disabled={deleting === item.id}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 shadow-sm transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Delete Teacher"
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
          <div className="text-lg">Loading teachers...</div>
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
                ? "My Teachers"
                : user?.role === "parent"
                ? "Children's Teachers"
                : "All Teachers"}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Total: {total} teacher{total !== 1 ? 's' : ''}
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
                placeholder="Search teachers..."
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
                  onClick={handleCreateTeacher}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium transition-all shadow-md transform hover:scale-105"
                  title="Add New Teacher"
                >
                  <Image
                    src="/create.png"
                    alt="Add Teacher"
                    width={16}
                    height={16}
                  />
                  <span className="hidden sm:inline">Add Teacher</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-md border border-white/20 overflow-hidden">
        <Table columns={columns} renderRow={renderRow} data={teachers} />

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

      {/* Teacher Form Modal */}
      <TeacherForm
        isOpen={showForm}
        onClose={handleFormClose}
        teacher={selectedTeacher}
        onSuccess={handleFormSuccess}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={handleCloseDeleteModal}
        onConfirm={handleDeleteTeacher}
        title="Delete Teacher"
        message={`Are you sure you want to delete ${teacherToDelete?.name} ${teacherToDelete?.surname}? This action cannot be undone and will remove all associated data including subject assignments.`}
        confirmText="Delete Teacher"
        cancelText="Cancel"
        type="danger"
        loading={deleting === teacherToDelete?.id}
      />
    </div>
  );
};

export default TeacherListPage;
