import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import { db } from "@/db";
import { agents, agentRatings } from "@/db/schema";
import { eq, and, avg, count } from "drizzle-orm";

export async function POST(
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
    return NextResponse.json({ error: "Admins cannot rate agents" }, { status: 403 });
  }

  const { id } = await params;
  const agentId = parseInt(id, 10);
  if (isNaN(agentId)) return NextResponse.json({ error: "Invalid agent id" }, { status: 400 });

  const body = await req.json();
  const rating = Number(body.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 6) {
    return NextResponse.json({ error: "Rating must be 1–6" }, { status: 400 });
  }

  // One rating per user per agent — reject if already submitted
  const [existing] = await db
    .select({ id: agentRatings.id })
    .from(agentRatings)
    .where(and(eq(agentRatings.agentId, agentId), eq(agentRatings.userId, payload.id)));

  if (existing) {
    return NextResponse.json({ error: "You have already rated this agent" }, { status: 409 });
  }

  await db.insert(agentRatings).values({ agentId, userId: payload.id, rating });

  // Recalculate the agent's average rating and review count from the ratings table
  const [stats] = await db
    .select({
      avgRating: avg(agentRatings.rating),
      totalReviews: count(agentRatings.id),
    })
    .from(agentRatings)
    .where(eq(agentRatings.agentId, agentId));

  const newAvg = stats.avgRating ? Number(Number(stats.avgRating).toFixed(1)) : rating;
  const newReviews = Number(stats.totalReviews);

  await db
    .update(agents)
    .set({
      rating: String(newAvg),
      reviews: newReviews,
    })
    .where(eq(agents.id, agentId));

  return NextResponse.json({ rating: newAvg, reviews: newReviews });
}
