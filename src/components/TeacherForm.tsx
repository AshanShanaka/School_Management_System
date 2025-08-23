"use client";

import { useState, useEffect } from "react";
import {
  X,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Lock,
  BookOpen,
} from "lucide-react";
import toast from "react-hot-toast";

interface TeacherFormProps {
  isOpen: boolean;
  onClose: () => void;
  teacher?: any;
  onSuccess: () => void;
}

const TeacherForm = ({
  isOpen,
  onClose,
  teacher,
  onSuccess,
}: TeacherFormProps) => {
  const [formData, setFormData] = useState({
    username: "",
    name: "",
    surname: "",
    email: "",
    phone: "",
    address: "",
    sex: "MALE",
    birthday: "",
    password: "",
    subjects: [] as string[],
  });
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingSubjects, setLoadingSubjects] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchSubjects();
      if (teacher) {
        setFormData({
          username: teacher.username || "",
          name: teacher.name || "",
          surname: teacher.surname || "",
          email: teacher.email || "",
          phone: teacher.phone || "",
          address: teacher.address || "",
          sex: teacher.sex || "MALE",
          birthday: teacher.birthday
            ? new Date(teacher.birthday).toISOString().split("T")[0]
            : "",
          password: "",
          subjects: teacher.subjects?.map((s: any) => s.id.toString()) || [],
        });
      } else {
        setFormData({
          username: "",
          name: "",
          surname: "",
          email: "",
          phone: "",
          address: "",
          sex: "MALE",
          birthday: "",
          password: "",
          subjects: [],
        });
      }
    }
  }, [isOpen, teacher]);

  const fetchSubjects = async () => {
    try {
      setLoadingSubjects(true);
      const response = await fetch("/api/subjects");
      if (response.ok) {
        const data = await response.json();
        setSubjects(data.subjects || []);
      }
    } catch (error) {
      console.error("Error fetching subjects:", error);
      toast.error("Failed to load subjects");
    } finally {
      setLoadingSubjects(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = teacher ? `/api/teachers/${teacher.id}` : "/api/teachers";
      const method = teacher ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(
          teacher
            ? "Teacher updated successfully!"
            : "Teacher created successfully!"
        );
        onSuccess();
        onClose();
      } else {
        toast.error(data.error || "Failed to save teacher");
      }
    } catch (error) {
      console.error("Error saving teacher:", error);
      toast.error("An error occurred while saving teacher");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubjectChange = (subjectId: string) => {
    setFormData((prev) => ({
      ...prev,
      subjects: prev.subjects.includes(subjectId)
        ? prev.subjects.filter((id) => id !== subjectId)
        : [...prev.subjects, subjectId],
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {teacher ? "Edit Teacher" : "Add New Teacher"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="w-4 h-4 inline mr-2" />
                Username *
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="w-4 h-4 inline mr-2" />
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                First Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Last Name *
              </label>
              <input
                type="text"
                name="surname"
                value={formData.surname}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Phone className="w-4 h-4 inline mr-2" />
                Phone
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                Birthday *
              </label>
              <input
                type="date"
                name="birthday"
                value={formData.birthday}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gender *
              </label>
              <select
                name="sex"
                value={formData.sex}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Lock className="w-4 h-4 inline mr-2" />
                Password {!teacher && "*"}
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required={!teacher}
                placeholder={
                  teacher ? "Leave blank to keep current password" : ""
                }
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="w-4 h-4 inline mr-2" />
              Address
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Subjects */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <BookOpen className="w-4 h-4 inline mr-2" />
              Subjects
            </label>
            {loadingSubjects ? (
              <div className="text-sm text-gray-500">Loading subjects...</div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-32 overflow-y-auto border border-gray-300 rounded-lg p-3">
                {subjects.map((subject: any) => (
                  <label
                    key={subject.id}
                    className="flex items-center space-x-2"
                  >
                    <input
                      type="checkbox"
                      checked={formData.subjects.includes(
                        subject.id.toString()
                      )}
                      onChange={() =>
                        handleSubjectChange(subject.id.toString())
                      }
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">
                      {subject.name}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {loading && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              )}
              <span>{teacher ? "Update Teacher" : "Create Teacher"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TeacherForm;
