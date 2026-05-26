import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

// Routes that require a logged-in user
const PROTECTED = ["/properties/new", "/feed", "/profile"];

// Routes that logged-in users should not visit (redirect to home)
const GUEST_ONLY = ["/auth"];

const ALLOWED_ORIGINS = ["https://realestatedimitarmobile.netlify.app"];

const CORS_HEADERS = {
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Credentials": "true",
};

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const origin = req.headers.get("origin") ?? "";
  const isAllowedOrigin = ALLOWED_ORIGINS.includes(origin);

  // Handle CORS preflight for API routes
  if (req.method === "OPTIONS" && pathname.startsWith("/api/")) {
    const headers = {
      ...(isAllowedOrigin && { "Access-Control-Allow-Origin": origin }),
      ...CORS_HEADERS,
    };
    return NextResponse.json({}, { headers });
  }

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

  const response = NextResponse.next();

  // Attach CORS headers to API responses for allowed origins
  if (isAllowedOrigin && pathname.startsWith("/api/")) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    for (const [key, value] of Object.entries(CORS_HEADERS)) {
      response.headers.set(key, value);
    }
  }

  return response;
}

export const config = {
  matcher: ["/properties/new", "/feed", "/profile", "/auth", "/api/:path*"],
};
