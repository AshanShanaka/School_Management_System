import { NextRequest, NextResponse } from "next/server";

export async function logout(request: NextRequest) {
  // Create response that clears the auth cookie
  const response = NextResponse.json({ message: "Logged out successfully" });

  // Clear the authentication cookie
  response.cookies.set({
    name: "auth-token",
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0, // Expire immediately
    path: "/",
  });

  return response;
}

export async function clearAuthCookie() {
  const response = NextResponse.redirect(
    new URL("/login", process.env.NEXT_PUBLIC_URL)
  );

  response.cookies.set({
    name: "auth-token",
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });

  return response;
}
