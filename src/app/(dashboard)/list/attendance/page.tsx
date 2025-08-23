import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import Image from "next/image";

const AttendanceListPage = async () => {
  const user = await getCurrentUser();
  const role = user?.role;

  if (!role || !user?.id) {
    redirect("/login");
  }

  // Redirect to role-specific attendance pages
  if (role === "student") {
    redirect("/student/attendance");
  }

  if (role === "parent") {
    redirect("/parent/attendance");
  }

  if (role === "admin") {
    redirect("/admin/attendance");
  }

  if (role === "teacher") {
    redirect("/teacher/attendance/timetable");
  }

  // Fallback redirect
  redirect("/");
};

export default AttendanceListPage;
