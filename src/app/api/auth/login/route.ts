import { NextRequest, NextResponse } from "next/server";
import { login } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { identifier, password } = body;

    if (!identifier || !password) {
      return NextResponse.json(
        { error: "Username/email and password are required" },
        { status: 400 }
      );
    }

    const result = await login(identifier, password);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

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
