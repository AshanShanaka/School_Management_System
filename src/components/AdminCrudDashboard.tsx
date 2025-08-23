"use client";

import React, { useState, useEffect } from "react";
import {
  User,
  GraduationCap,
  Users,
  School,
  Trophy,
  BookOpen,
  BarChart3,
  Settings,
} from "lucide-react";
import CrudTable from "@/components/CrudTable";

interface AdminData {
  teachers: any[];
  students: any[];
  parents: any[];
  classes: any[];
  grades: any[];
}

const AdminCrudDashboard = () => {
  const [data, setData] = useState<AdminData>({
    teachers: [],
    students: [],
    parents: [],
    classes: [],
    grades: [],
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<keyof AdminData>("students");
  const [editItem, setEditItem] = useState<any>(null);
  const [createMode, setCreateMode] = useState<string | null>(null);

  const tabs = [
    {
      key: "students" as keyof AdminData,
      label: "Students",
      icon: <GraduationCap className="w-5 h-5" />,
      color: "blue",
    },
    {
      key: "teachers" as keyof AdminData,
      label: "Teachers",
      icon: <User className="w-5 h-5" />,
      color: "green",
    },
    {
      key: "parents" as keyof AdminData,
      label: "Parents",
      icon: <Users className="w-5 h-5" />,
      color: "purple",
    },
    {
      key: "classes" as keyof AdminData,
      label: "Classes",
      icon: <School className="w-5 h-5" />,
      color: "orange",
    },
    {
      key: "grades" as keyof AdminData,
      label: "Grades",
      icon: <Trophy className="w-5 h-5" />,
      color: "red",
    },
  ];

  const fetchData = async () => {
    try {
      setLoading(true);
      const [teachersRes, studentsRes, parentsRes, classesRes, gradesRes] =
        await Promise.all([
          fetch("/api/teachers"),
          fetch("/api/students"),
          fetch("/api/parents"),
          fetch("/api/classes"),
          fetch("/api/grades"),
        ]);

      const [teachers, students, parents, classes, grades] = await Promise.all([
        teachersRes.json(),
        studentsRes.json(),
        parentsRes.json(),
        classesRes.json(),
        gradesRes.json(),
      ]);

      setData({
        teachers: teachers.teachers || [],
        students: students.students || [],
        parents: parents.parents || [],
        classes: classes.classes || [],
        grades: grades.grades || [],
      });
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEdit = (item: any) => {
    setEditItem(item);
    setCreateMode(null);
  };

  const handleCreate = () => {
    setCreateMode(activeTab);
    setEditItem(null);
  };

  const handleDelete = (item: any) => {
    // Delete handled in CrudTable component
    console.log("Delete:", item);
  };

  const getColumns = (type: keyof AdminData): string[] => {
    switch (type) {
      case "students":
        return ["name", "email", "class", "parent"];
      case "teachers":
        return ["name", "email", "subjects", "classes"];
      case "parents":
        return ["name", "email", "phone", "students"];
      case "classes":
        return ["name", "capacity", "supervisor", "students"];
      case "grades":
        return ["level", "classes", "students"];
      default:
        return [];
    }
  };

  const getIcon = (type: keyof AdminData) => {
    const iconMap = {
      students: <GraduationCap className="w-6 h-6" />,
      teachers: <User className="w-6 h-6" />,
      parents: <Users className="w-6 h-6" />,
      classes: <School className="w-6 h-6" />,
      grades: <Trophy className="w-6 h-6" />,
    };
    return iconMap[type];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading admin dashboard...</p>
          </div>
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
                <Settings className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Admin Dashboard
                </h1>
                <p className="text-gray-600">
                  Manage all school data and users
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">
                  {data.students.length +
                    data.teachers.length +
                    data.parents.length}
                </div>
                <div className="text-sm text-gray-500">Total Users</div>
              </div>
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
                  {data[tab.key].length}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-6">
        <CrudTable
          type={activeTab}
          title={tabs.find((t) => t.key === activeTab)?.label || ""}
          icon={getIcon(activeTab)}
          columns={getColumns(activeTab)}
          data={data[activeTab]}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onCreate={handleCreate}
          onRefresh={fetchData}
        />
      </div>

      {/* Quick Stats */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {tabs.map((tab) => (
          <div
            key={tab.key}
            className="bg-white rounded-xl shadow-lg border border-gray-100 p-4 hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {data[tab.key].length}
                </div>
                <div className="text-sm text-gray-500">{tab.label}</div>
              </div>
              <div className={`p-2 rounded-lg bg-${tab.color}-100`}>
                {tab.icon}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminCrudDashboard;
