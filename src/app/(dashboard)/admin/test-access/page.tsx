import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

// Simple test page to check students data access
export default async function StudentsTest() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return (
        <div className="p-8 bg-red-50 rounded-lg">
          <h1 className="text-xl font-bold text-red-800">
            Authentication Error
          </h1>
          <p className="text-red-700">No user found. Please log in.</p>
        </div>
      );
    }

    if (user.role !== "admin") {
      return (
        <div className="p-8 bg-yellow-50 rounded-lg">
          <h1 className="text-xl font-bold text-yellow-800">Access Denied</h1>
          <p className="text-yellow-700">
            You need admin privileges to access this page.
          </p>
          <p className="text-sm text-gray-600">Current role: {user.role}</p>
        </div>
      );
    }

    // Test database connection
    const studentCount = await prisma.student.count();
    const parentCount = await prisma.parent.count();

    // Test a simple query
    const recentStudents = await prisma.student.findMany({
      take: 5,
      include: {
        class: {
          include: {
            grade: true,
          },
        },
      },
      orderBy: { id: "desc" },
    });

    return (
      <div className="p-8 space-y-6">
        <div className="bg-green-50 p-6 rounded-lg">
          <h1 className="text-2xl font-bold text-green-800 mb-4">
            ✅ Students & Parents Access Test
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-white p-4 rounded border">
              <h3 className="font-semibold text-gray-800">
                Database Connection
              </h3>
              <p className="text-green-600">✅ Connected successfully</p>
            </div>

            <div className="bg-white p-4 rounded border">
              <h3 className="font-semibold text-gray-800">
                User Authentication
              </h3>
              <p className="text-green-600">✅ Admin access confirmed</p>
              <p className="text-sm text-gray-600">
                User: {user.name} ({user.role})
              </p>
            </div>

            <div className="bg-white p-4 rounded border">
              <h3 className="font-semibold text-gray-800">Students Count</h3>
              <p className="text-blue-600 text-2xl font-bold">{studentCount}</p>
            </div>

            <div className="bg-white p-4 rounded border">
              <h3 className="font-semibold text-gray-800">Parents Count</h3>
              <p className="text-purple-600 text-2xl font-bold">
                {parentCount}
              </p>
            </div>
          </div>

          <div className="bg-white p-4 rounded border">
            <h3 className="font-semibold text-gray-800 mb-3">
              Recent Students Sample
            </h3>
            {recentStudents.length > 0 ? (
              <div className="space-y-2">
                {recentStudents.map((student) => (
                  <div
                    key={student.id}
                    className="flex justify-between items-center p-2 bg-gray-50 rounded"
                  >
                    <span className="font-medium">
                      {student.name} {student.surname}
                    </span>
                    <span className="text-sm text-gray-600">
                      Class: {student.class?.grade?.level}-{student.class?.name}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No students found</p>
            )}
          </div>

          <div className="flex gap-4 mt-6">
            <a
              href="/list/students"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              → Go to Students Page
            </a>
            <a
              href="/list/parents"
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              → Go to Parents Page
            </a>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Students test error:", error);

    return (
      <div className="p-8 bg-red-50 rounded-lg">
        <h1 className="text-xl font-bold text-red-800">Error Detected</h1>
        <p className="text-red-700 mb-4">
          There was an error accessing the students/parents data.
        </p>

        <div className="bg-white p-4 rounded border">
          <h3 className="font-semibold text-red-800">Error Details:</h3>
          <pre className="text-xs text-gray-700 mt-2 overflow-auto">
            {error instanceof Error ? error.message : "Unknown error"}
          </pre>
        </div>

        <div className="mt-4">
          <h3 className="font-semibold text-gray-800">Possible Solutions:</h3>
          <ul className="list-disc list-inside text-sm text-gray-700 mt-2 space-y-1">
            <li>Check database connection</li>
            <li>Verify Prisma schema is up to date</li>
            <li>Run database migrations</li>
            <li>Check authentication tokens</li>
            <li>Restart the development server</li>
          </ul>
        </div>
      </div>
    );
  }
}
