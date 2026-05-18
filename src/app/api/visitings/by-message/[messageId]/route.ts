import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import { db } from "@/db";
import { propertyVisitings } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  const token = req.cookies.get("token")?.value;
  if (!token) return NextResponse.json(null);

  try {
    verifyToken(token);
  } catch {
    return NextResponse.json(null);
  }

  const { messageId } = await params;
  const msgId = Number(messageId);
  if (!msgId) return NextResponse.json(null);

  const [visiting] = await db
    .select({
      id: propertyVisitings.id,
      status: propertyVisitings.status,
      visitDate: propertyVisitings.visitDate,
      hour: propertyVisitings.hour,
      propertyId: propertyVisitings.propertyId,
    })
    .from(propertyVisitings)
    .where(eq(propertyVisitings.messageId, msgId))
    .limit(1);

  return NextResponse.json(visiting ?? null);
}
