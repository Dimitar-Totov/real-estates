import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

// Routes that require a logged-in user
const PROTECTED = ["/properties/new", "/feed"];

// Routes that logged-in users should not visit (redirect to home)
const GUEST_ONLY = ["/auth"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get("token")?.value;

  let isAuthenticated = false;
  if (token) {
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET);
      await jwtVerify(token, secret);
      isAuthenticated = true;
    } catch {
      // expired or invalid token — treat as guest
    }
  }

  const isProtected = PROTECTED.some((p) => pathname.startsWith(p));
  const isGuestOnly = GUEST_ONLY.some((p) => pathname.startsWith(p));

  if (isProtected && !isAuthenticated) {
    return NextResponse.redirect(new URL("/auth", req.url));
  }

  if (isGuestOnly && isAuthenticated) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/properties/new", "/feed", "/auth"],
};
