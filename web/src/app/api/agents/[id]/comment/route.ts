import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import { db } from "@/db";
import { agentRatings } from "@/db/schema";
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

  if (payload.role === "admin") {
    return NextResponse.json({ error: "Admins cannot comment on agents" }, { status: 403 });
  }

  const { id } = await params;
  const agentId = parseInt(id, 10);
  if (isNaN(agentId)) return NextResponse.json({ error: "Invalid agent id" }, { status: 400 });

  const body = await req.json();
  const comment = typeof body.comment === "string" ? body.comment.trim() : null;
  if (!comment || comment.length === 0) {
    return NextResponse.json({ error: "Comment cannot be empty" }, { status: 400 });
  }
  if (comment.length > 500) {
    return NextResponse.json({ error: "Comment must be 500 characters or less" }, { status: 400 });
  }

  const [existing] = await db
    .select({ id: agentRatings.id })
    .from(agentRatings)
    .where(and(eq(agentRatings.agentId, agentId), eq(agentRatings.userId, payload.id)));

  if (!existing) {
    return NextResponse.json(
      { error: "You must rate the agent before leaving a comment" },
      { status: 409 }
    );
  }

  await db
    .update(agentRatings)
    .set({ comment, updatedAt: new Date() })
    .where(and(eq(agentRatings.agentId, agentId), eq(agentRatings.userId, payload.id)));

  return NextResponse.json({ comment });
}
