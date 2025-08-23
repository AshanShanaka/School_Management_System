"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

const LogoutPage = () => {
  const router = useRouter();

  useEffect(() => {
    // Clear any local storage or session data
    if (typeof window !== "undefined") {
      localStorage.clear();
      sessionStorage.clear();
    }

    // Redirect to sign-in
    router.push("/login");
  }, [router]);

  return (
    <div className="h-screen flex items-center justify-center bg-lamaSkyLight">
      <div className="bg-white p-8 rounded-lg shadow-lg text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Logging out...</p>
      </div>
    </div>
  );
};

export default LogoutPage;
