import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import { db } from "@/db";
import { propertyVisitings } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) return NextResponse.json({ booked: false });

  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    return NextResponse.json({ booked: false });
  }

  const propertyId = Number(req.nextUrl.searchParams.get("propertyId"));
  if (!propertyId) return NextResponse.json({ booked: false });

  const existing = await db
    .select({ id: propertyVisitings.id, visitDate: propertyVisitings.visitDate, hour: propertyVisitings.hour })
    .from(propertyVisitings)
    .where(and(eq(propertyVisitings.userId, payload.id), eq(propertyVisitings.propertyId, propertyId)))
    .limit(1);

  if (existing.length === 0) return NextResponse.json({ booked: false });

  return NextResponse.json({ booked: true, visitDate: existing[0].visitDate, hour: existing[0].hour });
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { propertyId, visitDate, hour } = body;

  if (!propertyId || !visitDate || hour == null) {
    return NextResponse.json({ error: "propertyId, visitDate and hour are required" }, { status: 400 });
  }

  if (hour < 8 || hour > 17) {
    return NextResponse.json({ error: "Hour must be between 8 and 17" }, { status: 400 });
  }

  const date = new Date(visitDate);
  if (isNaN(date.getTime())) {
    return NextResponse.json({ error: "Invalid visitDate" }, { status: 400 });
  }

  // Prevent duplicate booking for same user, property, date and hour
  const existing = await db
    .select({ id: propertyVisitings.id })
    .from(propertyVisitings)
    .where(
      and(
        eq(propertyVisitings.userId, payload.id),
        eq(propertyVisitings.propertyId, propertyId),
        eq(propertyVisitings.visitDate, date),
        eq(propertyVisitings.hour, hour),
      )
    )
    .limit(1);

  if (existing.length > 0) {
    return NextResponse.json(
      { error: "You already have a showing booked for this property at this date and time" },
      { status: 409 }
    );
  }

  const [visiting] = await db
    .insert(propertyVisitings)
    .values({
      userId: payload.id,
      propertyId,
      visitDate: date,
      hour,
    })
    .returning();

  return NextResponse.json(visiting, { status: 201 });
}
