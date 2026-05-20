import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import { db } from "@/db";
import { meetings, agents, soldProperties } from "@/db/schema";
import { eq, count } from "drizzle-orm";

const PAGE_SIZE = 5;

export async function GET(req: NextRequest) {
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

  if (!agent) return NextResponse.json({ rows: [], total: 0 });

  const page = Math.max(1, Number(req.nextUrl.searchParams.get("page") ?? "1"));
  const offset = (page - 1) * PAGE_SIZE;

  const [[{ total }], rows, sold] = await Promise.all([
    db.select({ total: count() }).from(meetings).where(eq(meetings.agentId, agent.id)),
    db.select().from(meetings).where(eq(meetings.agentId, agent.id)).orderBy(meetings.meetingDate).limit(PAGE_SIZE).offset(offset),
    db.select({ propertyName: soldProperties.propertyName, dateOfBuying: soldProperties.dateOfBuying }).from(soldProperties).where(eq(soldProperties.agent, payload.username)),
  ]);

  const soldTitles = new Map(sold.map((s) => [s.propertyName, s.dateOfBuying]));

  const hydrated = rows.map((m) => ({
    ...m,
    markedSoldAt: m.markedSoldAt ?? soldTitles.get(m.propertyTitle) ?? null,
  }));

  return NextResponse.json({ rows: hydrated, total });
}
