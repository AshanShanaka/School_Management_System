"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Table from "@/components/Table";
import SubjectForm from "@/components/forms/SubjectForm";
import ConfirmationModal from "@/components/ConfirmationModal";
import toast from "react-hot-toast";

type Teacher = {
  id: string;
  name: string;
  surname: string;
  email: string;
};

type Subject = {
  id: number;
  name: string;
  code?: string | null;
  teachers: Teacher[];
  _count?: {
    lessons: number;
    subjectAssignments: number;
    examSubjects: number;
  };
};

type User = {
  id: string;
  role: string;
};

const SubjectListPage = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [subjectToDelete, setSubjectToDelete] = useState<Subject | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [allTeachers, setAllTeachers] = useState<Teacher[]>([]);
  const ITEMS_PER_PAGE = 10;

  // Fetch user
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch("/api/auth/me");
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };
    fetchUser();
  }, []);

  // Fetch subjects
  const fetchSubjects = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/subjects");
      if (response.ok) {
        const data = await response.json();
        setSubjects(data);
        setTotal(data.length);
      } else {
        toast.error("Failed to fetch subjects");
      }
    } catch (error) {
      console.error("Error fetching subjects:", error);
      toast.error("Error loading subjects");
    } finally {
      setLoading(false);
    }
  };

  // Fetch all teachers once on mount
  const fetchAllTeachers = async () => {
    try {
      const response = await fetch("/api/teachers?all=true");
      if (response.ok) {
        const data = await response.json();
        const teachersList = data.teachers || [];
        setAllTeachers(teachersList);
      }
    } catch (error) {
      console.error("Error fetching teachers:", error);
    }
  };

  useEffect(() => {
    fetchSubjects();
    fetchAllTeachers();
  }, []);

  // Filter subjects based on search
  const filteredSubjects = subjects.filter((subject) =>
    subject.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination
  const totalPages = Math.ceil(filteredSubjects.length / ITEMS_PER_PAGE);
  const paginatedSubjects = filteredSubjects.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleCreateSubject = () => {
    setSelectedSubject(null);
    setShowForm(true);
  };

  const handleEditSubject = (subject: Subject) => {
    setSelectedSubject(subject);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setSelectedSubject(null);
  };

  const handleFormSuccess = () => {
    fetchSubjects();
    handleFormClose();
  };

  const handleDeleteClick = (subject: Subject) => {
    setSubjectToDelete(subject);
    setShowDeleteModal(true);
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setSubjectToDelete(null);
  };

  const handleDeleteSubject = async () => {
    if (!subjectToDelete) return;

    setDeleting(subjectToDelete.id);
    try {
      const response = await fetch(`/api/subjects/${subjectToDelete.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Subject deleted successfully");
        fetchSubjects();
        handleCloseDeleteModal();
      } else {
        if (data.hasDependencies) {
          toast.error(data.message || "Cannot delete subject with dependencies");
        } else {
          toast.error(data.error || "Failed to delete subject");
        }
      }
    } catch (error) {
      console.error("Error deleting subject:", error);
      toast.error("Error deleting subject");
    } finally {
      setDeleting(null);
    }
  };

  const role = user?.role;

  const columns = [
    {
      header: "Subject Name",
      accessor: "name",
    },
    {
      header: "Teachers",
      accessor: "teachers",
      className: "hidden md:table-cell",
    },
    {
      header: "Actions",
      accessor: "action",
    },
  ];

  const renderRow = (item: Subject) => (
    <tr
      key={item.id}
      className="border-b border-gray-100 even:bg-blue-50/30 text-sm hover:bg-indigo-50/50 transition-colors"
    >
      <td className="flex items-center gap-4 p-4">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center shadow-md">
          <Image src="/subject.png" alt="" width={20} height={20} />
        </div>
        <div className="flex flex-col">
          <h3 className="font-semibold text-gray-800">{item.name}</h3>
          <p className="text-xs text-gray-500">Code: {item.code || "N/A"}</p>
        </div>
      </td>
      <td className="hidden md:table-cell">
        <div className="flex flex-wrap gap-1">
          {item.teachers.length > 0 ? (
            item.teachers.map((teacher) => (
              <span
                key={teacher.id}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
              >
                {teacher.name} {teacher.surname}
              </span>
            ))
          ) : (
            <span className="text-gray-400 text-sm italic">No teachers assigned</span>
          )}
        </div>
      </td>
      <td>
        <div className="flex items-center gap-2">
          {role === "admin" && (
            <>
              <button
                onClick={() => handleEditSubject(item)}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 shadow-sm transition-all transform hover:scale-105"
                title="Edit Subject"
              >
                <Image src="/update.png" alt="" width={16} height={16} />
              </button>
              <button
                onClick={() => handleDeleteClick(item)}
                disabled={deleting === item.id}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 shadow-sm transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Delete Subject"
              >
                {deleting === item.id ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Image src="/delete.png" alt="" width={16} height={16} />
                )}
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  );

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6 rounded-xl shadow-lg flex-1 m-4 mt-0">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
              All Subjects
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Total: {total} subject{total !== 1 ? 's' : ''}
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
                placeholder="Search subjects..."
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
              {role === "admin" && (
                <button
                  onClick={handleCreateSubject}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium transition-all shadow-md transform hover:scale-105"
                  title="Add New Subject"
                >
                  <Image src="/create.png" alt="Add Subject" width={16} height={16} />
                  <span className="hidden sm:inline">Add Subject</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-md border border-white/20 overflow-hidden">
        <Table columns={columns} renderRow={renderRow} data={paginatedSubjects} />

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

      {/* Subject Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <SubjectForm
              type={selectedSubject ? "update" : "create"}
              data={selectedSubject || undefined}
              setOpen={setShowForm}
              teachers={allTeachers}
              onSuccess={handleFormSuccess}
            />
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={handleCloseDeleteModal}
        onConfirm={handleDeleteSubject}
        title="Delete Subject"
        message={`Are you sure you want to delete "${subjectToDelete?.name}"? This action cannot be undone.`}
        type="danger"
        loading={deleting === subjectToDelete?.id}
      />
    </div>
  );
};

export default SubjectListPage;
