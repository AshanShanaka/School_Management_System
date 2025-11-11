"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface ClassData {
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
}

const ClassListPage = () => {
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/classes", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setClasses(data.classes || []);
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
      <h1 className="text-lg font-semibold mb-4">All Classes</h1>
      <div className="space-y-4">
        {classes.map((classItem) => (
          <div key={classItem.id} className="border p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">{classItem.name}</h3>
                <p className="text-sm text-gray-500">
                  Grade {classItem.grade?.level} | Capacity: {classItem.capacity}
                </p>
                <p className="text-sm text-gray-500">
                  Enrolled: {classItem._count.students} students
                </p>
                {classItem.supervisor && (
                  <p className="text-sm text-gray-500">
                    Supervisor: {classItem.supervisor.name} {classItem.supervisor.surname}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <button className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-100">
                  <Image src="/update.png" alt="Edit" width={16} height={16} />
                </button>
                <button className="w-8 h-8 flex items-center justify-center rounded-full bg-red-100">
                  <Image src="/delete.png" alt="Delete" width={16} height={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
        {classes.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No classes found
          </div>
        )}
      </div>
    </div>
  );
};

export default ClassListPage;
