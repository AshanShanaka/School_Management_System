import ClassWiseStudentView from "@/components/ClassWiseStudentView";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

const ClassWiseStudentsPage = async () => {
  const user = await getCurrentUser();

  if (!user || !["admin", "teacher"].includes(user.role)) {
    redirect("/login");
  }

  return <ClassWiseStudentView />;
};

export default ClassWiseStudentsPage;
