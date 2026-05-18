import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import { db } from "@/db";
import { propertyVisitings, agents, properties, messages, users } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) return NextResponse.json({ booked: false });

  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    return NextResponse.json({ booked: false });
  }

  const propertyId = Number(req.nextUrl.searchParams.get("propertyId"));
  if (!propertyId) return NextResponse.json({ booked: false });

  const existing = await db
    .select({
      id: propertyVisitings.id,
      visitDate: propertyVisitings.visitDate,
      hour: propertyVisitings.hour,
      status: propertyVisitings.status,
    })
    .from(propertyVisitings)
    .where(and(eq(propertyVisitings.userId, payload.id), eq(propertyVisitings.propertyId, propertyId)))
    .limit(1);

  if (existing.length === 0) return NextResponse.json({ booked: false });

  return NextResponse.json({
    booked: true,
    visitDate: existing[0].visitDate,
    hour: existing[0].hour,
    status: existing[0].status,
    visitingId: existing[0].id,
  });
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { propertyId, visitDate, hour } = body;

  if (!propertyId || !visitDate || hour == null) {
    return NextResponse.json({ error: "propertyId, visitDate and hour are required" }, { status: 400 });
  }

  if (hour < 8 || hour > 17) {
    return NextResponse.json({ error: "Hour must be between 8 and 17" }, { status: 400 });
  }

  const date = new Date(visitDate);
  if (isNaN(date.getTime())) {
    return NextResponse.json({ error: "Invalid visitDate" }, { status: 400 });
  }

  // Prevent duplicate booking for same user, property, date and hour
  const existing = await db
    .select({ id: propertyVisitings.id })
    .from(propertyVisitings)
    .where(
      and(
        eq(propertyVisitings.userId, payload.id),
        eq(propertyVisitings.propertyId, propertyId),
        eq(propertyVisitings.visitDate, date),
        eq(propertyVisitings.hour, hour),
      )
    )
    .limit(1);

  if (existing.length > 0) {
    return NextResponse.json(
      { error: "You already have a showing booked for this property at this date and time" },
      { status: 409 }
    );
  }

  const [visiting] = await db
    .insert(propertyVisitings)
    .values({ userId: payload.id, propertyId, visitDate: date, hour })
    .returning();

  // Look up property title and agent userId to send them a message
  try {
    const [property] = await db
      .select({ title: properties.title, listedByAgentId: properties.listedByAgentId })
      .from(properties)
      .where(eq(properties.id, propertyId))
      .limit(1);

    let agentUserId: number | null = null;
    if (property?.listedByAgentId) {
      const [agent] = await db
        .select({ userId: agents.userId })
        .from(agents)
        .where(eq(agents.id, property.listedByAgentId))
        .limit(1);
      agentUserId = agent?.userId ?? null;
    } else {
      // Fallback: same deterministic pick as the property page
      const allAgents = await db.select({ userId: agents.userId }).from(agents);
      if (allAgents.length > 0) {
        agentUserId = allAgents[propertyId % allAgents.length].userId ?? null;
      }
    }

    if (agentUserId && agentUserId !== payload.id) {
      const [sender] = await db
        .select({ username: users.username })
        .from(users)
        .where(eq(users.id, payload.id))
        .limit(1);

      const hourLabel = (h: number) =>
        h < 12 ? `${h}:00 AM` : h === 12 ? "12:00 PM" : `${h - 12}:00 PM`;

      const visitLabel = date.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      const subject = `Showing Request – ${property.title}`;
      const messageBody =
        `${sender?.username ?? "A user"} has requested a showing for:\n\n` +
        `Property: ${property.title}\n` +
        `Date: ${visitLabel}\n` +
        `Time: ${hourLabel(hour)}\n\n` +
        `Please accept or decline this request from your messages.`;

      const [msg] = await db
        .insert(messages)
        .values({ senderId: payload.id, receiverId: agentUserId, subject, message: messageBody })
        .returning({ id: messages.id });

      if (msg) {
        await db
          .update(propertyVisitings)
          .set({ messageId: msg.id })
          .where(eq(propertyVisitings.id, visiting.id));
      }
    }
  } catch {
    // Non-fatal – the visiting is created; message delivery failure shouldn't block the user
  }

  return NextResponse.json(visiting, { status: 201 });
}
