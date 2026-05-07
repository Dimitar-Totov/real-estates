import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const { username, email, password } = await req.json();

  if (!username || !email || !password) {
    return NextResponse.json({ error: "All fields are required." }, { status: 400 });
  }

  const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existing.length > 0) {
    return NextResponse.json({ error: "Email already in use." }, { status: 409 });
  }

  const hashed = await bcrypt.hash(password, 12);
  await db.insert(users).values({ username, email, password: hashed });

  return NextResponse.json({ message: "Account created successfully." }, { status: 201 });
}
