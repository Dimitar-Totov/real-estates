import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { propertyVisitings } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const propertyId = Number(req.nextUrl.searchParams.get("propertyId"));
  if (!propertyId) return NextResponse.json([]);

  const slots = await db
    .select({ visitDate: propertyVisitings.visitDate, hour: propertyVisitings.hour })
    .from(propertyVisitings)
    .where(and(
      eq(propertyVisitings.propertyId, propertyId),
      eq(propertyVisitings.status, "confirmed"),
    ));

  return NextResponse.json(slots);
}
