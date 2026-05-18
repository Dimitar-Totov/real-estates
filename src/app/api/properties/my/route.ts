import { NextRequest, NextResponse } from "next/server";
import { eq, or } from "drizzle-orm";
import { verifyToken } from "@/lib/jwt";
import { db } from "@/db";
import { properties, agents, users } from "@/db/schema";
import { getPropertyCoverImage } from "@/services/imagesService";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let userId: number;
  try {
    userId = verifyToken(token).id;
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [user] = await db
    .select({ email: users.email })
    .from(users)
    .where(eq(users.id, userId));

  if (!user) return NextResponse.json([]);

  // Match by userId (modern agents) or by email (legacy agents created before userId column)
  const [agent] = await db
    .select({ id: agents.id })
    .from(agents)
    .where(or(eq(agents.userId, userId), eq(agents.email, user.email)));

  if (!agent) return NextResponse.json([]);

  const rows = await db
    .select()
    .from(properties)
    .where(eq(properties.listedByAgentId, agent.id))
    .orderBy(properties.createdAt);

  const coverImages = await Promise.all(
    rows.map((p) => getPropertyCoverImage(p.id, p.images)),
  );

  return NextResponse.json(rows.map((p, i) => ({ ...p, coverImage: coverImages[i] })));
}
