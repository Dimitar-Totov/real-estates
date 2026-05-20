import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import { db } from "@/db";
import { agentCandidates, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { cdnUrl } from "@/services/userImagesService";

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

  const rows = await db
    .select({
      id:            agentCandidates.id,
      userId:        agentCandidates.userId,
      username:      agentCandidates.username,
      avatarKey:     users.avatarKey,
      personalInfo:  agentCandidates.personalInfo,
      education:     agentCandidates.education,
      workExperience: agentCandidates.workExperience,
      skills:        agentCandidates.skills,
      availability:  agentCandidates.availability,
      createdAt:     agentCandidates.createdAt,
    })
    .from(agentCandidates)
    .leftJoin(users, eq(agentCandidates.userId, users.id))
    .orderBy(agentCandidates.createdAt);

  return NextResponse.json(
    rows.map((r) => ({
      id:            r.id,
      userId:        r.userId,
      username:      r.username,
      avatarUrl:     r.avatarKey ? cdnUrl(r.avatarKey) : null,
      personalInfo:  r.personalInfo,
      education:     r.education,
      workExperience: r.workExperience,
      skills:        r.skills,
      availability:  r.availability,
      createdAt:     r.createdAt.toISOString(),
    }))
  );
}
