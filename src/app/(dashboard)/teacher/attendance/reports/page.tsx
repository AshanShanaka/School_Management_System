import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

const TeacherAttendanceReportsPage = async () => {
  const user = await getCurrentUser();

  if (!user || user.role !== "teacher") {
    redirect("/login");
  }

  return (
    <div className="flex-1 p-4 flex flex-col gap-4">
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          Attendance Reports
        </h1>
        <p className="text-gray-600 mb-6">
          View and analyze attendance data for your classes and subjects.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">Daily Reports</h3>
            <p className="text-sm text-blue-600 mb-3">
              View attendance for specific dates
            </p>
            <button className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
              Generate Daily Report
            </button>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-semibold text-green-800 mb-2">
              Weekly Reports
            </h3>
            <p className="text-sm text-green-600 mb-3">
              View weekly attendance summaries
            </p>
            <button className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
              Generate Weekly Report
            </button>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="font-semibold text-purple-800 mb-2">
              Monthly Reports
            </h3>
            <p className="text-sm text-purple-600 mb-3">
              View monthly attendance analysis
            </p>
            <button className="w-full px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600">
              Generate Monthly Report
            </button>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Recent Reports
          </h2>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-gray-500 text-center">
              No reports generated yet. Create your first report using the
              options above.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherAttendanceReportsPage;
