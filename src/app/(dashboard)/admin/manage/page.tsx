import AdminCrudDashboard from "@/components/AdminCrudDashboard";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

const AdminManagePage = async () => {
  const user = await getCurrentUser();

  if (!user || user.role !== "admin") {
    redirect("/login");
  }

  return <AdminCrudDashboard />;
};

export default AdminManagePage;
