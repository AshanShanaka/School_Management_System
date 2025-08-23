import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

const HomePage = async () => {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // Redirect to appropriate dashboard based on role
  redirect(`/${user.role}`);
};

export default HomePage;
