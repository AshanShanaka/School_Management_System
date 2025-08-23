"use client";

import { useState } from "react";
import { User, Save, Loader } from "lucide-react";
import { toast } from "react-toastify";
import { User as UserType } from "@/lib/auth";
import { useRouter } from "next/navigation";

interface ProfileFormProps {
  user: UserType;
}

const ProfileForm = ({ user }: ProfileFormProps) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user.name || "",
    surname: user.surname || "",
    email: user.email || "",
    phone: user.phone || "",
    address: user.address || "",
    birthday: user.birthday
      ? new Date(user.birthday).toISOString().split("T")[0]
      : "",
    sex: user.sex || ("MALE" as "MALE" | "FEMALE"),
  });

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/profile/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          role: user.role,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success("Profile updated successfully!");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to update profile");
      }
    } catch (error) {
      console.error("Profile update error:", error);
      toast.error("An error occurred while updating profile");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-blue-600" />
          Basic Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              First Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Enter first name"
            />
          </div>

          <div>
            <label
              htmlFor="surname"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Last Name *
            </label>
            <input
              type="text"
              id="surname"
              name="surname"
              value={formData.surname}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Enter last name"
            />
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Contact Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Email Address *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Enter email address"
            />
          </div>

          <div>
            <label
              htmlFor="phone"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Phone Number
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Enter phone number"
            />
          </div>
        </div>
      </div>

      {/* Personal Information */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Personal Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="birthday"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Date of Birth
            </label>
            <input
              type="date"
              id="birthday"
              name="birthday"
              value={formData.birthday}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>

          <div>
            <label
              htmlFor="sex"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Gender
            </label>
            <select
              id="sex"
              name="sex"
              value={formData.sex}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
            </select>
          </div>
        </div>
      </div>

      {/* Address */}
      <div>
        <label
          htmlFor="address"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Address
        </label>
        <textarea
          id="address"
          name="address"
          value={formData.address}
          onChange={handleInputChange}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          placeholder="Enter full address"
        />
      </div>

      {/* Submit Button */}
      <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={() => router.refresh()}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {isLoading ? (
            <>
              <Loader className="w-4 h-4 animate-spin" />
              <span>Updating...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default ProfileForm;
