import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { properties, agents, users } from "@/db/schema";
import { eq, or } from "drizzle-orm";
import { verifyToken } from "@/lib/jwt";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const [row] = await db
      .select()
      .from(properties)
      .where(eq(properties.id, Number(id)));

    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(row);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch property" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json();
    const [updated] = await db
      .update(properties)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(properties.id, Number(id)))
      .returning();

    if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update property" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const token = req.cookies.get("token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let userId: number;
    try { userId = verifyToken(token).id; }
    catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }

    const { id } = await params;
    const propertyId = Number(id);

    const [property] = await db
      .select({ listedByAgentId: properties.listedByAgentId })
      .from(properties)
      .where(eq(properties.id, propertyId));

    if (!property) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Verify the requester owns this listing via their agent record
    if (property.listedByAgentId !== null) {
      const [user] = await db
        .select({ email: users.email })
        .from(users)
        .where(eq(users.id, userId));

      const [agent] = user ? await db
        .select({ id: agents.id })
        .from(agents)
        .where(or(eq(agents.userId, userId), eq(agents.email, user.email))) : [];

      if (!agent || agent.id !== property.listedByAgentId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    await db.delete(properties).where(eq(properties.id, propertyId));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to delete property" }, { status: 500 });
  }
}
