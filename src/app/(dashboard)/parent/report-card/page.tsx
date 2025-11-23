import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import ParentReportCardList from "@/components/ParentReportCardList";

const ParentReportCardPage = async () => {
  const user = await getCurrentUser();

  if (!user || user.role !== "parent") {
    redirect("/login");
  }

  return <ParentReportCardList />;
};

export default ParentReportCardPage;
