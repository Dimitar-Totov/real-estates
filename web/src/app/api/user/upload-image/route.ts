import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  ALLOWED_CONTENT_TYPES,
  MAX_FILE_SIZE,
  cdnUrl,
  deleteUserImage,
  uploadBuffer,
  userImageKey,
  type AllowedContentType,
  type ImageType,
} from "@/services/userImagesService";

export async function POST(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data." }, { status: 400 });
  }

  const type = formData.get("type");
  const file = formData.get("file");

  if (type !== "avatar" && type !== "cover") {
    return NextResponse.json({ error: "type must be 'avatar' or 'cover'." }, { status: 400 });
  }

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }

  if (!ALLOWED_CONTENT_TYPES.includes(file.type as AllowedContentType)) {
    return NextResponse.json(
      { error: "File type not allowed. Use JPEG, PNG, or WebP." },
      { status: 400 },
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "File exceeds the 5 MB limit." }, { status: 400 });
  }

  const key = userImageKey(payload.id, type as ImageType);
  const buffer = Buffer.from(await file.arrayBuffer());

  await uploadBuffer(key, buffer, file.type as AllowedContentType);

  // Fetch old key before overwriting so we can delete it from R2.
  const [user] = await db
    .select({ avatarKey: users.avatarKey, coverKey: users.coverKey })
    .from(users)
    .where(eq(users.id, payload.id))
    .limit(1);

  const oldKey = type === "avatar" ? user?.avatarKey : user?.coverKey;

  await db
    .update(users)
    .set(type === "avatar" ? { avatarKey: key } : { coverKey: key })
    .where(eq(users.id, payload.id));

  // Same key means same object (re-upload) — skip delete.
  if (oldKey && oldKey !== key) {
    await deleteUserImage(oldKey).catch(() => {});
  }

  return NextResponse.json({ publicUrl: cdnUrl(key) });
}
