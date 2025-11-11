import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import PredictionDashboardDemo from "@/components/PredictionDashboardDemo";

const TeacherPredictionsPage = async () => {
  const user = await getCurrentUser();

  if (!user || user.role !== "teacher") {
    redirect("/login");
  }

  return <PredictionDashboardDemo />;
};

export default TeacherPredictionsPage;
