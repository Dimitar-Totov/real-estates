import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { signToken } from "@/lib/jwt";

const COOKIE_OPTS = {
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 60 * 60 * 24 * 7,
  path: "/",
};

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!user) {
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }

  const token = signToken({ id: user.id, email: user.email, username: user.username, role: user.role });

  const res = NextResponse.json({ message: "Logged in." });

  // httpOnly — secure JWT, not readable by JS
  res.cookies.set("token", token, { ...COOKIE_OPTS, httpOnly: true });

  // Non-httpOnly — display info only, read by Navbar client-side
  res.cookies.set(
    "user-info",
    JSON.stringify({ id: user.id, username: user.username, role: user.role }),
    { ...COOKIE_OPTS, httpOnly: false }
  );

  return res;
}
