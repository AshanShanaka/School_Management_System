// Special Days and Holiday Management System
"use client";

import React, { useState, useEffect } from "react";
import {
  Calendar,
  Plus,
  Edit3,
  Trash2,
  Clock,
  MapPin,
  Users,
  AlertCircle,
  Save,
  X,
} from "lucide-react";

interface SpecialDay {
  id: number;
  title: string;
  date: string;
  type: "holiday" | "exam" | "event" | "break" | "sports";
  description?: string;
  affectedClasses?: string[];
  customTimetable?: boolean;
  startTime?: string;
  endTime?: string;
}

interface SpecialDayFormData {
  title: string;
  date: string;
  type: "holiday" | "exam" | "event" | "break" | "sports";
  description: string;
  affectedClasses: string[];
  customTimetable: boolean;
  startTime: string;
  endTime: string;
}

const initialFormData: SpecialDayFormData = {
  title: "",
  date: "",
  type: "holiday",
  description: "",
  affectedClasses: [],
  customTimetable: false,
  startTime: "08:30",
  endTime: "13:30",
};

const typeColors = {
  holiday: "bg-red-500 text-white",
  exam: "bg-blue-500 text-white",
  event: "bg-green-500 text-white",
  break: "bg-yellow-500 text-white",
  sports: "bg-purple-500 text-white",
};

const typeIcons = {
  holiday: "🏖️",
  exam: "📝",
  event: "🎉",
  break: "☕",
  sports: "⚽",
};

