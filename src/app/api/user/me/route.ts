import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import { db } from "@/db";
import { users, profiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { cdnUrl } from "@/services/userImagesService";

type UserRow = {
  id: number;
  username: string;
  email: string;
  role: "user" | "admin" | "agent";
  avatarKey: string | null;
  coverKey: string | null;
  location: string | null;
  facebookUrl: string | null;
  linkedinUrl: string | null;
  twitterUrl: string | null;
};

type ProfileRow = {
  officePhone: string | null;
  mobilePhone: string | null;
  contactEmail: string | null;
} | null;

function buildResponse(user: UserRow, profile: ProfileRow) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    avatarUrl: user.avatarKey ? cdnUrl(user.avatarKey) : null,
    coverUrl: user.coverKey ? cdnUrl(user.coverKey) : null,
    location: user.location,
    facebookUrl: user.facebookUrl,
    linkedinUrl: user.linkedinUrl,
    twitterUrl: user.twitterUrl,
    officePhone: profile?.officePhone ?? null,
    mobilePhone: profile?.mobilePhone ?? null,
    contactEmail: profile?.contactEmail ?? null,
  };
}

async function fetchUserWithProfile(userId: number) {
  const rows = await db
    .select({
      id: users.id,
      username: users.username,
      email: users.email,
      role: users.role,
      avatarKey: users.avatarKey,
      coverKey: users.coverKey,
      location: users.location,
      facebookUrl: users.facebookUrl,
      linkedinUrl: users.linkedinUrl,
      twitterUrl: users.twitterUrl,
      officePhone: profiles.officePhone,
      mobilePhone: profiles.mobilePhone,
      contactEmail: profiles.contactEmail,
    })
    .from(users)
    .leftJoin(profiles, eq(profiles.userId, users.id))
    .where(eq(users.id, userId))
    .limit(1);
  return rows[0] ?? null;
}

export async function GET(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const row = await fetchUserWithProfile(payload.id);
  if (!row) return NextResponse.json({ error: "User not found" }, { status: 404 });

  return NextResponse.json(buildResponse(row, row));
}

export async function PATCH(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { location, facebookUrl, linkedinUrl, twitterUrl, officePhone, mobilePhone, contactEmail } = body;

  // Update users table only for fields that belong there
  const userUpdate: Partial<typeof users.$inferInsert> = {};
  if (location !== undefined) userUpdate.location = location || null;
  if (facebookUrl !== undefined) userUpdate.facebookUrl = facebookUrl || null;
  if (linkedinUrl !== undefined) userUpdate.linkedinUrl = linkedinUrl || null;
  if (twitterUrl !== undefined) userUpdate.twitterUrl = twitterUrl || null;

  if (Object.keys(userUpdate).length > 0) {
    await db.update(users).set(userUpdate).where(eq(users.id, payload.id));
  }

  // Upsert profile row — ON CONFLICT (user_id) DO UPDATE
  if (officePhone !== undefined || mobilePhone !== undefined || contactEmail !== undefined) {
    const profileInsert: typeof profiles.$inferInsert = {
      userId: payload.id,
      officePhone: officePhone !== undefined ? (officePhone || null) : null,
      mobilePhone: mobilePhone !== undefined ? (mobilePhone || null) : null,
      contactEmail: contactEmail !== undefined ? (contactEmail || null) : null,
      updatedAt: new Date(),
    };

    const profileUpdate: Partial<typeof profiles.$inferInsert> = { updatedAt: new Date() };
    if (officePhone !== undefined) profileUpdate.officePhone = officePhone || null;
    if (mobilePhone !== undefined) profileUpdate.mobilePhone = mobilePhone || null;
    if (contactEmail !== undefined) profileUpdate.contactEmail = contactEmail || null;

    await db
      .insert(profiles)
      .values(profileInsert)
      .onConflictDoUpdate({
        target: profiles.userId,
        set: profileUpdate,
      });
  }

  const row = await fetchUserWithProfile(payload.id);
  if (!row) return NextResponse.json({ error: "User not found" }, { status: 404 });

  return NextResponse.json(buildResponse(row, row));
}
