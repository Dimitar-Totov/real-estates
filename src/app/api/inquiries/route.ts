import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { inquiries, NewInquiry } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const propertyId = searchParams.get("propertyId");

    const rows = propertyId
      ? await db.select().from(inquiries).where(eq(inquiries.propertyId, Number(propertyId)))
      : await db.select().from(inquiries).orderBy(inquiries.createdAt);

    return NextResponse.json(rows);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch inquiries" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: NewInquiry = await request.json();
    const [created] = await db.insert(inquiries).values(body).returning();
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create inquiry" }, { status: 500 });
  }
}