const SpecialDaysManager: React.FC = () => {
  const [specialDays, setSpecialDays] = useState<SpecialDay[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingDay, setEditingDay] = useState<SpecialDay | null>(null);
  const [formData, setFormData] = useState<SpecialDayFormData>(initialFormData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Available classes for selection
  const [availableClasses, setAvailableClasses] = useState<string[]>([
    "1-A",
    "1-B",
    "2-A",
    "2-B",
    "3-A",
    "3-B",
    "4-A",
    "4-B",
    "5-A",
    "5-B",
    "6-A",
    "6-B",
    "7-A",
    "7-B",
    "8-A",
    "8-B",
    "9-A",
    "9-B",
    "10-A",
    "10-B",
    "11-A",
    "11-B",
  ]);

  // Load special days
  useEffect(() => {
    loadSpecialDays();
  }, []);

  const loadSpecialDays = async () => {
    try {
      setLoading(true);
      // Simulate API call - replace with actual API
      const mockData: SpecialDay[] = [
        {
          id: 1,
          title: "National Day",
          date: "2024-12-02",
          type: "holiday",
          description: "UAE National Day celebration",
          affectedClasses: [],
          customTimetable: false,
        },
        {
          id: 2,
          title: "Mid-term Exams",
          date: "2024-12-15",
          type: "exam",
          description: "Grade 10-12 mid-term examinations",
          affectedClasses: ["10-A", "10-B", "11-A", "11-B"],
          customTimetable: true,
          startTime: "08:00",
          endTime: "12:00",
        },
        {
          id: 3,
          title: "Sports Day",
          date: "2024-12-20",
          type: "sports",
          description: "Annual inter-house sports competition",
          affectedClasses: [],
          customTimetable: true,
          startTime: "07:30",
          endTime: "15:00",
        },
      ];
      setSpecialDays(mockData);
      setError(null);
    } catch (err) {
      setError("Failed to load special days");
    } finally {
      setLoading(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingDay) {
        // Update existing special day
        const updatedDay: SpecialDay = {
          ...editingDay,
          ...formData,
          affectedClasses: formData.affectedClasses,
        };
        setSpecialDays((prev) =>
          prev.map((day) => (day.id === editingDay.id ? updatedDay : day))
        );
      } else {
        // Create new special day
        const newDay: SpecialDay = {
          id: Date.now(),
          ...formData,
          affectedClasses: formData.affectedClasses,
        };
        setSpecialDays((prev) => [...prev, newDay]);
      }

      // Reset form
      setFormData(initialFormData);
      setShowForm(false);
      setEditingDay(null);
    } catch (err) {
      setError("Failed to save special day");
    }
  };

  // Handle edit
  const handleEdit = (day: SpecialDay) => {
    setEditingDay(day);
    setFormData({
      title: day.title,
      date: day.date,
      type: day.type,
      description: day.description || "",
      affectedClasses: day.affectedClasses || [],
      customTimetable: day.customTimetable || false,
      startTime: day.startTime || "08:30",
      endTime: day.endTime || "13:30",
    });
    setShowForm(true);
  };

  // Handle delete
  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this special day?")) {
      setSpecialDays((prev) => prev.filter((day) => day.id !== id));
    }
  };

  // Handle class selection
  const handleClassToggle = (className: string) => {
    setFormData((prev) => ({
      ...prev,
      affectedClasses: prev.affectedClasses.includes(className)
        ? prev.affectedClasses.filter((c) => c !== className)
        : [...prev.affectedClasses, className],
    }));
  };

  // Get upcoming special days
  const upcomingDays = specialDays
    .filter((day) => new Date(day.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl p-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2">Special Days & Holidays</h1>
            <p className="text-indigo-100">
              Manage school calendar events and custom timetables
            </p>
          </div>
          <button
            onClick={() => {
              setFormData(initialFormData);
              setEditingDay(null);
              setShowForm(true);
            }}
            className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg flex items-center transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Special Day
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}

      {/* Upcoming Events */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <Calendar className="w-5 h-5 mr-2" />
          Upcoming Events
        </h2>
        {upcomingDays.length > 0 ? (
          <div className="space-y-3">
            {upcomingDays.map((day) => (
              <div
                key={day.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">{typeIcons[day.type]}</div>
                  <div>
                    <h3 className="font-semibold">{day.title}</h3>
                    <p className="text-sm text-gray-600">
                      {new Date(day.date).toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    typeColors[day.type]
                  }`}
                >
                  {day.type.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">No upcoming events</p>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">
                  {editingDay ? "Edit Special Day" : "Add Special Day"}
                </h2>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Title *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date *
                    </label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          date: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Type *
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          type: e.target.value as any,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="holiday">Holiday</option>
                      <option value="exam">Exam</option>
                      <option value="event">Event</option>
                      <option value="break">Break</option>
                      <option value="sports">Sports</option>
                    </select>
                  </div>

                  <div>
                    <label className="flex items-center space-x-2 mt-8">
                      <input
                        type="checkbox"
                        checked={formData.customTimetable}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            customTimetable: e.target.checked,
                          }))
                        }
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        Custom Timetable
                      </span>
                    </label>
                  </div>
                </div>

                {formData.customTimetable && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Start Time
                      </label>
                      <input
                        type="time"
                        value={formData.startTime}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            startTime: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        End Time
                      </label>
                      <input
                        type="time"
                        value={formData.endTime}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            endTime: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Affected Classes (leave empty for all classes)
                  </label>
                  <div className="grid grid-cols-6 gap-2 max-h-32 overflow-y-auto">
                    {availableClasses.map((className) => (
                      <label
                        key={className}
                        className="flex items-center space-x-2 text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={formData.affectedClasses.includes(className)}
                          onChange={() => handleClassToggle(className)}
                          className="w-3 h-3 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span>{className}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg flex items-center transition-colors"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {editingDay ? "Update" : "Create"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Special Days List */}
      <div className="bg-white rounded-xl shadow-lg">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold">All Special Days</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {specialDays.map((day) => (
            <div key={day.id} className="p-6 hover:bg-gray-50">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="text-xl">{typeIcons[day.type]}</div>
                    <h3 className="text-lg font-semibold">{day.title}</h3>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        typeColors[day.type]
                      }`}
                    >
                      {day.type.toUpperCase()}
                    </span>
                  </div>

                  <div className="space-y-1 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      {new Date(day.date).toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </div>

                    {day.customTimetable && (
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-2" />
                        {day.startTime} - {day.endTime}
                      </div>
                    )}

                    {day.affectedClasses && day.affectedClasses.length > 0 && (
                      <div className="flex items-center">
                        <Users className="w-4 h-4 mr-2" />
                        {day.affectedClasses.join(", ")}
                      </div>
                    )}

                    {day.description && (
                      <p className="mt-2">{day.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex space-x-2 ml-4">
                  <button
                    onClick={() => handleEdit(day)}
                    className="text-blue-600 hover:text-blue-800 p-1"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(day.id)}
                    className="text-red-600 hover:text-red-800 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SpecialDaysManager;
