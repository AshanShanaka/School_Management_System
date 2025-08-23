"use client";

import React, { useState, useEffect } from "react";
import {
  User,
  GraduationCap,
  Users,
  School,
  Trophy,
  Edit,
  Trash2,
  Plus,
  Search,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
} from "lucide-react";
import { toast } from "react-hot-toast";

interface DeleteConfirmation {
  isOpen: boolean;
  item: any;
  type: string;
  onConfirm: () => void;
  onCancel: () => void;
}

interface SuccessModal {
  isOpen: boolean;
  type: "create" | "update" | "delete";
  itemName: string;
  onClose: () => void;
}

const AdminCrudInterface = () => {
  const [activeTab, setActiveTab] = useState("students");
  const [data, setData] = useState<any>({
    students: [],
    teachers: [],
    parents: [],
    classes: [],
    grades: [],
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirmation | null>(
    null
  );
  const [successModal, setSuccessModal] = useState<SuccessModal | null>(null);

  const tabs = [
    {
      key: "students",
      label: "Students",
      icon: <GraduationCap className="w-5 h-5" />,
      color: "blue",
    },
    {
      key: "teachers",
      label: "Teachers",
      icon: <User className="w-5 h-5" />,
      color: "green",
    },
    {
      key: "parents",
      label: "Parents",
      icon: <Users className="w-5 h-5" />,
      color: "purple",
    },
    {
      key: "classes",
      label: "Classes",
      icon: <School className="w-5 h-5" />,
      color: "orange",
    },
    {
      key: "grades",
      label: "Grades",
      icon: <Trophy className="w-5 h-5" />,
      color: "red",
    },
  ];

  const fetchData = async () => {
    try {
      setLoading(true);
      const endpoints = {
        students: "/api/students",
        teachers: "/api/teachers",
        parents: "/api/parents",
        classes: "/api/classes",
        grades: "/api/grades",
      };

      const responses = await Promise.all(
        Object.values(endpoints).map((url) => fetch(url))
      );

      const results = await Promise.all(responses.map((res) => res.json()));

      setData({
        students: results[0].students || [],
        teachers: results[1].teachers || [],
        parents: results[2].parents || [],
        classes: results[3].classes || [],
        grades: results[4].grades || [],
      });
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (item: any, type: string) => {
    try {
      const response = await fetch(`/api/${type}?id=${item.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setSuccessModal({
          isOpen: true,
          type: "delete",
          itemName: getItemName(item, type),
          onClose: () => setSuccessModal(null),
        });
        fetchData(); // Refresh data
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to delete item");
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete item");
    }
  };

  const getItemName = (item: any, type: string): string => {
    switch (type) {
      case "students":
      case "teachers":
      case "parents":
        return `${item.name} ${item.surname}`;
      case "classes":
        return item.name;
      case "grades":
        return `Grade ${item.level}`;
      default:
        return "Item";
    }
  };

  const filteredData =
    data[activeTab]?.filter((item: any) =>
      Object.values(item).some((value: any) =>
        value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
      )
    ) || [];

  const getColumns = (type: string) => {
    switch (type) {
      case "students":
        return [
          { key: "name", label: "Name" },
          { key: "email", label: "Email" },
          { key: "class", label: "Class" },
          { key: "parent", label: "Parent" },
        ];
      case "teachers":
        return [
          { key: "name", label: "Name" },
          { key: "email", label: "Email" },
          { key: "subjects", label: "Subjects" },
          { key: "phone", label: "Phone" },
        ];
      case "parents":
        return [
          { key: "name", label: "Name" },
          { key: "email", label: "Email" },
          { key: "phone", label: "Phone" },
          { key: "students", label: "Children" },
        ];
      case "classes":
        return [
          { key: "name", label: "Class Name" },
          { key: "capacity", label: "Capacity" },
          { key: "supervisor", label: "Supervisor" },
          { key: "studentCount", label: "Students" },
        ];
      case "grades":
        return [
          { key: "level", label: "Grade Level" },
          { key: "classes", label: "Classes" },
          { key: "students", label: "Students" },
        ];
      default:
        return [];
    }
  };

  const renderCellValue = (item: any, column: any, type: string) => {
    const value = item[column.key];

    switch (column.key) {
      case "name":
        return `${item.name} ${item.surname || ""}`.trim();
      case "class":
        return item.class ? item.class.name : "No class";
      case "parent":
        return item.parent
          ? `${item.parent.name} ${item.parent.surname}`
          : "No parent";
      case "supervisor":
        return item.supervisor
          ? `${item.supervisor.name} ${item.supervisor.surname}`
          : "No supervisor";
      case "subjects":
        return (
          item.subjects?.map((s: any) => s.name).join(", ") || "No subjects"
        );
      case "students":
        if (type === "parents") {
          return item.students?.length || 0;
        }
        return item._count?.students || 0;
      case "classes":
        return item._count?.classess || 0;
      case "studentCount":
        return item._count?.students || 0;
      case "level":
        return `Grade ${item.level}`;
      default:
        return value?.toString() || "N/A";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin interface...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-full p-3">
                <User className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Admin CRUD Management
                </h1>
                <p className="text-gray-600">
                  Create, Read, Update, and Delete school data
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">
                {Object.values(data).flat().length}
              </div>
              <div className="text-sm text-gray-500">Total Records</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-2">
          <div className="flex space-x-1 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 whitespace-nowrap ${
                  activeTab === tab.key
                    ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                <span className="bg-white bg-opacity-20 px-2 py-1 rounded-full text-xs">
                  {data[tab.key]?.length || 0}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        {/* Search Bar */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder={`Search ${activeTab}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-xl flex items-center space-x-2 hover:shadow-lg transition-all">
              <Plus className="w-5 h-5" />
              <span>Add New</span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                {getColumns(activeTab).map((column) => (
                  <th
                    key={column.key}
                    className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider"
                  >
                    {column.label}
                  </th>
                ))}
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredData.map((item: any, index: number) => (
                <tr
                  key={item.id}
                  className={`hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-200 ${
                    index % 2 === 0 ? "bg-white" : "bg-gray-25"
                  }`}
                >
                  {getColumns(activeTab).map((column) => (
                    <td
                      key={column.key}
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                    >
                      {renderCellValue(item, column, activeTab)}
                    </td>
                  ))}
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg transition-colors"
                        title="View"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() =>
                          setDeleteConfirm({
                            isOpen: true,
                            item,
                            type: activeTab,
                            onConfirm: () => {
                              handleDelete(item, activeTab);
                              setDeleteConfirm(null);
                            },
                            onCancel: () => setDeleteConfirm(null),
                          })
                        }
                        className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {filteredData.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              {tabs.find((t) => t.key === activeTab)?.icon}
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No {activeTab} found
            </h3>
            <p className="text-gray-500">
              {searchTerm
                ? "No items match your search."
                : `No ${activeTab} have been added yet.`}
            </p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-red-100 rounded-full p-3">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Confirm Deletion
                </h3>
                <p className="text-sm text-gray-600">
                  This action cannot be undone
                </p>
              </div>
            </div>
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete{" "}
              <strong>
                {getItemName(deleteConfirm.item, deleteConfirm.type)}
              </strong>
              ?
            </p>
            <div className="flex space-x-3">
              <button
                onClick={deleteConfirm.onCancel}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-medium py-3 px-4 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={deleteConfirm.onConfirm}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-medium py-3 px-4 rounded-xl transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {successModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="text-center">
              <div className="bg-green-100 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Success!</h3>
              <p className="text-gray-600 mb-6">
                {successModal.itemName} has been {successModal.type}d
                successfully.
              </p>
              <button
                onClick={successModal.onClose}
                className="bg-green-500 hover:bg-green-600 text-white font-medium py-3 px-6 rounded-xl transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCrudInterface;
