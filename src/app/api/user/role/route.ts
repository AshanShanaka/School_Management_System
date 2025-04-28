import { auth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get the user's role from Clerk using clerkClient
    const user = await clerkClient.users.getUser(userId);
    const role = user.publicMetadata?.role || "STUDENT";

    return NextResponse.json({ role });
  } catch (error) {
    console.error("[USER_ROLE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 