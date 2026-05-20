import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { pendingListings } from "@/db/schema";
import { verifyToken } from "@/lib/jwt";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  const token = req.cookies.get("token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try { verifyToken(token); } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }

  const { messageId } = await params;
  const id = Number(messageId);
  if (!id) return NextResponse.json(null);

  const [row] = await db
    .select({ id: pendingListings.id, status: pendingListings.status, propertyData: pendingListings.propertyData })
    .from(pendingListings)
    .where(eq(pendingListings.messageId, id));

  return NextResponse.json(row ?? null);
}
