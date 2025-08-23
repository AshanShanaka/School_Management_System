"use client";

import { useState, useEffect } from "react";
import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import ClassViewModal from "@/components/ClassViewModal";
import { formatClassDisplay } from "@/lib/formatters";
import Image from "next/image";
import { Eye } from "lucide-react";
import toast from "react-hot-toast";

type ClassList = {
  id: number;
  name: string;
  capacity: number;
  grade: {
    level: number;
  };
  supervisor: {
    name: string;
    surname: string;
  } | null;
  _count: {
    students: number;
  };
};

const ClassListPage = () => {
  const [classes, setClasses] = useState<ClassList[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClassId, setSelectedClassId] = useState<number | undefined>();
  const [showClassModal, setShowClassModal] = useState(false);

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

  const handleViewStudents = (classId: number) => {
    setSelectedClassId(classId);
    setShowClassModal(true);
  };

  const handleCloseModal = () => {
    setShowClassModal(false);
    setSelectedClassId(undefined);
  };

  const columns = [
    {
      header: "Class Name",
      accessor: "name",
    },
    {
      header: "Capacity",
      accessor: "capacity",
      className: "hidden md:table-cell",
    },
    {
      header: "Students",
      accessor: "students",
      className: "hidden md:table-cell",
    },
    {
      header: "Class Teacher",
      accessor: "supervisor",
      className: "hidden md:table-cell",
    },
    {
      header: "Actions",
      accessor: "action",
    },
  ];

  const renderRow = (item: ClassList) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
    >
      <td className="flex items-center gap-4 p-4">
        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
          <Image src="/class.png" alt="" width={20} height={20} />
        </div>
        <div className="flex flex-col">
          <h3 className="font-semibold">
            {formatClassDisplay(item.name, item.grade?.level)}
          </h3>
          <p className="text-xs text-gray-500">
            Capacity: {item.capacity} students
          </p>
        </div>
      </td>
      <td className="hidden md:table-cell">
        <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">
          {item.capacity} students
        </span>
      </td>
      <td className="hidden md:table-cell">
        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
          {item._count.students} enrolled
        </span>
      </td>
      <td className="hidden md:table-cell">
        {item.supervisor ? (
          <div className="flex items-center gap-2">
            <Image
              src="/noAvatar.png"
              alt=""
              width={24}
              height={24}
              className="rounded-full"
            />
            <span className="text-sm">
              {item.supervisor.name} {item.supervisor.surname}
            </span>
          </div>
        ) : (
          <span className="text-gray-400 italic">No supervisor assigned</span>
        )}
      </td>
      <td>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleViewStudents(item.id)}
            className="w-7 h-7 flex items-center justify-center rounded-full bg-green-100 hover:bg-green-200 transition-colors"
            title="View Students"
          >
            <Eye className="w-4 h-4 text-green-600" />
          </button>
          {user?.role === "admin" && (
            <>
              <button className="w-7 h-7 flex items-center justify-center rounded-full bg-lamaSky">
                <Image src="/update.png" alt="" width={16} height={16} />
              </button>
              <button className="w-7 h-7 flex items-center justify-center rounded-full bg-lamaPurple">
                <Image src="/delete.png" alt="" width={16} height={16} />
              </button>
            </>
          )}
        </div>
      </td>
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
              <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
                <Image src="/create.png" alt="" width={16} height={16} />
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

      {/* Class View Modal */}
      <ClassViewModal
        isOpen={showClassModal}
        onClose={handleCloseModal}
        classId={selectedClassId}
      />
    </div>
  );
};

export default ClassListPage;
