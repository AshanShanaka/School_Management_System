import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import ReportCardDemo from "@/components/ReportCardDemo";

const TeacherReportCardPage = async () => {
  const user = await getCurrentUser();

  if (!user || user.role !== "teacher") {
    redirect("/login");
  }

  return <ReportCardDemo userRole="teacher" />;
};

export default TeacherReportCardPage;
