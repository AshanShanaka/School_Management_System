import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import ReportCardDemo from "@/components/ReportCardDemo";

const StudentReportCardPage = async () => {
  const user = await getCurrentUser();

  if (!user || user.role !== "student") {
    redirect("/login");
  }

  return <ReportCardDemo userRole="student" />;
};

export default StudentReportCardPage;
