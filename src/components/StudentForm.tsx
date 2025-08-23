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
  GraduationCap,
  Users,
} from "lucide-react";
import toast from "react-hot-toast";

interface StudentFormProps {
  isOpen: boolean;
  onClose: () => void;
  student?: any;
  onSuccess: () => void;
}

const StudentForm = ({
  isOpen,
  onClose,
  student,
  onSuccess,
}: StudentFormProps) => {
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
    gradeId: "",
    classId: "",
    parentId: "",
  });
  const [grades, setGrades] = useState([]);
  const [classes, setClasses] = useState([]);
  const [parents, setParents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchFormData();
      if (student) {
        setFormData({
          username: student.username || "",
          name: student.name || "",
          surname: student.surname || "",
          email: student.email || "",
          phone: student.phone || "",
          address: student.address || "",
          sex: student.sex || "MALE",
          birthday: student.birthday
            ? new Date(student.birthday).toISOString().split("T")[0]
            : "",
          password: "",
          gradeId: student.gradeId?.toString() || "",
          classId: student.classId?.toString() || "",
          parentId: student.parentId?.toString() || "",
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
          gradeId: "",
          classId: "",
          parentId: "",
        });
      }
    }
  }, [isOpen, student]);

  const fetchFormData = async () => {
    try {
      setLoadingData(true);
      const [gradesRes, classesRes, parentsRes] = await Promise.all([
        fetch("/api/grades"),
        fetch("/api/classes"),
        fetch("/api/parents"),
      ]);

      if (gradesRes.ok) {
        const gradesData = await gradesRes.json();
        setGrades(gradesData.grades || []);
      }

      if (classesRes.ok) {
        const classesData = await classesRes.json();
        setClasses(classesData.classes || []);
      }

      if (parentsRes.ok) {
        const parentsData = await parentsRes.json();
        setParents(parentsData.parents || []);
      }
    } catch (error) {
      console.error("Error fetching form data:", error);
      toast.error("Failed to load form data");
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = student ? `/api/students/${student.id}` : "/api/students";
      const method = student ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          gradeId: formData.gradeId ? parseInt(formData.gradeId) : undefined,
          classId: formData.classId ? parseInt(formData.classId) : undefined,
          parentId: formData.parentId ? parseInt(formData.parentId) : undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(
          student
            ? "Student updated successfully!"
            : "Student created successfully!"
        );
        onSuccess();
        onClose();
      } else {
        toast.error(data.error || "Failed to save student");
      }
    } catch (error) {
      console.error("Error saving student:", error);
      toast.error("An error occurred while saving student");
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {student ? "Edit Student" : "Add New Student"}
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
          {loadingData ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-4">Loading form data...</p>
            </div>
          ) : (
            <>
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
                    Password {!student && "*"}
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required={!student}
                    placeholder={
                      student ? "Leave blank to keep current password" : ""
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

              {/* Academic Information */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <GraduationCap className="w-4 h-4 inline mr-2" />
                    Grade
                  </label>
                  <select
                    name="gradeId"
                    value={formData.gradeId}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Grade</option>
                    {grades.map((grade: any) => (
                      <option key={grade.id} value={grade.id}>
                        {grade.level}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Class
                  </label>
                  <select
                    name="classId"
                    value={formData.classId}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Class</option>
                    {classes.map((cls: any) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Users className="w-4 h-4 inline mr-2" />
                    Parent
                  </label>
                  <select
                    name="parentId"
                    value={formData.parentId}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Parent</option>
                    {parents.map((parent: any) => (
                      <option key={parent.id} value={parent.id}>
                        {parent.name} {parent.surname}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </>
          )}

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              disabled={loading || loadingData}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || loadingData}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {loading && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              )}
              <span>{student ? "Update Student" : "Create Student"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StudentForm;
