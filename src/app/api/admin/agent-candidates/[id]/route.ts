import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import { db } from "@/db";
import { agentCandidates, agents, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { cdnUrl } from "@/services/userImagesService";

async function guard(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) return null;
  try {
    const p = verifyToken(token);
    return p.role === "admin" ? p : null;
  } catch {
    return null;
  }
}

// POST /api/admin/agent-candidates/[id] → accept (body: { specialty })
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await guard(req))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const candidateId = Number(id);
  const { specialty } = await req.json();

  if (!specialty) {
    return NextResponse.json({ error: "Specialty is required" }, { status: 400 });
  }

  // Load candidate
  const [candidate] = await db
    .select()
    .from(agentCandidates)
    .where(eq(agentCandidates.id, candidateId))
    .limit(1);

  if (!candidate) {
    return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
  }

  // Load user for email + avatar
  const [user] = await db
    .select({ email: users.email, avatarKey: users.avatarKey, role: users.role, location: users.location })
    .from(users)
    .where(eq(users.id, candidate.userId))
    .limit(1);

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (user.role === "agent") {
    return NextResponse.json({ error: "User is already an agent" }, { status: 409 });
  }

  await db.insert(agents).values({
    userId:     candidate.userId,
    name:       candidate.username,
    specialty,
    city:       user.location || "Unknown",
    image:      user.avatarKey ? cdnUrl(user.avatarKey) : "",
    rating:     "5.0",
    reviews:    0,
    experience: 0,
    phone:      "",
    email:      user.email,
    featured:   false,
  });

  await db.update(users).set({ role: "agent" }).where(eq(users.id, candidate.userId));
  await db.delete(agentCandidates).where(eq(agentCandidates.id, candidateId));

  return NextResponse.json({ success: true });
}

// DELETE /api/admin/agent-candidates/[id] → decline
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await guard(req))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  await db.delete(agentCandidates).where(eq(agentCandidates.id, Number(id)));

  return NextResponse.json({ success: true });
}
