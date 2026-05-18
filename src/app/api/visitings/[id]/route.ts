import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import { db } from "@/db";
import { propertyVisitings, agents, properties } from "@/db/schema";
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

  // Verify that this visiting belongs to a property listed by the current agent
  const [agent] = await db
    .select({ id: agents.id })
    .from(agents)
    .where(eq(agents.userId, payload.id))
    .limit(1);

  if (!agent) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const [visiting] = await db
    .select({ id: propertyVisitings.id, propertyId: propertyVisitings.propertyId })
    .from(propertyVisitings)
    .where(eq(propertyVisitings.id, visitingId))
    .limit(1);

  if (!visiting) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [property] = await db
    .select({ listedByAgentId: properties.listedByAgentId })
    .from(properties)
    .where(eq(properties.id, visiting.propertyId))
    .limit(1);

  if (!property || property.listedByAgentId !== agent.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [updated] = await db
    .update(propertyVisitings)
    .set({ status, updatedAt: new Date() })
    .where(eq(propertyVisitings.id, visitingId))
    .returning();

  return NextResponse.json(updated);
}
