import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import StudentAttendanceDemo from "@/components/StudentAttendanceDemo";

const StudentAttendancePage = async () => {
  const user = await getCurrentUser();

  if (!user || user.role !== "student") {
    redirect("/login");
  }

  return <StudentAttendanceDemo />;
};

export default StudentAttendancePage;
