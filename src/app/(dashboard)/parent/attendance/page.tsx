import { redirect } from "next/navigation";

export default function ParentAttendancePage() {
  // Redirect to the parent dashboard where attendance is shown
  redirect("/parent");
}
