import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

const AdminTakeAttendancePage = async () => {
  const user = await getCurrentUser();
  const role = user?.role;

  // Redirect admin to reports page - they cannot take attendance
  if (role === "admin") {
    redirect("/admin/attendance");
  }

  // Only teachers can access this page
  if (role !== "teacher") {
    redirect("/");
  }

  // For teachers, redirect to their attendance page
  redirect("/teacher/attendance");
};

export default AdminTakeAttendancePage;
