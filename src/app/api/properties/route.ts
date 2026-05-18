import { NextRequest, NextResponse } from "next/server";
import { eq, ilike, and, SQL, sql } from "drizzle-orm";
import { db } from "@/db";
import { properties, agents, messages, pendingListings, NewProperty } from "@/db/schema";
import { verifyToken } from "@/lib/jwt";

type AuthPayload = { id: number; role: string } | null;

function tryAuth(req: NextRequest): AuthPayload {
  try {
    const token = req.cookies.get("token")?.value;
    if (!token) return null;
    const payload = verifyToken(token);
    return { id: payload.id, role: payload.role };
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const city = searchParams.get("city");
    const type = searchParams.get("type") as NewProperty["type"] | null;
    const status = searchParams.get("status") as NewProperty["status"] | null;

    const filters: SQL[] = [];
    if (city) filters.push(ilike(properties.city, `%${city}%`));
    if (type) filters.push(sql`${properties.type} = ${type}`);
    if (status) filters.push(sql`${properties.status} = ${status}`);

    const rows = await db
      .select()
      .from(properties)
      .where(filters.length > 0 ? and(...filters) : undefined)
      .orderBy(properties.createdAt);

    return NextResponse.json(rows);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch properties" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = tryAuth(request);
    const body = await request.json();
    const { agentId, ...propertyData } = body;

    // Logged-in agent lists directly — no pending, no approval needed
    if (auth?.role === "agent") {
      const [agentRow] = await db
        .select({ id: agents.id })
        .from(agents)
        .where(eq(agents.userId, auth.id));

      const [created] = await db
        .insert(properties)
        .values({ ...(propertyData as NewProperty), listedByAgentId: agentRow?.id ?? null })
        .returning();
      return NextResponse.json(created, { status: 201 });
    }

    // No agent selected — insert directly (admin / direct use)
    if (!agentId) {
      const [created] = await db
        .insert(properties)
        .values(propertyData as NewProperty)
        .returning();
      return NextResponse.json(created, { status: 201 });
    }

    const [agent] = await db
      .select({ id: agents.id, userId: agents.userId, name: agents.name })
      .from(agents)
      .where(eq(agents.id, Number(agentId)));

    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 400 });
    }

    // 1. Store property data as pending — nothing goes into properties table yet
    const [pending] = await db
      .insert(pendingListings)
      .values({
        agentId: agent.id,
        submittedBy: auth?.id ?? undefined,
        propertyData: propertyData,
      })
      .returning();

    // 2. Send message to agent (requires a logged-in sender)
    if (auth?.id && agent.userId) {
      const imageUrls: string[] = Array.isArray(propertyData.images) ? propertyData.images : [];

      const lines = [
        "A new property has been submitted for your review.",
        "",
        `Title:        ${propertyData.title}`,
        `Type:         ${propertyData.type}`,
        `Status:       ${String(propertyData.status).replace(/_/g, " ")}`,
        `Price:        $${Number(propertyData.price).toLocaleString()}`,
        "",
        `Address:      ${propertyData.address}`,
        `City:         ${propertyData.city}, ${propertyData.state} ${propertyData.zipCode}`,
        `Country:      ${propertyData.country}`,
        "",
        `Bedrooms:     ${propertyData.bedrooms ?? "—"}`,
        `Bathrooms:    ${propertyData.bathrooms ?? "—"}`,
        `Sq. Ft.:      ${propertyData.squareFeet ?? "—"}`,
        `Lot Size:     ${propertyData.lotSize ? `${propertyData.lotSize} sqft` : "—"}`,
        `Year Built:   ${propertyData.yearBuilt ?? "—"}`,
        `Garage:       ${propertyData.garage ? "Yes" : "No"}`,
        `Pool:         ${propertyData.pool ? "Yes" : "No"}`,
      ];

      if (propertyData.description) {
        lines.push("", "Description:", propertyData.description);
      }

      if (imageUrls.length > 0) {
        lines.push("", `Photos (${imageUrls.length}):`, ...imageUrls);
      }

      const [msg] = await db
        .insert(messages)
        .values({
          senderId: auth.id,
          receiverId: agent.userId,
          subject: `New property listing: ${propertyData.title}`,
          message: lines.join("\n"),
        })
        .returning();

      // 3. Link message back to the pending listing
      await db
        .update(pendingListings)
        .set({ messageId: msg.id })
        .where(eq(pendingListings.id, pending.id));
    }

    return NextResponse.json({ pending: true, id: pending.id }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create property" }, { status: 500 });
  }
}
