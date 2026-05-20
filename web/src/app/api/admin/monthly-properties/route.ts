import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import { db } from "@/db";
import { properties, soldProperties } from "@/db/schema";
import { count, and, eq, sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (payload.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const currentYear = new Date().getFullYear();

  const [soldByMonth, rentedByMonth, listedByMonth] = await Promise.all([
    db
      .select({
        month: sql<number>`extract(month from ${soldProperties.dateOfBuying})::int`,
        total: count(),
      })
      .from(soldProperties)
      .where(
        and(
          eq(soldProperties.transactionType, "bought"),
          sql`extract(year from ${soldProperties.dateOfBuying}) = ${currentYear}`
        )
      )
      .groupBy(sql`extract(month from ${soldProperties.dateOfBuying})`),

    db
      .select({
        month: sql<number>`extract(month from ${soldProperties.dateOfBuying})::int`,
        total: count(),
      })
      .from(soldProperties)
      .where(
        and(
          eq(soldProperties.transactionType, "rented"),
          sql`extract(year from ${soldProperties.dateOfBuying}) = ${currentYear}`
        )
      )
      .groupBy(sql`extract(month from ${soldProperties.dateOfBuying})`),

    db
      .select({
        month: sql<number>`extract(month from ${properties.createdAt})::int`,
        total: count(),
      })
      .from(properties)
      .where(sql`extract(year from ${properties.createdAt}) = ${currentYear}`)
      .groupBy(sql`extract(month from ${properties.createdAt})`),
  ]);

  const toMonthArray = (rows: { month: number; total: number }[]) => {
    const arr = new Array(12).fill(0);
    for (const row of rows) {
      arr[row.month - 1] = Number(row.total);
    }
    return arr;
  };

  return NextResponse.json({
    year: currentYear,
    sold: toMonthArray(soldByMonth),
    rented: toMonthArray(rentedByMonth),
    listed: toMonthArray(listedByMonth),
  });
}
