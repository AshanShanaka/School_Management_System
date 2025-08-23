import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  console.log("Test login called");

  const response = NextResponse.json({
    success: true,
    message: "Test cookie set",
  });

  response.cookies.set("test-cookie", "test-value", {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    maxAge: 60 * 60, // 1 hour
    path: "/",
  });

  console.log("Test cookie set");
  return response;
}

export async function GET(request: NextRequest) {
  const testCookie = request.cookies.get("test-cookie")?.value;
  const authCookie = request.cookies.get("auth-token")?.value;

  console.log("Test cookie:", testCookie);
  console.log("Auth cookie:", authCookie?.substring(0, 50) + "...");

  return NextResponse.json({
    testCookie,
    hasAuthCookie: !!authCookie,
    authCookiePreview: authCookie?.substring(0, 50) + "...",
  });
}
