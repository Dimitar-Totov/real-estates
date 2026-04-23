import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { properties, NewProperty } from "@/db/schema";
import { ilike, and, SQL, sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const city = searchParams.get("city");
    const type = searchParams.get("type") as NewProperty["type"] | null;
    const status = searchParams.get("status") as NewProperty["status"] | null;

    const filters: SQL[] = [];
    if (city) filters.push(ilike(properties.city, `%${city}%`));
    if (type) filters.push(sql`${properties.type} = ${type}`);
    if (status) filters.push(sql`${properties.status} = ${status}`);

    const rows = await db
      .select()
      .from(properties)
      .where(filters.length > 0 ? and(...filters) : undefined)
      .orderBy(properties.createdAt);

    return NextResponse.json(rows);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch properties" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: NewProperty = await request.json();
    const [created] = await db.insert(properties).values(body).returning();
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create property" }, { status: 500 });
  }
}
