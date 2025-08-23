"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

const LogoutButton = () => {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    setLoading(true);
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="flex items-center gap-1 text-sm text-gray-600 hover:text-red-600 disabled:opacity-50"
      title="Logout"
    >
      <LogOut size={16} />
      {loading ? "..." : ""}
    </button>
  );
};

export default LogoutButton;
