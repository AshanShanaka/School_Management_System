import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import StudentReportCardList from "@/components/StudentReportCardList";

const StudentReportCardPage = async () => {
  const user = await getCurrentUser();

  if (!user || user.role !== "student") {
    redirect("/login");
  }

  return (
    <div className="flex-1 p-4">
      <StudentReportCardList />
    </div>
  );
};

export default StudentReportCardPage;
