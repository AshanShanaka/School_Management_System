import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import ParentMeetings from "@/components/ParentMeetings";

const ParentMeetingsPage = async () => {
  const user = await getCurrentUser();

  if (!user || user.role !== "parent") {
    redirect("/login");
  }

  return <ParentMeetings />;
};

export default ParentMeetingsPage;
