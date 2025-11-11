import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import TeacherAttendanceDemo from "@/components/TeacherAttendanceDemo";

const TeacherAttendancePage = async () => {
  const user = await getCurrentUser();

  if (!user || user.role !== "teacher") {
    redirect("/login");
  }

  return <TeacherAttendanceDemo />;
};

export default TeacherAttendancePage;
