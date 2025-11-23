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
        toast.error(data.error || "Failed to delete subject");
      }
    } catch (error) {
      console.error("Error deleting subject:", error);
      toast.error("Error deleting subject");
    } finally {
      setDeleting(null);
    }
  };

  const columns = [
    { header: "Subject Name", accessor: "name" },
    {
      header: "Teachers",
      accessor: "teachers",
      className: "hidden md:table-cell",
    },
    { header: "Actions", accessor: "action" },
  ];

  const renderRow = (item: Subject) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
    >
      <td className="flex items-center gap-4 p-4">{item.name}</td>
      <td className="hidden md:table-cell">
        {item.teachers && item.teachers.length > 0
          ? item.teachers.map((teacher) => teacher.name).join(", ")
          : "-"}
      </td>
      <td>
        <div className="flex items-center gap-2">
          {user?.role === "admin" && (
            <>
              <button
                className="w-7 h-7 flex items-center justify-center rounded-full bg-lamaSky"
                onClick={() => handleEditSubject(item)}
              >
                <Image src="/update.png" alt="" width={16} height={16} />
              </button>
              <button
                className="w-7 h-7 flex items-center justify-center rounded-full bg-lamaPurple"
                onClick={() => handleDeleteClick(item)}
                disabled={deleting === item.id}
              >
                {deleting === item.id ? (
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
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

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* TOP */}
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">All Subjects</h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <div className="w-full md:w-auto flex items-center gap-2 text-xs rounded-full ring-[1.5px] ring-gray-300 px-2">
            <Image src="/search.png" alt="" width={14} height={14} />
            <input
              type="text"
              placeholder="Search subjects..."
              className="w-[200px] p-2 bg-transparent outline-none"
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-4 self-end">
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/filter.png" alt="" width={14} height={14} />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/sort.png" alt="" width={14} height={14} />
            </button>
            {user?.role === "admin" && (
              <button
                className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow"
                onClick={handleCreateSubject}
              >
                <Image src="/plus.png" alt="" width={14} height={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* LIST */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          <Table columns={columns} renderRow={renderRow} data={paginatedSubjects} />

          {/* PAGINATION */}
          <div className="flex items-center justify-between text-gray-500 mt-4">
            <button
              className="py-2 px-4 rounded-md bg-slate-200 text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={currentPage === 1}
              onClick={() => handlePageChange(currentPage - 1)}
            >
              Prev
            </button>
            <div className="flex items-center gap-2 text-sm">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  className={`px-2 ${
                    currentPage === page ? "bg-lamaSky rounded-sm" : ""
                  }`}
                  onClick={() => handlePageChange(page)}
                >
                  {page}
                </button>
              ))}
            </div>
            <button
              className="py-2 px-4 rounded-md bg-slate-200 text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={currentPage === totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
            >
              Next
            </button>
          </div>
        </>
      )}

      {/* Subject Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
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
