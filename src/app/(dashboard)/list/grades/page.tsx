"use client";

import { useState, useEffect } from "react";
import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { Grade } from "@prisma/client";
import Image from "next/image";
import GradeViewModal from "@/components/GradeViewModal";
import ConfirmationModal from "@/components/ConfirmationModal";

type GradeList = Grade & { 
  _count?: { classess: number; students: number };
};

const GradeListPage = () => {
  const [grades, setGrades] = useState<GradeList[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>("");
  const [deleting, setDeleting] = useState<number | null>(null);
  const [userLoading, setUserLoading] = useState(true);

  // Modal states
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedGradeId, setSelectedGradeId] = useState<number | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [gradeToDelete, setGradeToDelete] = useState<{id: number, level: number} | null>(null);

  useEffect(() => {
    fetchUser();
    fetchData();
  }, []);

  const fetchUser = async () => {
    try {
      setUserLoading(true);
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (res.ok) {
        const userData = await res.json();
        console.log("User fetched:", userData);
        setUserRole(userData.user?.role || "");
      } else {
        console.log("Failed to fetch user, status:", res.status);
        setUserRole("");
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      setUserRole("");
    } finally {
      setUserLoading(false);
    }
  };

  const handleViewGrade = (gradeId: number) => {
    setSelectedGradeId(gradeId);
    setViewModalOpen(true);
  };

  const handleDeleteClick = (gradeId: number, gradeLevel: number) => {
    setGradeToDelete({ id: gradeId, level: gradeLevel });
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!gradeToDelete) return;

    setDeleting(gradeToDelete.id);
    try {
      const response = await fetch(`/api/grades/${gradeToDelete.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (response.ok) {
        // Refresh the data instead of reloading the page
        await fetchData();
        setDeleteModalOpen(false);
        setGradeToDelete(null);
      } else {
        const errorData = await response.json();
        alert(`Failed to delete grade: ${errorData.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error deleting grade:", error);
      alert("Error deleting grade");
    } finally {
      setDeleting(null);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/grades", { credentials: "include" });
      if (res.ok) {
        const result = await res.json();
        setGrades(result.grades);
        setTotalCount(result.total || result.grades.length);
      }
    } catch (error) {
      console.error("Error fetching grades:", error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      header: "Grade Level",
      accessor: "level",
    },
    {
      header: "Number of Classes",
      accessor: "classes",
      className: "hidden md:table-cell",
    },
    {
      header: "Number of Students",
      accessor: "students",
      className: "hidden md:table-cell",
    },
    ...(userRole === "admin"
      ? [
          {
            header: "Actions",
            accessor: "action",
          },
        ]
      : []),
  ];

  const renderRow = (item: GradeList) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
    >
      <td className="flex items-center gap-4 p-4">Grade {item.level}</td>
      <td className="hidden md:table-cell">
        {item._count?.classess ?? 0}
      </td>
      <td className="hidden md:table-cell">
        {item._count?.students ?? 0}
      </td>
      <td>
        <div className="flex items-center gap-2">
          {userLoading ? (
            <span className="text-sm text-gray-500">Loading...</span>
          ) : userRole === "admin" ? (
            <>
              <button
                onClick={() => handleViewGrade(item.id)}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-lamaSky"
                title="View Grade Details"
              >
                <Image src="/view.png" alt="view" width={16} height={16} />
              </button>
              <FormContainer table="grade" type="update" data={item} />
              <button
                onClick={() => handleDeleteClick(item.id, item.level)}
                disabled={deleting === item.id}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-lamaPurple"
                title="Delete Grade"
              >
                {deleting === item.id ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Image src="/delete.png" alt="delete" width={16} height={16} />
                )}
              </button>
            </>
          ) : (
            <span className="text-sm text-gray-500">
              {userRole ? `Role: ${userRole}` : "No access"}
            </span>
          )}
        </div>
      </td>
    </tr>
  );

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* TOP */}
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">
          All Grades {!userLoading && userRole && `(Role: ${userRole})`}
        </h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-4 self-end">
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/filter.png" alt="" width={14} height={14} />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/sort.png" alt="" width={14} height={14} />
            </button>
            {userRole === "admin" && <FormContainer table="grade" type="create" />}
          </div>
        </div>
      </div>
      {/* LIST */}
      {loading ? (
        <div className="flex justify-center items-center h-32">
          <div>Loading...</div>
        </div>
      ) : (
        <Table columns={columns} renderRow={renderRow} data={grades} />
      )}
      {/* PAGINATION */}
      <Pagination page={1} count={totalCount} />

      {/* Modals */}
      <GradeViewModal
        isOpen={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        gradeId={selectedGradeId || undefined}
      />

      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setGradeToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Grade"
        message={
          gradeToDelete
            ? `Are you sure you want to delete Grade ${gradeToDelete.level}? This action cannot be undone and will remove all associated classes and student enrollments.`
            : "Are you sure you want to delete this grade?"
        }
        confirmText="Delete Grade"
        cancelText="Cancel"
        type="danger"
        loading={deleting === gradeToDelete?.id}
      />
    </div>
  );
};

export default GradeListPage;
