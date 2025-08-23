import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import ClassWiseAttendance from "@/components/ClassWiseAttendance";

const AdminAttendancePage = async () => {
  const user = await getCurrentUser();
  const role = user?.role;

  // Only admin can access this page
  if (role !== "admin") {
    redirect("/");
  }

  return (
    <div className="p-4">
      <ClassWiseAttendance />
    </div>
  );
};

export default AdminAttendancePage;
