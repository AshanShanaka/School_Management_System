import { NextRequest, NextResponse } from "next/server";
import { login } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("📱 MOBILE LOGIN - Received body:", JSON.stringify(body));
    const { identifier, password } = body;
    console.log("📱 MOBILE LOGIN - identifier:", identifier, "password:", password ? "***" : "empty");

    if (!identifier || !password) {
      console.log("❌ MOBILE LOGIN - Missing fields!");
      return NextResponse.json(
        { error: "Username/email and password are required" },
        { status: 400 }
      );
    }

    const result = await login(identifier, password);
    console.log("📱 MOBILE LOGIN - Login result:", result.success ? "SUCCESS" : "FAILED");

    if (!result.success) {
      console.log("❌ MOBILE LOGIN - Auth failed:", result.error);
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    console.log("✅ MOBILE LOGIN - User authenticated:", result.user?.name, "Role:", result.user?.role);

    // Set auth cookie
    const response = NextResponse.json({
      success: true,
      user: result.user,
    });

    console.log(
      "Setting auth cookie with token:",
      result.token?.substring(0, 50) + "..."
    );

    response.cookies.set("auth-token", result.token!, {
      httpOnly: true,
      secure: false, // Set to false for development
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    console.log("Cookie set successfully");
    return response;
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
