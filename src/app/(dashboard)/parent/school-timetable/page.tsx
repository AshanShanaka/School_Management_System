// Parent Timetable View - Shows their children's timetables
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { getTimeDisplay, getSubjectColor, SCHOOL_DAYS } from "@/lib/schoolTimetableConfig";

interface ParentTimetableData {
  parent: {
    id: string;
    name: string;
    surname: string;
  };
  children: Array<{
    student: {
      id: string;
      name: string;
      surname: string;
      class: {
        id: number;
        name: string;
        gradeLevel: number;
        classTeacher: {
          name: string;
          surname: string;
          phone: string | null;
          email: string | null;
        } | null;
      };
    };
    timetable: {
      id: string;
      academicYear: string;
      term: string | null;
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
        roomNumber: string | null;
      }>;
    } | null;
  }>;
  message?: string;
}

export default function ParentTimetablePage() {
  const router = useRouter();
  const [data, setData] = useState<ParentTimetableData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedChild, setSelectedChild] = useState<string | null>(null);

  useEffect(() => {
    fetchParentTimetable();
  }, []);

  const fetchParentTimetable = async () => {
    try {
      // Get current user
      const userRes = await fetch("/api/auth/me");
      if (!userRes.ok) {
        router.push("/login");
        return;
      }

      const userData = await userRes.json();
      const parentId = userData.user.id;

      // Get parent timetables
      const response = await fetch(`/api/timetable/parent/${parentId}`);
      if (response.ok) {
        const timetableData = await response.json();
        setData(timetableData);
        
        // Select first child by default
        if (timetableData.children.length > 0) {
          setSelectedChild(timetableData.children[0].student.id);
        }
      }
    } catch (error) {
      console.error("Error fetching parent timetable:", error);
    } finally {
      setLoading(false);
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

  if (!data || data.children.length === 0) {
    return (
      <div className="p-4">
        <div className="bg-white p-12 rounded-lg shadow-sm border text-center">
          <Image
            src="/calendar.png"
            alt="No timetable"
            width={64}
            height={64}
            className="mx-auto mb-4 opacity-50"
          />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Timetables Available</h3>
          <p className="text-gray-600">
            {data?.message || "No children found or timetables not yet available."}
          </p>
        </div>
      </div>
    );
  }

  const { parent, children } = data;
  const currentChild = children.find((c) => c.student.id === selectedChild);

  return (
    <div className="p-4 flex flex-col gap-6">
      {/* HEADER */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 rounded-lg shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
            <Image src="/parent.png" alt="Parent" width={24} height={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Children's Timetables</h1>
            <p className="text-purple-100">
              {parent.name} {parent.surname}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div className="bg-white bg-opacity-10 rounded-lg p-3">
            <div className="text-purple-100 text-xs">Total Children</div>
            <div className="text-2xl font-bold">{children.length}</div>
          </div>
          <div className="bg-white bg-opacity-10 rounded-lg p-3">
            <div className="text-purple-100 text-xs">With Timetables</div>
            <div className="text-2xl font-bold">
              {children.filter((c) => c.timetable !== null).length}
            </div>
          </div>
        </div>
      </div>

      {/* CHILD SELECTOR */}
      {children.length > 1 && (
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Child
          </label>
          <div className="flex flex-wrap gap-2">
            {children.map(({ student }) => (
              <button
                key={student.id}
                onClick={() => setSelectedChild(student.id)}
                className={`px-4 py-3 rounded-lg border transition-colors ${
                  selectedChild === student.id
                    ? "bg-purple-600 text-white border-purple-600"
                    : "bg-white text-gray-700 border-gray-300 hover:border-purple-400"
                }`}
              >
                <div className="font-medium">
                  {student.name} {student.surname}
                </div>
                <div className="text-xs opacity-80">
                  {student.class.name} - Grade {student.class.gradeLevel}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* SELECTED CHILD'S TIMETABLE */}
      {currentChild && currentChild.timetable && (
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b">
            <h3 className="text-lg font-semibold text-gray-900">Weekly Timetable</h3>
            <p className="text-sm text-gray-600">
              {currentChild.timetable.academicYear} •{" "}
              {currentChild.timetable.slots.length} periods per week
            </p>
          </div>

          <div className="overflow-x-auto p-6">
            <p className="text-gray-600 text-center">Timetable grid would display here</p>
          </div>
        </div>
      )}
    </div>
  );
}
