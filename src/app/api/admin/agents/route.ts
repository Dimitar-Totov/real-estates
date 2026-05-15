import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import { db } from "@/db";
import { agents, users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (payload.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { userId, name, specialty, city, image, phone, email } = body;

  if (!userId || !name || !specialty || !email) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Check by userId — the authoritative duplicate guard
  const [existingUser] = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, userId));

  if (existingUser?.role === "agent") {
    return NextResponse.json({ error: "This user is already an agent" }, { status: 409 });
  }

  const [agent] = await db
    .insert(agents)
    .values({
      userId,
      name,
      specialty,
      city: city || "Unknown",
      image: image || "",
      rating: "5.0",
      reviews: 0,
      experience: 0,
      phone: phone || "",
      email,
      featured: false,
    })
    .returning();

  // Promote user role using the userId — no email mismatch possible
  await db.update(users).set({ role: "agent" }).where(eq(users.id, userId));

  return NextResponse.json({ success: true, agent });
}
