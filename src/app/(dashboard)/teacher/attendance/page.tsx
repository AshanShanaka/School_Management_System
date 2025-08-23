import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

const TeacherAttendancePage = async () => {
  const user = await getCurrentUser();

  if (!user || user.role !== "teacher") {
    redirect("/login");
  }

  return (
    <div className="flex-1 p-4 flex flex-col gap-4 xl:flex-row">
      {/* LEFT */}
      <div className="w-full xl:w-2/3">
        <div className="h-full bg-white p-4 rounded-lg">
          <h1 className="text-xl font-semibold">
            Teacher Attendance Dashboard
          </h1>
          <p className="text-gray-600 mt-2">
            Manage attendance for your classes and lessons.
          </p>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-800">
                Take Attendance by Lesson
              </h3>
              <p className="text-sm text-blue-600 mt-2">
                Record attendance for individual lessons
              </p>
              <a
                href="/teacher/attendance/lesson"
                className="inline-block mt-3 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Go to Lesson Attendance
              </a>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-800">
                Take Attendance by Timetable
              </h3>
              <p className="text-sm text-green-600 mt-2">
                Record attendance using your timetable schedule
              </p>
              <a
                href="/teacher/attendance/timetable"
                className="inline-block mt-3 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Go to Timetable Attendance
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT */}
      <div className="w-full xl:w-1/3">
        <div className="h-full bg-white p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-4">Quick Info</h2>
          <div className="space-y-4">
            <div className="p-3 bg-gray-50 rounded">
              <h4 className="font-medium">Today's Classes</h4>
              <p className="text-sm text-gray-600">
                Check your schedule for today
              </p>
            </div>
            <div className="p-3 bg-gray-50 rounded">
              <h4 className="font-medium">Recent Attendance</h4>
              <p className="text-sm text-gray-600">
                View recently recorded attendance
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherAttendancePage;
