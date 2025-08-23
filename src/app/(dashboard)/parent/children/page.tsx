"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatClassDisplay } from "@/lib/formatters";
import {
  Search,
  User,
  GraduationCap,
  Phone,
  MapPin,
  Calendar,
  ArrowLeft,
} from "lucide-react";

interface Student {
  id: string;
  name: string;
  surname: string;
  email: string;
  phone: string;
  address: string;
  img?: string;
  bloodType: string;
  sex: "MALE" | "FEMALE";
  createdAt: string;
  class: {
    id: string;
    name: string;
    capacity: number;
    grade: {
      id: string;
      level: number;
    };
  };
  parent: {
    id: string;
    name: string;
    surname: string;
  };
}

interface ApiResponse {
  students: Student[];
  total: number;
  page: number;
  totalPages: number;
}

const ParentChildrenPage = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchStudents = async (page: number = 1, search: string = "") => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        ...(search && { search }),
      });

      const response = await fetch(`/api/students?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch students");
      }

      const data: ApiResponse = await response.json();
      setStudents(data.students);
      setTotalPages(data.totalPages);
      setCurrentPage(data.page);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents(currentPage, searchTerm);
  }, [currentPage]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchStudents(1, searchTerm);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your children...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            Error: {error}
          </div>
          <button
            onClick={() => fetchStudents(currentPage, searchTerm)}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-6 space-y-6">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-2xl p-6 md:p-8 text-white shadow-xl">
        <div className="flex items-center space-x-4">
          <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-full p-3">
            <GraduationCap className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">My Children</h1>
            <p className="text-blue-100 text-lg">
              View and manage your children's information
            </p>
          </div>
        </div>
      </div>

      {/* Search and Actions */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex items-center space-x-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
              />
            </div>
            <button
              onClick={handleSearch}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Search
            </button>
          </div>
        </div>
      </div>

      {/* Students Grid/List */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        {students.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-gray-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
              <GraduationCap className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-3">
              No Children Found
            </h3>
            <p className="text-gray-500 text-lg max-w-md mx-auto">
              {searchTerm
                ? "No children match your search criteria. Try adjusting your search terms."
                : "No children are registered under your account."}
            </p>
          </div>
        ) : (
          <>
            {/* Mobile Cards View */}
            <div className="block md:hidden space-y-4 p-6">
              {students.map((student) => (
                <div
                  key={student.id}
                  className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl p-6 border border-gray-200 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-start space-x-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {student.name.charAt(0)}
                      {student.surname.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-1">
                        {student.name} {student.surname}
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center text-gray-600">
                          <GraduationCap className="w-4 h-4 mr-2 text-blue-500" />
                          <span className="font-medium">
                            {formatClassDisplay(
                              student.class.name,
                              student.class.grade.level
                            )}
                          </span>
                          <span className="ml-2 text-gray-500">
                            Grade {student.class.grade.level}
                          </span>
                        </div>
                        <div className="flex items-center text-gray-600">
                          <User className="w-4 h-4 mr-2 text-green-500" />
                          <span>
                            {student.sex} • {student.bloodType}
                          </span>
                        </div>
                        <div className="flex items-center text-gray-600">
                          <Phone className="w-4 h-4 mr-2 text-purple-500" />
                          <span>{student.email}</span>
                        </div>
                        <div className="flex items-center text-gray-600">
                          <Calendar className="w-4 h-4 mr-2 text-orange-500" />
                          <span>
                            Joined:{" "}
                            {new Date(student.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="mt-4">
                        <Link
                          href={`/list/students/${student.id}`}
                          className="inline-flex items-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Student Info
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Class & Grade
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Details
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {students.map((student, index) => (
                    <tr
                      key={student.id}
                      className={`hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-200 ${
                        index % 2 === 0 ? "bg-white" : "bg-gray-50"
                      }`}
                    >
                      <td className="px-6 py-6 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-14 w-14">
                            <div className="h-14 w-14 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                              {student.name.charAt(0)}
                              {student.surname.charAt(0)}
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-lg font-semibold text-gray-900">
                              {student.name} {student.surname}
                            </div>
                            <div className="text-sm text-gray-500 flex items-center">
                              <User className="w-4 h-4 mr-1" />
                              {student.sex} • {student.bloodType}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-6 whitespace-nowrap">
                        <div className="flex items-center">
                          <GraduationCap className="w-5 h-5 text-blue-500 mr-2" />
                          <div>
                            <div className="text-lg font-semibold text-gray-900">
                              {formatClassDisplay(
                                student.class.name,
                                student.class.grade.level
                              )}
                            </div>
                            <div className="text-sm text-gray-500">
                              Grade {student.class.grade.level}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <div className="space-y-1">
                          <div className="text-sm font-medium text-gray-900 flex items-center">
                            <Phone className="w-4 h-4 mr-2 text-green-500" />
                            {student.email}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center">
                            <Phone className="w-4 h-4 mr-2 text-purple-500" />
                            {student.phone}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <div className="space-y-1">
                          <div className="text-sm text-gray-700 max-w-xs truncate flex items-center">
                            <MapPin className="w-4 h-4 mr-2 text-red-500" />
                            {student.address}
                          </div>
                          <div className="text-xs text-gray-500 flex items-center">
                            <Calendar className="w-4 h-4 mr-2 text-orange-500" />
                            Joined:{" "}
                            {new Date(student.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-6 whitespace-nowrap text-sm font-medium">
                        <Link
                          href={`/list/students/${student.id}`}
                          className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                        >
                          View Details
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() =>
                      setCurrentPage(Math.min(totalPages, currentPage + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Page <span className="font-medium">{currentPage}</span> of{" "}
                      <span className="font-medium">{totalPages}</span>
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={() =>
                          setCurrentPage(Math.max(1, currentPage - 1))
                        }
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-4 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() =>
                          setCurrentPage(Math.min(totalPages, currentPage + 1))
                        }
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center px-4 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Next
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Back to Dashboard */}
      <div className="text-center">
        <Link
          href="/parent"
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-blue-700 bg-blue-100 hover:bg-blue-200 transition-all duration-200 shadow-md hover:shadow-lg"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Parent Dashboard
        </Link>
      </div>
    </div>
  );
};

export default ParentChildrenPage;
