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
  Filter,
  AlertTriangle,
} from "lucide-react";
import Image from "next/image";
import { formatClassDisplay } from "@/lib/formatters";

interface CrudItem {
  id: string | number;
  [key: string]: any;
}

interface CrudTableProps {
  type: "teachers" | "students" | "parents" | "classes" | "grades";
  title: string;
  icon: React.ReactNode;
  columns: string[];
  data: CrudItem[];
  onEdit: (item: CrudItem) => void;
  onDelete: (item: CrudItem) => void;
  onCreate: () => void;
  onRefresh: () => void;
}

const CrudTable: React.FC<CrudTableProps> = ({
  type,
  title,
  icon,
  columns,
  data,
  onEdit,
  onDelete,
  onCreate,
  onRefresh,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredData, setFilteredData] = useState(data);
  const [deleteConfirm, setDeleteConfirm] = useState<CrudItem | null>(null);

  useEffect(() => {
    if (searchTerm) {
      const filtered = data.filter((item) =>
        Object.values(item).some((value) =>
          value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
      setFilteredData(filtered);
    } else {
      setFilteredData(data);
    }
  }, [searchTerm, data]);

  const handleDelete = async (item: CrudItem) => {
    try {
      const response = await fetch(`/api/${type}?id=${item.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        onRefresh();
        setDeleteConfirm(null);
      } else {
        const error = await response.json();
        alert(error.error || "Failed to delete item");
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete item");
    }
  };

  const renderCellValue = (item: CrudItem, column: string): React.ReactNode => {
    const value = item[column];

    switch (column) {
      case "name":
        if (type === "classes") {
          return formatClassDisplay(item.name, item.grade?.level);
        }
        return `${item.name} ${item.surname || ""}`.trim();
      case "class":
        return item.class
          ? formatClassDisplay(item.class.name, item.class.grade?.level)
          : "N/A";
      case "grade":
        return item.grade ? `Grade ${item.grade.level}` : "N/A";
      case "supervisor":
        return item.supervisor
          ? `${item.supervisor.name} ${item.supervisor.surname}`
          : "No supervisor";
      case "subjects":
        return (
          item.subjects?.map((s: any) => s.name).join(", ") || "No subjects"
        );
      case "students":
        return item._count?.students || item.students?.length || 0;
      case "classes":
        return item._count?.classess || item.classes?.length || 0;
      case "parent":
        return item.parent
          ? `${item.parent.name} ${item.parent.surname}`
          : "N/A";
      default:
        return value?.toString() || "N/A";
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-white bg-opacity-20 rounded-full p-2">
              {icon}
            </div>
            <div>
              <h2 className="text-2xl font-bold">{title}</h2>
              <p className="text-blue-100">Manage {title.toLowerCase()}</p>
            </div>
          </div>
          <button
            onClick={onCreate}
            className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Add New</span>
          </button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder={`Search ${title.toLowerCase()}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={onRefresh}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Filter className="w-5 h-5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {column.replace(/([A-Z])/g, " $1").trim()}
                </th>
              ))}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredData.map((item, index) => (
              <tr
                key={item.id}
                className={`hover:bg-gray-50 transition-colors ${
                  index % 2 === 0 ? "bg-white" : "bg-gray-25"
                }`}
              >
                {columns.map((column) => (
                  <td
                    key={column}
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                  >
                    {renderCellValue(item, column)}
                  </td>
                ))}
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => onEdit(item)}
                      className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(item)}
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

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-red-100 rounded-full p-2">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Confirm Deletion
                </h3>
                <p className="text-sm text-gray-600">
                  This action cannot be undone
                </p>
              </div>
            </div>
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete{" "}
              {renderCellValue(deleteConfirm, "name")}?
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredData.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">{icon}</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No {title} Found
          </h3>
          <p className="text-gray-500">
            {searchTerm
              ? "No items match your search criteria."
              : `No ${title.toLowerCase()} have been added yet.`}
          </p>
        </div>
      )}
    </div>
  );
};

export default CrudTable;
