"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import ClassViewModal from "@/components/ClassViewModal";
import { Users, GraduationCap, Eye } from "lucide-react";
import toast from "react-hot-toast";

interface ClassInfo {
  id: number;
  name: string;
  capacity: number;
  grade: {
    level: number;
  };
  supervisor?: {
    name: string;
    surname: string;
  };
  _count: {
    students: number;
  };
}

interface User {
  id: string;
  role: string;
}

const ClassManagement = () => {
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedClassId, setSelectedClassId] = useState<number | undefined>();
  const [showClassModal, setShowClassModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch current user
      const userRes = await fetch("/api/auth/me", { credentials: "include" });
      if (userRes.ok) {
        const userData = await userRes.json();
        setUser(userData.user);
      }

      // Fetch classes
      const classRes = await fetch("/api/classes", {
        credentials: "include",
      });
      if (classRes.ok) {
        const classData = await classRes.json();
        setClasses(classData.classes || []);
      } else {
        toast.error("Failed to fetch classes");
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("An error occurred while loading data");
    } finally {
      setLoading(false);
    }
  };

  const handleViewClass = (classId: number) => {
    setSelectedClassId(classId);
    setShowClassModal(true);
  };

  const handleCloseModal = () => {
    setShowClassModal(false);
    setSelectedClassId(undefined);
  };

  const filteredClasses = classes.filter(
    (cls) =>
      cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cls.grade.level.toString().includes(searchTerm)
  );

  if (loading) {
    return (
      <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-500 ml-4">Loading classes...</p>
        </div>
      </div>
    );
  }

  if (user?.role !== "admin" && user?.role !== "teacher") {
    return (
      <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
        <div className="text-center py-12">
          <p className="text-gray-500">
            You don't have permission to view this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Class Management</h1>
          <p className="text-gray-600">View students organized by class</p>
        </div>
        <div className="flex items-center space-x-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const value = (e.currentTarget[0] as HTMLInputElement).value;
              setSearchTerm(value);
            }}
            className="flex items-center gap-2 text-xs rounded-full ring-[1.5px] ring-gray-300 px-2"
          >
            <Image src="/search.png" alt="" width={14} height={14} />
            <input
              type="text"
              placeholder="Search classes..."
              className="w-[200px] p-2 bg-transparent outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </form>
        </div>
      </div>

      {/* Classes Grid */}
      {filteredClasses.length === 0 ? (
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Classes Found
          </h3>
          <p className="text-gray-500">
            {searchTerm
              ? "No classes match your search criteria."
              : "No classes have been created yet."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredClasses.map((classInfo) => (
            <div
              key={classInfo.id}
              className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100 hover:shadow-lg transition-all duration-200 hover:scale-105"
            >
              {/* Class Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <GraduationCap className="w-6 h-6 text-blue-600" />
                </div>
                <button
                  onClick={() => handleViewClass(classInfo.id)}
                  className="p-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200"
                  title="View Students"
                >
                  <Eye className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              {/* Class Info */}
              <div className="mb-4">
                <h3 className="text-lg font-bold text-gray-900 mb-1">
                  {classInfo.name}
                </h3>
                <p className="text-sm text-gray-600">
                  Grade {classInfo.grade.level}
                </p>
                {classInfo.supervisor && (
                  <p className="text-xs text-gray-500 mt-1">
                    Supervisor: {classInfo.supervisor.name}{" "}
                    {classInfo.supervisor.surname}
                  </p>
                )}
              </div>

              {/* Student Count */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-gray-700">
                    {classInfo._count.students} / {classInfo.capacity}
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  {classInfo.capacity - classInfo._count.students} available
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-3">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(
                        (classInfo._count.students / classInfo.capacity) * 100,
                        100
                      )}%`,
                    }}
                  ></div>
                </div>
              </div>

              {/* View Button */}
              <button
                onClick={() => handleViewClass(classInfo.id)}
                className="w-full mt-4 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center justify-center space-x-2"
              >
                <Eye className="w-4 h-4" />
                <span>View Students</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Class View Modal */}
      <ClassViewModal
        isOpen={showClassModal}
        onClose={handleCloseModal}
        classId={selectedClassId}
      />
    </div>
  );
};

export default ClassManagement;
