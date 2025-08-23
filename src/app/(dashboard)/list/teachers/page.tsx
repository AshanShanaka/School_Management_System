"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Table from "@/components/Table";
import TeacherForm from "@/components/TeacherForm";
import ConfirmationModal from "@/components/ConfirmationModal";
import toast from "react-hot-toast";

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
      header: "Teacher ID",
      accessor: "teacherId",
      className: "hidden md:table-cell",
    },
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
        {item.subjects?.map((s) => s.name).join(", ") || "No subjects"}
      </td>
      <td className="hidden md:table-cell">
        {item.classes?.map((c) => c.name).join(", ") || "No classes"}
      </td>
      <td className="hidden lg:table-cell">{item.phone || "N/A"}</td>
      <td className="hidden lg:table-cell">{item.address || "N/A"}</td>
      {user?.role === "admin" && (
        <td>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleEditTeacher(item)}
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
          <div className="text-lg">Loading teachers...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">
          {user?.role === "student"
            ? "My Teachers"
            : user?.role === "parent"
            ? "Children's Teachers"
            : "All Teachers"}
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
                onClick={handleCreateTeacher}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow hover:bg-yellow-500 transition-colors"
                title="Add New Teacher"
              >
                <Image
                  src="/create.png"
                  alt="Add Teacher"
                  width={16}
                  height={16}
                />
              </button>
            )}
          </div>
        </div>
      </div>

      <Table columns={columns} renderRow={renderRow} data={teachers} />

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
