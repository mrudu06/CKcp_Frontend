import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

/**
 * Next.js Edge Middleware
 *
 * Protects the /contest route by checking for a valid JWT.
 * The token is read from the "token" cookie (set by the client via
 * document.cookie after signup) or from the Authorization header.
 *
 * If the token is missing or expired, the user is redirected to /.
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only protect /contest routes
  if (!pathname.startsWith("/contest")) {
    return NextResponse.next();
  }

  // Try cookie first, then Authorization header
  const tokenFromCookie = req.cookies.get("contest_token")?.value;
  const authHeader = req.headers.get("Authorization");
  const tokenFromHeader = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;

  const token = tokenFromCookie || tokenFromHeader;

  if (!token) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  const payload = await verifyToken(token);

  if (!payload) {
    // Token is expired or invalid — clear the cookie and redirect
    const response = NextResponse.redirect(new URL("/", req.url));
    response.cookies.delete("contest_token");
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/contest/:path*"],
};
