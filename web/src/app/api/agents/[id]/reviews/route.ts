import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { agentRatings, users } from "@/db/schema";
import { eq, and, isNotNull, count, desc } from "drizzle-orm";

const PAGE_SIZE = 6;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const agentId = parseInt(id, 10);
  if (isNaN(agentId)) {
    return NextResponse.json({ reviews: [], total: 0, pages: 1, page: 1 });
  }

  const url = new URL(req.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
  const offset = (page - 1) * PAGE_SIZE;

  const condition = and(
    eq(agentRatings.agentId, agentId),
    isNotNull(agentRatings.comment)
  );

  const [countResult] = await db
    .select({ total: count() })
    .from(agentRatings)
    .where(condition);

  const total = countResult?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const rows = await db
    .select({
      id: agentRatings.id,
      rating: agentRatings.rating,
      comment: agentRatings.comment,
      createdAt: agentRatings.createdAt,
      username: users.username,
    })
    .from(agentRatings)
    .innerJoin(users, eq(agentRatings.userId, users.id))
    .where(condition)
    .orderBy(desc(agentRatings.createdAt))
    .limit(PAGE_SIZE)
    .offset(offset);

  return NextResponse.json({ reviews: rows, total, pages, page });
}
