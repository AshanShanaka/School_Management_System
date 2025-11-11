import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import ParentMeetingsDemo from "@/components/ParentMeetingsDemo";

const ParentMeetingsPage = async () => {
  const user = await getCurrentUser();

  if (!user || user.role !== "parent") {
    redirect("/login");
  }

  return <ParentMeetingsDemo />;
};

export default ParentMeetingsPage;
