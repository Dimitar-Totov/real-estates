import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { pendingListings, properties, agents, messages } from "@/db/schema";
import { verifyToken } from "@/lib/jwt";
import type { NewProperty } from "@/db/schema";
import { S3Client, CopyObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

const r2 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_URL,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});
const BUCKET = process.env.R2_BUCKET!;
const PUBLIC_URL = process.env.R2_PUBLIC_URL!;

async function migrateImages(tmpUrls: string[], propertyId: number): Promise<string[]> {
  const newUrls: string[] = [];

  await Promise.all(
    tmpUrls.map(async (url) => {
      const srcKey = url.replace(`${PUBLIC_URL}/`, "");
      const filename = srcKey.split("/").pop()!;
      const destKey = `properties/${propertyId}/${filename}`;

      await r2.send(new CopyObjectCommand({
        Bucket: BUCKET,
        CopySource: `${BUCKET}/${srcKey}`,
        Key: destKey,
      }));

      await r2.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: srcKey }));

      newUrls.push(`${PUBLIC_URL}/${destKey}`);
    })
  );

  return newUrls;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = req.cookies.get("token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let userId: number;
  try { userId = verifyToken(token).id; }
  catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }

  const { id } = await params;
  const pendingId = Number(id);

  const [pending] = await db
    .select()
    .from(pendingListings)
    .where(eq(pendingListings.id, pendingId));

  if (!pending) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (pending.status !== "pending") {
    return NextResponse.json({ error: "Already reviewed" }, { status: 409 });
  }

  // Resolve the approving agent record from their user account
  const [agentRecord] = await db
    .select({ id: agents.id })
    .from(agents)
    .where(eq(agents.userId, userId));

  const listedByAgentId = agentRecord?.id ?? pending.agentId;

  // Insert the property from the stored JSONB data
  const [created] = await db
    .insert(properties)
    .values({
      ...(pending.propertyData as NewProperty),
      listedByAgentId,
    })
    .returning();

  // Migrate images from tmp to properties/{id}/
  const tmpImages: string[] = Array.isArray((pending.propertyData as NewProperty).images)
    ? ((pending.propertyData as NewProperty).images as string[])
    : [];

  if (tmpImages.length > 0) {
    const newUrls = await migrateImages(tmpImages, created.id);
    await db
      .update(properties)
      .set({ images: newUrls })
      .where(eq(properties.id, created.id));

    // Update the message body so image URLs point to the new permanent paths
    if (pending.messageId) {
      const [msg] = await db
        .select({ id: messages.id, message: messages.message })
        .from(messages)
        .where(eq(messages.id, pending.messageId));
      if (msg) {
        let updated = msg.message;
        tmpImages.forEach((oldUrl, i) => {
          updated = updated.replaceAll(oldUrl, newUrls[i]);
        });
        await db.update(messages).set({ message: updated }).where(eq(messages.id, msg.id));
      }
    }
  }

  // Mark the pending listing as approved
  await db
    .update(pendingListings)
    .set({ status: "approved", reviewedAt: new Date() })
    .where(eq(pendingListings.id, pendingId));

  return NextResponse.json({ success: true, propertyId: created.id });
}
