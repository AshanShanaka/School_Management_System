"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function TestLoginPage() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const testLogin = async () => {
    setLoading(true);
    setMessage("Testing login...");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          identifier: "admin",
          password: "admin123",
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage(
          `✅ Login successful! User: ${data.user.name} ${data.user.surname} (${data.user.role})`
        );

        // Wait a moment for cookie to be set
        setTimeout(() => {
          router.push("/list/students");
        }, 1000);
      } else {
        setMessage(`❌ Login failed: ${data.error}`);
      }
    } catch (error) {
      setMessage(`❌ Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/auth/me");
      const data = await response.json();

      if (data.success) {
        setMessage(
          `✅ Currently logged in as: ${data.user.name} ${data.user.surname} (${data.user.role})`
        );
      } else {
        setMessage(`❌ Not logged in: ${data.error}`);
      }
    } catch (error) {
      setMessage(`❌ Auth check error: ${error}`);
    }
  };

  const goToStudents = () => {
    router.push("/list/students");
  };

  const goToTeachers = () => {
    router.push("/list/teachers");
  };

  const goToParents = () => {
    router.push("/list/parents");
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Authentication Test</h1>

      <div className="space-y-4">
        <button
          onClick={testLogin}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? "Testing..." : "Test Admin Login"}
        </button>

        <button
          onClick={checkAuth}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 ml-2"
        >
          Check Current Auth
        </button>

        <div className="mt-4">
          <button
            onClick={goToStudents}
            className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 mr-2"
          >
            Go to Students List
          </button>

          <button
            onClick={goToTeachers}
            className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 mr-2"
          >
            Go to Teachers List
          </button>

          <button
            onClick={goToParents}
            className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
          >
            Go to Parents List
          </button>
        </div>

        {message && (
          <div className="mt-4 p-4 bg-gray-100 rounded">
            <p className="whitespace-pre-wrap">{message}</p>
          </div>
        )}
      </div>
    </div>
  );
}
