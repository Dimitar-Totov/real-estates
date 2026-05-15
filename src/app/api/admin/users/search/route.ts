import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import { db } from "@/db";
import { users, profiles } from "@/db/schema";
import { and, eq, ilike, ne } from "drizzle-orm";
import { cdnUrl } from "@/services/userImagesService";

export async function GET(req: NextRequest) {
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

  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q) return NextResponse.json([]);

  const rows = await db
    .select({
      id: users.id,
      username: users.username,
      email: users.email,
      role: users.role,
      avatarKey: users.avatarKey,
      location: users.location,
      createdAt: users.createdAt,
      officePhone: profiles.officePhone,
      mobilePhone: profiles.mobilePhone,
      contactEmail: profiles.contactEmail,
    })
    .from(users)
    .leftJoin(profiles, eq(profiles.userId, users.id))
    .where(and(ilike(users.username, `%${q}%`), ne(users.role, "agent")))
    .limit(20);

  return NextResponse.json(
    rows.map((r) => ({
      id: r.id,
      username: r.username,
      email: r.email,
      role: r.role,
      avatarUrl: r.avatarKey ? cdnUrl(r.avatarKey) : null,
      location: r.location,
      createdAt: r.createdAt,
      officePhone: r.officePhone ?? null,
      mobilePhone: r.mobilePhone ?? null,
      contactEmail: r.contactEmail ?? null,
    })),
  );
}
