import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import { db } from "@/db";
import {
  propertyVisitings,
  agents,
  properties,
  meetings,
  users,
  profiles,
  messages,
} from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

  const { id } = await params;
  const visitingId = Number(id);
  if (!visitingId) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const { status } = await req.json();
  if (status !== "confirmed" && status !== "cancelled") {
    return NextResponse.json({ error: "status must be confirmed or cancelled" }, { status: 400 });
  }

  const [agent] = await db
    .select({ id: agents.id })
    .from(agents)
    .where(eq(agents.userId, payload.id))
    .limit(1);

  if (!agent) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const [visiting] = await db
    .select({
      id: propertyVisitings.id,
      propertyId: propertyVisitings.propertyId,
      messageId: propertyVisitings.messageId,
    })
    .from(propertyVisitings)
    .where(eq(propertyVisitings.id, visitingId))
    .limit(1);

  if (!visiting) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [property] = await db
    .select({ listedByAgentId: properties.listedByAgentId })
    .from(properties)
    .where(eq(properties.id, visiting.propertyId))
    .limit(1);

  // Check message-based ownership (Strategy B visitings)
  let hasMessageOwnership = false;
  if (visiting.messageId) {
    const [msg] = await db
      .select({ id: messages.id })
      .from(messages)
      .where(and(eq(messages.id, visiting.messageId), eq(messages.receiverId, payload.id)))
      .limit(1);
    hasMessageOwnership = !!msg;
  }

  if (!property || (property.listedByAgentId !== agent.id && !hasMessageOwnership)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (status === "confirmed") {
    const [info] = await db
      .select({
        visitDate: propertyVisitings.visitDate,
        hour: propertyVisitings.hour,
        requesterUsername: users.username,
        requesterEmail: users.email,
        propertyTitle: properties.title,
        propertyAddress: properties.address,
        mobilePhone: profiles.mobilePhone,
        officePhone: profiles.officePhone,
        contactEmail: profiles.contactEmail,
      })
      .from(propertyVisitings)
      .innerJoin(properties, eq(propertyVisitings.propertyId, properties.id))
      .innerJoin(users, eq(propertyVisitings.userId, users.id))
      .leftJoin(profiles, eq(profiles.userId, propertyVisitings.userId))
      .where(eq(propertyVisitings.id, visitingId))
      .limit(1);

    if (info) {
      const meetingDate = new Date(info.visitDate);
      meetingDate.setHours(info.hour, 0, 0, 0);

      await db.insert(meetings).values({
        agentId: agent.id,
        meetingDate,
        propertyTitle: info.propertyTitle,
        propertyAddress: info.propertyAddress,
        requesterUsername: info.requesterUsername,
        requesterPhone: info.mobilePhone ?? info.officePhone,
        requesterEmail: info.contactEmail ?? info.requesterEmail,
      });
    }
  }

  const [updated] = await db
    .update(propertyVisitings)
    .set({ status, updatedAt: new Date() })
    .where(eq(propertyVisitings.id, visitingId))
    .returning();

  return NextResponse.json(updated);
}
