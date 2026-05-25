import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { agents, users } from "@/db/schema";
import { cdnUrl } from "@/services/userImagesService";

export async function GET() {
  const rows = await db
    .select({
      id:         agents.id,
      userId:     agents.userId,
      name:       agents.name,
      specialty:  agents.specialty,
      city:       agents.city,
      image:      agents.image,
      avatarKey:  users.avatarKey,
      rating:     agents.rating,
      reviews:    agents.reviews,
      experience: agents.experience,
      phone:      agents.phone,
      email:      agents.email,
    })
    .from(agents)
    .leftJoin(users, eq(agents.userId, users.id))
    .orderBy(agents.createdAt);

  return NextResponse.json(
    rows.map((r) => ({
      ...r,
      image: r.avatarKey ? cdnUrl(r.avatarKey) : r.image,
      avatarKey: undefined,
    }))
  );
}
