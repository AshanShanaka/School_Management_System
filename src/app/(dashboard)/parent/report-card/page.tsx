import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import ReportCardDemo from "@/components/ReportCardDemo";

const ParentReportCardPage = async () => {
  const user = await getCurrentUser();

  if (!user || user.role !== "parent") {
    redirect("/login");
  }

  return <ReportCardDemo userRole="parent" />;
};

export default ParentReportCardPage;
