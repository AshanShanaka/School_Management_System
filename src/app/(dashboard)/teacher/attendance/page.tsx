import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import DailyAttendanceForm from "@/components/DailyAttendanceForm";

const TeacherAttendancePage = async () => {
  const user = await getCurrentUser();

  if (!user || user.role !== "teacher") {
    redirect("/login");
  }

  return (
    <div className="p-4">
      <div className="max-w-4xl mx-auto">
        <DailyAttendanceForm />
      </div>
    </div>
  );
};

export default TeacherAttendancePage;
