"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Table from "@/components/Table";
import ClassForm from "@/components/forms/ClassForm";
import ConfirmationModal from "@/components/ConfirmationModal";
import toast from "react-hot-toast";

type ClassData = {
  id: number;
  name: string;
  capacity: number;
  grade: {
    id: number;
    level: number;
  };
  supervisor: {
    id: string;
    name: string;
    surname: string;
  } | null;
  _count: {
    students: number;
  };
};

type ClassFormData = {
  id: number;
  name: string;
  capacity: number;
  gradeId: number;
  supervisorId: string;
};

type User = {
  id: string;
  role: string;
};

const ClassListPage = () => {
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassFormData | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [classToDelete, setClassToDelete] = useState<ClassData | null>(null);
  const [relatedData, setRelatedData] = useState<any>(null);

  const fetchData = async (page = 1, search = "") => {
    try {
      setLoading(true);

      // Fetch current user
      const userRes = await fetch("/api/auth/me", { credentials: "include" });
      if (userRes.ok) {
        const userData = await userRes.json();
        setUser(userData.user);
      }

      // Fetch classes
      const params = new URLSearchParams({
        page: page.toString(),
        ...(search && { search }),
      });

      const res = await fetch(`/api/classes?${params}`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setClasses(data.classes);
        setTotal(data.total);
        setTotalPages(data.totalPages);
        setCurrentPage(page);
      } else {
        console.error("Failed to fetch classes");
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedData = async () => {
    try {
      const [teachersRes, gradesRes] = await Promise.all([
        fetch("/api/teachers?getAll=true", { credentials: "include" }),
        fetch("/api/grades", { credentials: "include" }),
      ]);

      const teachersData = teachersRes.ok ? await teachersRes.json() : { teachers: [] };
      const gradesData = gradesRes.ok ? await gradesRes.json() : { grades: [] };

      setRelatedData({ 
        teachers: teachersData.teachers || [], 
        grades: gradesData.grades || gradesData || [] 
      });
    } catch (error) {
      console.error("Error fetching related data:", error);
      setRelatedData({ teachers: [], grades: [] });
    }
  };

  useEffect(() => {
    fetchData();
    fetchRelatedData();
  }, []);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    fetchData(1, term);
  };

  const handlePageChange = (page: number) => {
    fetchData(page, searchTerm);
  };

  const handleFormSuccess = async () => {
    // Refresh the classes data after successful form submission
    await fetchData(currentPage, searchTerm);
    // Also refresh related data to ensure dropdowns are up to date
    await fetchRelatedData();
  };

  const handleCreateClass = () => {
    setSelectedClass(null);
    setShowForm(true);
  };

  const handleEditClass = (classItem: ClassData) => {
    // Transform the nested data structure to flat structure for the form
    const transformedClass = {
      id: classItem.id,
      name: classItem.name,
      capacity: classItem.capacity,
      gradeId: classItem.grade.id,
      supervisorId: classItem.supervisor?.id || "",
    };
    console.log("Editing class:", classItem, "Transformed:", transformedClass);
    setSelectedClass(transformedClass);
    setShowForm(true);
  };

  const handleDeleteClick = (classItem: ClassData) => {
    setClassToDelete(classItem);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!classToDelete) return;

    try {
      setDeleting(classToDelete.id);
      const res = await fetch(`/api/classes?id=${classToDelete.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (res.ok) {
        toast.success("Class deleted successfully");
        fetchData(currentPage, searchTerm);
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to delete class");
      }
    } catch (error) {
      toast.error("Error deleting class");
      console.error("Error deleting class:", error);
    } finally {
      setDeleting(null);
      setShowDeleteModal(false);
      setClassToDelete(null);
    }
  };

  const columns = [
    {
      header: "Class Info",
      accessor: "info",
    },
    {
      header: "Grade",
      accessor: "grade",
      className: "hidden md:table-cell",
    },
    {
      header: "Capacity",
      accessor: "capacity",
      className: "hidden md:table-cell",
    },
    {
      header: "Students",
      accessor: "students",
      className: "hidden lg:table-cell",
    },
    {
      header: "Supervisor",
      accessor: "supervisor",
      className: "hidden lg:table-cell",
    },
    ...(user?.role === "admin"
      ? [
          {
            header: "Actions",
            accessor: "action",
          },
        ]
      : []),
  ];

  const renderRow = (item: ClassData) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
    >
      <td className="flex items-center gap-4 p-4">
        <div className="flex flex-col">
          <h3 className="font-semibold">{item.name}</h3>
          <p className="text-xs text-gray-500">ID: {item.id}</p>
        </div>
      </td>
      <td className="hidden md:table-cell">Grade {item.grade?.level}</td>
      <td className="hidden md:table-cell">{item.capacity}</td>
      <td className="hidden lg:table-cell">{item._count.students}</td>
      <td className="hidden lg:table-cell">
        {item.supervisor
          ? `${item.supervisor.name} ${item.supervisor.surname}`
          : "No supervisor"}
      </td>
      {user?.role === "admin" && (
        <td>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleEditClass(item)}
              className="w-7 h-7 flex items-center justify-center rounded-full bg-lamaSky"
              title="Edit Class"
            >
              <Image src="/update.png" alt="" width={16} height={16} />
            </button>
            <button
              onClick={() => handleDeleteClick(item)}
              disabled={deleting === item.id}
              className="w-7 h-7 flex items-center justify-center rounded-full bg-lamaPurple"
              title="Delete Class"
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
          <div className="text-lg">Loading classes...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* TOP */}
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">All Classes</h1>
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
              placeholder="Search classes..."
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
                onClick={handleCreateClass}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow hover:bg-yellow-500 transition-colors"
                title="Add New Class"
              >
                <Image
                  src="/create.png"
                  alt="Add Class"
                  width={16}
                  height={16}
                />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* LIST */}
      <Table columns={columns} renderRow={renderRow} data={classes} />

      {/* PAGINATION */}
      <div className="p-4 flex items-center justify-between text-gray-500">
        <button
          disabled={currentPage <= 1}
          className="py-2 px-4 rounded-md bg-slate-200 text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => handlePageChange(currentPage - 1)}
        >
          Prev
        </button>
        <div className="flex items-center gap-2 text-sm">
          {Array.from(
            { length: Math.min(totalPages, 3) },
            (_, i) => {
              const pageNumber = Math.max(
                1,
                Math.min(
                  currentPage - 1 + i,
                  totalPages - 2 + i
                )
              );
              return (
                <button
                  key={pageNumber}
                  className={`px-2 py-1 rounded-sm ${
                    currentPage === pageNumber ? "bg-lamaSky" : ""
                  }`}
                  onClick={() => handlePageChange(pageNumber)}
                >
                  {pageNumber}
                </button>
              );
            }
          )}
        </div>
        <button
          disabled={currentPage >= totalPages}
          className="py-2 px-4 rounded-md bg-slate-200 text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => handlePageChange(currentPage + 1)}
        >
          Next
        </button>
      </div>

      {/* FORMS */}
      {showForm && (
        <div className="w-screen h-screen absolute left-0 top-0 bg-black bg-opacity-60 z-50 flex items-center justify-center">
          <div className="bg-white p-4 rounded-md relative w-[90%] md:w-[70%] lg:w-[60%] xl:w-[50%] 2xl:w-[40%]">
            <ClassForm
              type={selectedClass ? "update" : "create"}
              data={selectedClass}
              setOpen={setShowForm}
              relatedData={relatedData}
              onSuccess={handleFormSuccess}
            />
            <div
              className="absolute top-4 right-4 cursor-pointer"
              onClick={() => setShowForm(false)}
            >
              <Image src="/close.png" alt="" width={14} height={14} />
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteModal && classToDelete && (
        <ConfirmationModal
          isOpen={showDeleteModal}
          title="Delete Class"
          message={`Are you sure you want to delete the class "${classToDelete.name}"? This action cannot be undone.`}
          onConfirm={handleDeleteConfirm}
          onClose={() => {
            setShowDeleteModal(false);
            setClassToDelete(null);
          }}
          confirmText="Delete"
          cancelText="Cancel"
          type="danger"
        />
      )}
    </div>
  );
};

export default ClassListPage;