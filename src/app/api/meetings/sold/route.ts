import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import { db } from "@/db";
import { soldProperties, agents, properties, meetings } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (payload.role !== "agent") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [agent] = await db
    .select({ id: agents.id })
    .from(agents)
    .where(eq(agents.userId, payload.id))
    .limit(1);

  if (!agent) return NextResponse.json({ error: "Agent not found" }, { status: 404 });

  const body = await req.json();
  const { meetingId, propertyName, buyer } = body as { meetingId?: number; propertyName?: string; buyer?: string };

  if (!propertyName || !buyer) {
    return NextResponse.json({ error: "propertyName and buyer are required" }, { status: 400 });
  }

  const now = new Date();

  const [inserted] = await db
    .insert(soldProperties)
    .values({
      propertyName,
      agent: payload.username ?? String(payload.id),
      buyer,
      dateOfBuying: now,
    })
    .returning();

  await db
    .delete(properties)
    .where(and(eq(properties.listedByAgentId, agent.id), eq(properties.title, propertyName)));

  if (meetingId) {
    await db
      .update(meetings)
      .set({ markedSoldAt: now })
      .where(and(eq(meetings.id, meetingId), eq(meetings.agentId, agent.id)));
  }

  return NextResponse.json(inserted, { status: 201 });
}
