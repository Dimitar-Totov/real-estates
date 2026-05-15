import { NextResponse } from "next/server";
import { db } from "@/db";
import { agents } from "@/db/schema";

export async function GET() {
  const rows = await db
    .select({
      id:         agents.id,
      userId:     agents.userId,
      name:       agents.name,
      specialty:  agents.specialty,
      city:       agents.city,
      image:      agents.image,
      rating:     agents.rating,
      reviews:    agents.reviews,
      experience: agents.experience,
      phone:      agents.phone,
      email:      agents.email,
    })
    .from(agents)
    .orderBy(agents.createdAt);

  return NextResponse.json(rows);
}
