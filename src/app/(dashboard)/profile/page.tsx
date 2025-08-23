import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import ProfileForm from "@/components/ProfileForm";
import {
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Shield,
  Settings,
  LogOut,
} from "lucide-react";
import LogoutButton from "@/components/LogoutButton";

const ProfilePage = async () => {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "teacher":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "student":
        return "bg-green-100 text-green-800 border-green-200";
      case "parent":
        return "bg-orange-100 text-orange-800 border-orange-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
        return <Shield className="w-4 h-4" />;
      case "teacher":
        return <User className="w-4 h-4" />;
      case "student":
        return <User className="w-4 h-4" />;
      case "parent":
        return <User className="w-4 h-4" />;
      default:
        return <User className="w-4 h-4" />;
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-full p-4">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
              <p className="text-gray-600 mt-1">
                Manage your account information and settings
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div
              className={`px-4 py-2 rounded-full border flex items-center space-x-2 ${getRoleColor(
                user.role
              )}`}
            >
              {getRoleIcon(user.role)}
              <span className="font-medium capitalize">{user.role}</span>
            </div>
            <LogoutButton />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Info Card */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            {/* Profile Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
              <div className="text-center">
                <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-12 h-12 text-white" />
                </div>
                <h2 className="text-xl font-bold">
                  {user.name} {user.surname}
                </h2>
                <p className="text-blue-100 mt-1">{user.email}</p>
              </div>
            </div>

            {/* Profile Details */}
            <div className="p-6 space-y-4">
              <div className="flex items-center space-x-3 text-gray-600">
                <Mail className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p className="text-gray-900">{user.email}</p>
                </div>
              </div>

              {user.phone && (
                <div className="flex items-center space-x-3 text-gray-600">
                  <Phone className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Phone</p>
                    <p className="text-gray-900">{user.phone}</p>
                  </div>
                </div>
              )}

              {user.birthday && (
                <div className="flex items-center space-x-3 text-gray-600">
                  <Calendar className="w-5 h-5 text-purple-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Birthday
                    </p>
                    <p className="text-gray-900">
                      {new Date(user.birthday).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}

              {user.address && (
                <div className="flex items-center space-x-3 text-gray-600">
                  <MapPin className="w-5 h-5 text-red-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Address</p>
                    <p className="text-gray-900">{user.address}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-3 text-gray-600">
                <Settings className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Role</p>
                  <div
                    className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full border text-sm ${getRoleColor(
                      user.role
                    )}`}
                  >
                    {getRoleIcon(user.role)}
                    <span className="font-medium capitalize">{user.role}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Quick Actions
            </h3>
            <div className="space-y-3">
              <button className="w-full flex items-center space-x-3 p-3 text-left bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                <Settings className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-900">Account Settings</p>
                  <p className="text-sm text-blue-600">
                    Manage your preferences
                  </p>
                </div>
              </button>

              <div
                className="w-full flex items-center space-x-3 p-3 text-left bg-red-50 hover:bg-red-100 rounded-lg transition-colors cursor-pointer"
                onClick={() => {
                  // Handle logout click
                  fetch("/api/auth/logout", { method: "POST" }).then(
                    () => (window.location.href = "/login")
                  );
                }}
              >
                <LogOut className="w-5 h-5 text-red-600" />
                <div>
                  <p className="font-medium text-red-900">Sign Out</p>
                  <p className="text-sm text-red-600">
                    Logout from your account
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Edit Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Edit Profile
              </h2>
              <p className="text-gray-600 mt-1">
                Update your personal information
              </p>
            </div>
            <div className="p-6">
              <ProfileForm user={user} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
