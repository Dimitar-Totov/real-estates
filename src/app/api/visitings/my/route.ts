import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import { db } from "@/db";
import { propertyVisitings, properties } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getPropertyCoverImage } from "@/services/imagesService";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await db
    .select({
      visitingId:     propertyVisitings.id,
      visitDate:      propertyVisitings.visitDate,
      hour:           propertyVisitings.hour,
      status:         propertyVisitings.status,
      createdAt:      propertyVisitings.createdAt,
      propertyId:     properties.id,
      title:          properties.title,
      address:        properties.address,
      city:           properties.city,
      state:          properties.state,
      price:          properties.price,
      propertyStatus: properties.status,
      type:           properties.type,
      bedrooms:       properties.bedrooms,
      bathrooms:      properties.bathrooms,
      squareFeet:     properties.squareFeet,
    })
    .from(propertyVisitings)
    .innerJoin(properties, eq(propertyVisitings.propertyId, properties.id))
    .where(eq(propertyVisitings.userId, payload.id))
    .orderBy(propertyVisitings.visitDate);

  const rowsWithCovers = await Promise.all(
    rows.map(async (row) => ({
      ...row,
      coverImage: await getPropertyCoverImage(row.propertyId),
    }))
  );

  return NextResponse.json(rowsWithCovers);
}
