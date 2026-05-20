import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { pendingListings } from "@/db/schema";
import { verifyToken } from "@/lib/jwt";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = req.cookies.get("token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try { verifyToken(token); }
  catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }

  const { id } = await params;
  const pendingId = Number(id);

  const [pending] = await db
    .select({ id: pendingListings.id, status: pendingListings.status })
    .from(pendingListings)
    .where(eq(pendingListings.id, pendingId));

  if (!pending) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (pending.status !== "pending") {
    return NextResponse.json({ error: "Already reviewed" }, { status: 409 });
  }

  await db
    .update(pendingListings)
    .set({ status: "declined", reviewedAt: new Date() })
    .where(eq(pendingListings.id, pendingId));

  return NextResponse.json({ success: true });
}
