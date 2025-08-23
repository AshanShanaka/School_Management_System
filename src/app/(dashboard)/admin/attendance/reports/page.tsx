import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import AttendanceReports from "@/components/AttendanceReports";

const AdminAttendanceReportsPage = async () => {
  const user = await getCurrentUser();
  const role = user?.role;

  // Only admin can access this page
  if (role !== "admin") {
    redirect("/");
  }

  return (
    <div className="p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Attendance Analysis & Reports</h1>
        <p className="text-gray-600">
          Generate comprehensive attendance reports with daily, weekly, monthly,
          and yearly analysis.
        </p>
      </div>

      <AttendanceReports userRole={role} />
    </div>
  );
};

export default AdminAttendanceReportsPage;
