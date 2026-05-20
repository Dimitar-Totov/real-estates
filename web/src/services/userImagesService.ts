import { S3Client, DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";

const r2 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_URL,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.R2_BUCKET!;
const CDN = process.env.R2_PUBLIC_URL!;

export type ImageType = "avatar" | "cover";

export const ALLOWED_CONTENT_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export type AllowedContentType = (typeof ALLOWED_CONTENT_TYPES)[number];

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export function userImageKey(userId: number, type: ImageType): string {
  return `users/${userId}/${type}`;
}

export function cdnUrl(key: string): string {
  return `${CDN}/${key}`;
}

export async function uploadBuffer(
  key: string,
  buffer: Buffer,
  contentType: AllowedContentType,
): Promise<void> {
  await r2.send(
    new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: buffer, ContentType: contentType }),
  );
}

export async function deleteUserImage(key: string): Promise<void> {
  await r2.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}
