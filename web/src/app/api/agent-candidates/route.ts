import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import { db } from "@/db";
import { agentCandidates } from "@/db/schema";

export async function POST(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (payload.role !== "user") {
    return NextResponse.json(
      { error: "Only regular users can apply to become an agent" },
      { status: 403 }
    );
  }

  const { personalInfo, education, workExperience, skills, availability } = await req.json();

  await db.insert(agentCandidates).values({
    userId: payload.id,
    username: payload.username,
    personalInfo: personalInfo ?? null,
    education: education ?? null,
    workExperience: workExperience ?? null,
    skills: skills ?? null,
    availability: availability ?? null,
  });

  return NextResponse.json({ success: true });
}
