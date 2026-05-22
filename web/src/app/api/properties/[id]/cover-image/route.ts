import { NextRequest, NextResponse } from "next/server";
import { getPropertyCoverImage } from "@/services/imagesService";
import { db } from "@/db";
import { properties } from "@/db/schema";
import { eq } from "drizzle-orm";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;

  const [row] = await db
    .select({ images: properties.images })
    .from(properties)
    .where(eq(properties.id, Number(id)));

  if (!row) return NextResponse.json({ coverImage: null });

  const coverImage = await getPropertyCoverImage(Number(id), row.images);
  return NextResponse.json({ coverImage });
}
