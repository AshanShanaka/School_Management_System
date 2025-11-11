import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminAttendanceReports from "@/components/AdminAttendanceReports";

const AdminAttendancePage = async () => {
  const user = await getCurrentUser();
  const role = user?.role;

  // Only admin can access this page
  if (role !== "admin") {
    redirect("/");
  }

  return (
    <div className="p-4">
      <div className="max-w-7xl mx-auto">
        <AdminAttendanceReports />
      </div>
    </div>
  );
};

export default AdminAttendancePage;
