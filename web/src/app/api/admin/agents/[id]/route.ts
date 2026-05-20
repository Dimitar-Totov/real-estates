import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import { db } from "@/db";
import { agents, users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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

  const { id } = await params;
  const agentId = parseInt(id, 10);
  if (isNaN(agentId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const [agent] = await db
    .select({ userId: agents.userId, email: agents.email })
    .from(agents)
    .where(eq(agents.id, agentId));

  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  await db.delete(agents).where(eq(agents.id, agentId));

  // Revert role — use userId when available (all agents created via the UI have it),
  // fall back to email match for legacy seeded rows
  if (agent.userId) {
    await db.update(users).set({ role: "user" }).where(eq(users.id, agent.userId));
  } else {
    await db.update(users).set({ role: "user" }).where(eq(users.email, agent.email));
  }

  return NextResponse.json({ success: true });
}
