// Admin Timetable Management Page - View and manage all timetables
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getTimeDisplay, getSubjectColor, SCHOOL_DAYS } from "@/lib/schoolTimetableConfig";

interface Timetable {
  id: string;
  classId: number;
  academicYear: string;
  term: string | null;
  isActive: boolean;
  createdAt: string;
  class: {
    id: number;
    name: string;
    grade: {
      level: number;
    };
  };
  slots: Array<{
    id: string;
    day: string;
    period: number;
    startTime: string;
    endTime: string;
    subject: {
      name: string;
      code: string | null;
    } | null;
    teacher: {
      name: string;
      surname: string;
    } | null;
  }>;
}

export default function AdminTimetableListPage() {
  const router = useRouter();
  const [timetables, setTimetables] = useState<Timetable[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTimetable, setSelectedTimetable] = useState<Timetable | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTimetables();
  }, []);

  const fetchTimetables = async () => {
    try {
      const response = await fetch("/api/timetable");
      if (response.ok) {
        const data = await response.json();
        setTimetables(Array.isArray(data) ? data : []);
        setError(null);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to fetch timetables");
        console.error("API Error:", errorData);
      }
    } catch (error) {
      console.error("Error fetching timetables:", error);
      setError("Database tables may not exist yet. Please run the migration first.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (timetableId: string) => {
    try {
      const response = await fetch(`/api/timetable/${timetableId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        alert("Timetable deleted successfully");
        fetchTimetables();
        setShowDeleteConfirm(null);
      } else {
        const data = await response.json();
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error("Error deleting timetable:", error);
      alert("Failed to delete timetable");
    }
  };

  const handleToggleActive = async (timetableId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/timetable/${timetableId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isActive: !currentStatus,
        }),
      });

      if (response.ok) {
        fetchTimetables();
      } else {
        const data = await response.json();
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error("Error updating timetable status:", error);
    }
  };

  if (loading) {
    return (
      <div className="p-4 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading timetables...</p>
        </div>
      </div>
    );
  }

  // Show error state if database tables don't exist
  if (error) {
    return (
      <div className="p-4 flex flex-col gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Image src="/calendar.png" alt="Timetable" width={24} height={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">School Timetables</h1>
              <p className="text-sm text-gray-600">Manage class timetables</p>
            </div>
          </div>
        </div>

        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-8">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-red-900 mb-2">Database Setup Required</h3>
              <p className="text-red-700 mb-4">{error}</p>
              <div className="bg-white rounded-lg p-4 border border-red-200">
                <p className="text-sm font-semibold text-gray-900 mb-2">To fix this, run these commands in your terminal:</p>
                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                  <li>Stop the development server (Ctrl+C)</li>
                  <li className="font-mono bg-gray-100 p-2 rounded">npx prisma migrate dev --name add_school_timetable_system</li>
                  <li className="font-mono bg-gray-100 p-2 rounded">npx prisma generate</li>
                  <li className="font-mono bg-gray-100 p-2 rounded">npm run dev</li>
                  <li>Refresh this page</li>
                </ol>
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="text-xs text-yellow-800">
                    <strong>Alternative:</strong> If migration fails, use{" "}
                    <code className="bg-yellow-100 px-1 rounded font-mono">npx prisma db push</code> instead.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">📚 Documentation Available</h3>
          <div className="space-y-2 text-sm text-blue-800">
            <p>• <strong>TIMETABLE_SETUP_COMPLETE.md</strong> - Complete setup guide</p>
            <p>• <strong>TIMETABLE_IMPLEMENTATION.md</strong> - Technical documentation</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 flex flex-col gap-6">
      {/* HEADER */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Image src="/calendar.png" alt="Timetable" width={24} height={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">School Timetables</h1>
              <p className="text-sm text-gray-600">Manage class timetables</p>
            </div>
          </div>
          <Link
            href="/admin/timetable/create"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Image src="/create.png" alt="Create" width={16} height={16} />
            Create Timetable
          </Link>
        </div>
      </div>

      {/* STATISTICS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Timetables</p>
              <p className="text-2xl font-bold text-gray-900">{timetables.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Image src="/calendar.png" alt="Total" width={24} height={24} />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active</p>
              <p className="text-2xl font-bold text-green-600">
                {timetables.filter((t) => t.isActive).length}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Inactive</p>
              <p className="text-2xl font-bold text-gray-600">
                {timetables.filter((t) => !t.isActive).length}
              </p>
            </div>
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Periods</p>
              <p className="text-2xl font-bold text-purple-600">
                {timetables.reduce((sum, t) => sum + t.slots.length, 0)}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Image src="/class.png" alt="Periods" width={24} height={24} />
            </div>
          </div>
        </div>
      </div>

      {/* TIMETABLES LIST */}
      {timetables.length === 0 ? (
        <div className="bg-white p-12 rounded-lg shadow-sm border text-center">
          <Image
            src="/calendar.png"
            alt="No timetables"
            width={64}
            height={64}
            className="mx-auto mb-4 opacity-50"
          />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Timetables Found</h3>
          <p className="text-gray-600 mb-4">
            Get started by creating a timetable for a class
          </p>
          <Link
            href="/admin/timetable/create"
            className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Image src="/create.png" alt="Create" width={16} height={16} />
            Create First Timetable
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {timetables.map((timetable) => (
            <div
              key={timetable.id}
              className="bg-white rounded-lg shadow-sm border overflow-hidden"
            >
              <div className="px-6 py-4 bg-gray-50 border-b flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {timetable.class.name} - Grade {timetable.class.grade.level}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {timetable.academicYear} {timetable.term && `• ${timetable.term}`} •{" "}
                      {timetable.slots.length} periods
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      timetable.isActive
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {timetable.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      setSelectedTimetable(
                        selectedTimetable?.id === timetable.id ? null : timetable
                      )
                    }
                    className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    {selectedTimetable?.id === timetable.id ? "Hide" : "View"}
                  </button>
                  <button
                    onClick={() => router.push(`/admin/timetable/edit?id=${timetable.id}`)}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() =>
                      handleToggleActive(timetable.id, timetable.isActive)
                    }
                    className={`px-3 py-1 text-sm rounded-lg ${
                      timetable.isActive
                        ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                        : "bg-green-100 text-green-800 hover:bg-green-200"
                    }`}
                  >
                    {timetable.isActive ? "Deactivate" : "Activate"}
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(timetable.id)}
                    className="px-3 py-1 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {selectedTimetable?.id === timetable.id && (
                <div className="p-6">
                  <TimetablePreview timetable={timetable} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* DELETE CONFIRMATION DIALOG */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Confirm Delete
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this timetable? This will remove all{" "}
              {timetables.find((t) => t.id === showDeleteConfirm)?.slots.length || 0}{" "}
              periods. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Timetable Preview Component
function TimetablePreview({ timetable }: { timetable: Timetable }) {
  // Organize slots into a grid
  const grid: Record<string, Record<number, any>> = {};
  
  SCHOOL_DAYS.forEach((day) => {
    grid[day] = {};
    for (let period = 1; period <= 8; period++) {
      grid[day][period] = null;
    }
  });

  timetable.slots.forEach((slot) => {
    grid[slot.day][slot.period] = slot;
  });

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="px-3 py-2 text-left font-semibold text-gray-700 min-w-[100px]">
              Period
            </th>
            {SCHOOL_DAYS.map((day) => (
              <th key={day} className="px-3 py-2 text-center font-semibold text-gray-700">
                {day.slice(0, 3)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((period) => (
            <tr key={period} className="border-t">
              <td className="px-3 py-2 font-medium text-gray-700 bg-gray-50">
                <div className="text-xs">P{period}</div>
                <div className="text-xs text-gray-500">{getTimeDisplay(period)}</div>
              </td>
              {SCHOOL_DAYS.map((day) => {
                const slot = grid[day][period];
                return (
                  <td key={`${day}-${period}`} className="px-3 py-2">
                    {slot ? (
                      <div
                        className={`${getSubjectColor(
                          slot.subject?.name || ""
                        )} p-2 rounded text-xs`}
                      >
                        <div className="font-medium">{slot.subject?.name}</div>
                        {slot.teacher && (
                          <div className="mt-1">
                            {slot.teacher.name} {slot.teacher.surname.charAt(0)}.
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center text-gray-300">—</div>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
