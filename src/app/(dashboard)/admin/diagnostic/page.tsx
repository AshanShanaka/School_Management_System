import { getCurrentUser } from "@/lib/auth";

// Diagnostic component to check auth and route access
export default async function DiagnosticPage() {
  const user = await getCurrentUser();

  return (
    <div className="p-8 bg-white rounded-lg shadow-lg max-w-4xl mx-auto mt-8">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">
        Admin Navigation Diagnostic
      </h1>

      <div className="space-y-6">
        {/* User Info */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold text-blue-800 mb-2">
            Current User Info
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            <div>
              <strong>ID:</strong> {user?.id || "Not found"}
            </div>
            <div>
              <strong>Username:</strong> {user?.username || "Not found"}
            </div>
            <div>
              <strong>Email:</strong> {user?.email || "Not found"}
            </div>
            <div>
              <strong>Role:</strong> {user?.role || "Not found"}
            </div>
            <div>
              <strong>Name:</strong> {user?.name || "Not found"}{" "}
              {user?.surname || ""}
            </div>
          </div>
        </div>

        {/* Route Access Check */}
        <div className="bg-green-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold text-green-800 mb-2">
            Route Access Status
          </h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Admin Role:</span>
              <span
                className={
                  user?.role === "admin"
                    ? "text-green-600 font-bold"
                    : "text-red-600"
                }
              >
                {user?.role === "admin" ? "✅ Confirmed" : "❌ Not Admin"}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Students Page Access:</span>
              <span
                className={
                  user?.role === "admin"
                    ? "text-green-600 font-bold"
                    : "text-red-600"
                }
              >
                {user?.role === "admin"
                  ? "✅ Should have access"
                  : "❌ No access"}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Parents Page Access:</span>
              <span
                className={
                  user?.role === "admin"
                    ? "text-green-600 font-bold"
                    : "text-red-600"
                }
              >
                {user?.role === "admin"
                  ? "✅ Should have access"
                  : "❌ No access"}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Links Test */}
        <div className="bg-yellow-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold text-yellow-800 mb-2">
            Test Navigation Links
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a
              href="/list/students"
              className="block p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-center transition-colors"
            >
              🎓 Test Students Page
            </a>
            <a
              href="/list/parents"
              className="block p-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-center transition-colors"
            >
              👨‍👩‍👧‍👦 Test Parents Page
            </a>
            <a
              href="/list/teachers"
              className="block p-3 bg-green-600 text-white rounded-lg hover:bg-green-700 text-center transition-colors"
            >
              👨‍🏫 Test Teachers Page
            </a>
            <a
              href="/admin"
              className="block p-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-center transition-colors"
            >
              ⚙️ Test Admin Dashboard
            </a>
          </div>
        </div>

        {/* Troubleshooting Guide */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">
            Troubleshooting Steps
          </h2>
          <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
            <li>Check if user role is 'admin' above</li>
            <li>Try clicking the test navigation links above</li>
            <li>Check browser console for any JavaScript errors</li>
            <li>Check browser network tab for failed requests</li>
            <li>Verify you're logged in as admin user</li>
            <li>Try refreshing the page</li>
            <li>Check if there are any middleware redirects</li>
          </ol>
        </div>

        {/* Quick Actions */}
        <div className="bg-indigo-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold text-indigo-800 mb-2">
            Quick Actions
          </h2>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              🔄 Refresh Page
            </button>
            <button
              onClick={() => console.log("User:", user)}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              🔍 Log User to Console
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
