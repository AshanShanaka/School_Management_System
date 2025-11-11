import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import PredictionDashboardDemo from "@/components/PredictionDashboardDemo";

const PredictionsPage = async () => {
  const user = await getCurrentUser();

  if (!user || (user.role !== "admin" && user.role !== "teacher")) {
    redirect("/login");
  }

  return <PredictionDashboardDemo />;
};

export default PredictionsPage;
