"use client";

import { useState } from "react";

export default function LoginTestPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testLogin = async (
    identifier: string,
    password: string,
    role: string
  ) => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await response.json();
      setResult({ role, success: data.success, data, identifier, password });
    } catch (error: any) {
      setResult({
        role,
        success: false,
        error: error.message,
        identifier,
        password,
      });
    } finally {
      setLoading(false);
    }
  };

  const testCredentials = [
    { role: "Admin", identifier: "admin", password: "admin123" },
    { role: "Teacher (username)", identifier: "kasun", password: "Teach@1003" },
    {
      role: "Teacher (email)",
      identifier: "kasun@gmail.com",
      password: "Teach@1003",
    },
    { role: "Student", identifier: "student1", password: "student123" },
    { role: "Parent", identifier: "parent1", password: "parent123" },
  ];

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Login Test Page</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {testCredentials.map((cred, index) => (
            <div key={index} className="bg-white p-4 rounded-lg shadow">
              <h3 className="font-semibold text-lg mb-2">{cred.role}</h3>
              <p className="text-sm text-gray-600 mb-2">
                <strong>Username:</strong> {cred.identifier}
              </p>
              <p className="text-sm text-gray-600 mb-4">
                <strong>Password:</strong> {cred.password}
              </p>
              <button
                onClick={() =>
                  testLogin(cred.identifier, cred.password, cred.role)
                }
                disabled={loading}
                className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 disabled:opacity-50"
              >
                Test Login
              </button>
            </div>
          ))}
        </div>

        {result && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">
              Test Result for {result.role}
            </h2>
            <div className="mb-4">
              <p>
                <strong>Identifier:</strong> {result.identifier}
              </p>
              <p>
                <strong>Password:</strong> {result.password}
              </p>
              <p>
                <strong>Success:</strong>
                <span
                  className={result.success ? "text-green-600" : "text-red-600"}
                >
                  {result.success ? " ✅ Success" : " ❌ Failed"}
                </span>
              </p>
            </div>

            <div className="bg-gray-100 p-4 rounded">
              <h3 className="font-semibold mb-2">Response:</h3>
              <pre className="text-sm overflow-auto">
                {JSON.stringify(result.data || result.error, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
