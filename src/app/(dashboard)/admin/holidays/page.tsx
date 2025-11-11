"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface Holiday {
  id: string;
  date: string;
  name: string;
  description: string | null;
  type: string;
  isRecurring: boolean;
  recurYearly: boolean;
  affectsAllClasses: boolean;
  blocksScheduling: boolean;
  classId: number | null;
  gradeLevel: number | null;
  createdAt: string;
}

const HOLIDAY_TYPES = [
  { value: "POYA_DAY", label: "Poya Day", icon: "🌕" },
  { value: "PUBLIC_HOLIDAY", label: "Public Holiday", icon: "🎉" },
  { value: "SCHOOL_EVENT", label: "School Event", icon: "🏫" },
  { value: "EXAMINATION", label: "Examination", icon: "📝" },
  { value: "VACATION", label: "Vacation", icon: "🏖️" },
  { value: "SPORTS_DAY", label: "Sports Day", icon: "⚽" },
  { value: "CULTURAL_EVENT", label: "Cultural Event", icon: "🎭" },
  { value: "TEACHER_TRAINING", label: "Teacher Training", icon: "👩‍🏫" },
  { value: "PARENT_MEETING", label: "Parent Meeting", icon: "👨‍👩‍👧" },
];

const HolidayManagementPage = () => {
  const router = useRouter();
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    date: "",
    name: "",
    description: "",
    type: "PUBLIC_HOLIDAY",
    isRecurring: false,
    recurYearly: false,
    affectsAllClasses: true,
    blocksScheduling: true,
    classId: "",
    gradeLevel: "",
  });

  useEffect(() => {
    fetchHolidays();
  }, []);

  const fetchHolidays = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/holidays", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setHolidays(data.holidays || []);
      }
    } catch (error) {
      console.error("Error fetching holidays:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const res = await fetch("/api/holidays", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...formData,
          classId: formData.classId ? parseInt(formData.classId) : null,
          gradeLevel: formData.gradeLevel ? parseInt(formData.gradeLevel) : null,
        }),
      });

      if (res.ok) {
        alert("Holiday added successfully!");
        setShowForm(false);
        setFormData({
          date: "",
          name: "",
          description: "",
          type: "PUBLIC_HOLIDAY",
          isRecurring: false,
          recurYearly: false,
          affectsAllClasses: true,
          blocksScheduling: true,
          classId: "",
          gradeLevel: "",
        });
        fetchHolidays();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to add holiday");
      }
    } catch (error) {
      console.error("Error adding holiday:", error);
      alert("Error adding holiday");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this holiday?")) return;

    try {
      const res = await fetch(`/api/holidays/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (res.ok) {
        fetchHolidays();
      } else {
        alert("Failed to delete holiday");
      }
    } catch (error) {
      console.error("Error deleting holiday:", error);
      alert("Error deleting holiday");
    }
  };

  const getHolidayIcon = (type: string) => {
    return HOLIDAY_TYPES.find((t) => t.value === type)?.icon || "📅";
  };

  const getHolidayLabel = (type: string) => {
    return HOLIDAY_TYPES.find((t) => t.value === type)?.label || type;
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-md m-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading holidays...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-md m-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold mb-2">🗓️ Holiday Management</h1>
          <p className="text-gray-600">
            Manage school holidays, special days, and events
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
        >
          {showForm ? "Cancel" : "+ Add Holiday"}
        </button>
      </div>

      {showForm && (
        <div className="mb-6 p-6 bg-gray-50 rounded-lg border border-gray-200">
          <h2 className="text-lg font-semibold mb-4">Add New Holiday</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md"
                  placeholder="e.g., Vesak Poya Day"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-md"
                >
                  {HOLIDAY_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.icon} {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-md"
                  placeholder="Optional description"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.affectsAllClasses}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      affectsAllClasses: e.target.checked,
                    })
                  }
                  className="rounded"
                />
                <span className="text-sm">Affects All Classes</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.blocksScheduling}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      blocksScheduling: e.target.checked,
                    })
                  }
                  className="rounded"
                />
                <span className="text-sm">Block Scheduling</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.recurYearly}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      recurYearly: e.target.checked,
                    })
                  }
                  className="rounded"
                />
                <span className="text-sm">Recurs Yearly</span>
              </label>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Add Holiday
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-3">
        {holidays.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🗓️</div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">
              No Holidays Found
            </h3>
            <p className="text-gray-500">Add holidays to block scheduling on specific days</p>
          </div>
        ) : (
          holidays
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .map((holiday) => (
              <div
                key={holiday.id}
                className="border border-gray-200 p-4 rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">
                        {getHolidayIcon(holiday.type)}
                      </span>
                      <div>
                        <h3 className="font-semibold">{holiday.name}</h3>
                        <p className="text-sm text-gray-600">
                          {new Date(holiday.date).toLocaleDateString("en-US", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                    </div>

                    {holiday.description && (
                      <p className="text-sm text-gray-600 mb-2">
                        {holiday.description}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-2">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                        {getHolidayLabel(holiday.type)}
                      </span>
                      {holiday.affectsAllClasses && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                          All Classes
                        </span>
                      )}
                      {holiday.blocksScheduling && (
                        <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded">
                          Blocks Scheduling
                        </span>
                      )}
                      {holiday.recurYearly && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">
                          Recurs Yearly
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(holiday.id)}
                    className="ml-4 p-2 hover:bg-red-50 rounded-full transition-colors"
                    title="Delete"
                  >
                    <Image
                      src="/delete.png"
                      alt="Delete"
                      width={20}
                      height={20}
                    />
                  </button>
                </div>
              </div>
            ))
        )}
      </div>
    </div>
  );
};

export default HolidayManagementPage;
