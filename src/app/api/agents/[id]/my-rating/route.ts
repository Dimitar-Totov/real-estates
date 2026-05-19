import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import { db } from "@/db";
import { agentRatings } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = req.cookies.get("token")?.value;
  if (!token) return NextResponse.json({ rating: null });

  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    return NextResponse.json({ rating: null });
  }

  const { id } = await params;
  const agentId = parseInt(id, 10);
  if (isNaN(agentId)) return NextResponse.json({ rating: null });

  const [row] = await db
    .select({ rating: agentRatings.rating, comment: agentRatings.comment })
    .from(agentRatings)
    .where(and(eq(agentRatings.agentId, agentId), eq(agentRatings.userId, payload.id)));

  return NextResponse.json({ rating: row?.rating ?? null, comment: row?.comment ?? null });
}
