import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);

    // Also check cookies directly
    const cookies = request.cookies.getAll();
    const authToken = request.cookies.get("auth-token");

    return NextResponse.json({
      success: true,
      user,
      hasAuthToken: !!authToken,
      authTokenValue: authToken?.value?.substring(0, 50) + "..." || null,
      allCookies: cookies.map((c) => ({ name: c.name, hasValue: !!c.value })),
    });
  } catch (error: any) {
    console.error("Auth test error:", error);
    return NextResponse.json({
      success: false,
      error: error.message || "Unknown error",
      user: null,
    });
  }
}
