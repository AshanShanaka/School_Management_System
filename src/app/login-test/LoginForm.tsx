"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log("Login successful:", data);
        // Use window.location.href for a full page reload to ensure cookie is picked up
        window.location.href = `/${data.user.role}`;
      } else {
        setError(data.error || "Login failed");
      }
    } catch (error) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      {error && (
        <div className="text-sm text-red-400 bg-red-50 p-2 rounded">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <label className="text-xs text-gray-500">Username or Email</label>
        <input
          type="text"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          required
          className="p-2 rounded-md ring-1 ring-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
          placeholder="Enter username or email"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs text-gray-500">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="p-2 rounded-md ring-1 ring-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
          placeholder="Enter password"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="bg-blue-500 text-white my-1 rounded-md text-sm p-[10px] hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed"
      >
        {loading ? "Signing in..." : "Sign In"}
      </button>
    </form>
  );
}
