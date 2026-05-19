import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import { db } from "@/db";
import { propertyVisitings, properties, agents, messages, users } from "@/db/schema";
import { eq, and, isNotNull } from "drizzle-orm";
import { getPropertyCoverImage } from "@/services/imagesService";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── Agent: return all visitings on their listed properties ──────
  if (payload.role === "agent") {
    const [agent] = await db
      .select({ id: agents.id })
      .from(agents)
      .where(eq(agents.userId, payload.id))
      .limit(1);

    if (!agent) return NextResponse.json([]);

    // Strategy A: properties explicitly listed by this agent
    const fromListings = await db
      .select({
        visitingId:     propertyVisitings.id,
        visitDate:      propertyVisitings.visitDate,
        hour:           propertyVisitings.hour,
        status:         propertyVisitings.status,
        createdAt:      propertyVisitings.createdAt,
        messageId:      propertyVisitings.messageId,
        propertyId:     properties.id,
        title:          properties.title,
        address:        properties.address,
        city:           properties.city,
        state:          properties.state,
        price:          properties.price,
        propertyStatus: properties.status,
        type:           properties.type,
        bedrooms:       properties.bedrooms,
        bathrooms:      properties.bathrooms,
        squareFeet:     properties.squareFeet,
        images:         properties.images,
        requesterName:  users.username,
      })
      .from(propertyVisitings)
      .innerJoin(properties, eq(propertyVisitings.propertyId, properties.id))
      .leftJoin(users, eq(propertyVisitings.userId, users.id))
      .where(and(eq(properties.listedByAgentId, agent.id), eq(propertyVisitings.status, "pending")))
      .orderBy(propertyVisitings.visitDate);

    // Strategy B: visitings linked via message sent to this agent (covers fallback-assigned properties)
    const fromMessages = await db
      .select({
        visitingId:     propertyVisitings.id,
        visitDate:      propertyVisitings.visitDate,
        hour:           propertyVisitings.hour,
        status:         propertyVisitings.status,
        createdAt:      propertyVisitings.createdAt,
        messageId:      propertyVisitings.messageId,
        propertyId:     properties.id,
        title:          properties.title,
        address:        properties.address,
        city:           properties.city,
        state:          properties.state,
        price:          properties.price,
        propertyStatus: properties.status,
        type:           properties.type,
        bedrooms:       properties.bedrooms,
        bathrooms:      properties.bathrooms,
        squareFeet:     properties.squareFeet,
        images:         properties.images,
        requesterName:  users.username,
      })
      .from(propertyVisitings)
      .innerJoin(properties, eq(propertyVisitings.propertyId, properties.id))
      .innerJoin(messages, and(
        eq(propertyVisitings.messageId, messages.id),
        eq(messages.receiverId, payload.id),
      ))
      .leftJoin(users, eq(propertyVisitings.userId, users.id))
      .where(and(isNotNull(propertyVisitings.messageId), eq(propertyVisitings.status, "pending")))
      .orderBy(propertyVisitings.visitDate);

    // Merge, deduplicate by visitingId
    const seen = new Set<number>();
    const merged = [...fromListings, ...fromMessages].filter((r) => {
      if (seen.has(r.visitingId)) return false;
      seen.add(r.visitingId);
      return true;
    });

    const rowsWithCovers = await Promise.all(
      merged.map(async (row) => ({
        ...row,
        coverImage: await getPropertyCoverImage(row.propertyId, row.images),
      }))
    );

    return NextResponse.json(rowsWithCovers);
  }

  // ── Regular user: return their own bookings ─────────────────────
  const rows = await db
    .select({
      visitingId:     propertyVisitings.id,
      visitDate:      propertyVisitings.visitDate,
      hour:           propertyVisitings.hour,
      status:         propertyVisitings.status,
      createdAt:      propertyVisitings.createdAt,
      propertyId:     properties.id,
      title:          properties.title,
      address:        properties.address,
      city:           properties.city,
      state:          properties.state,
      price:          properties.price,
      propertyStatus: properties.status,
      type:           properties.type,
      bedrooms:       properties.bedrooms,
      bathrooms:      properties.bathrooms,
      squareFeet:     properties.squareFeet,
      images:         properties.images,
    })
    .from(propertyVisitings)
    .innerJoin(properties, eq(propertyVisitings.propertyId, properties.id))
    .where(eq(propertyVisitings.userId, payload.id))
    .orderBy(propertyVisitings.visitDate);

  const rowsWithCovers = await Promise.all(
    rows.map(async (row) => ({
      ...row,
      coverImage: await getPropertyCoverImage(row.propertyId, row.images),
    }))
  );

  return NextResponse.json(rowsWithCovers);
}
