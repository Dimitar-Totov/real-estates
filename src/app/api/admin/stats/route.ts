import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import { db } from "@/db";
import { properties, agents, users } from "@/db/schema";
import { count, eq } from "drizzle-orm";

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

  const [[{ propertiesCount }], [{ agentsCount }], [{ usersCount }]] = await Promise.all([
    db.select({ propertiesCount: count() }).from(properties),
    db.select({ agentsCount: count() }).from(agents),
    db.select({ usersCount: count() }).from(users).where(eq(users.role, "user")),
  ]);

  return NextResponse.json({ properties: propertiesCount, agents: agentsCount, users: usersCount });
}
