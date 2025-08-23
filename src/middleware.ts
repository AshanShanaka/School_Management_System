import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Skip middleware for API routes and static files
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Redirect root to login
  if (pathname === "/") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)", "/"],
};
