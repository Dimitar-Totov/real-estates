import { S3Client, PutObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";

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

export async function uploadPropertyImage(
  propertyId: number,
  file: Buffer,
  fileName: string,
  contentType: string
): Promise<string> {
  const key = `${propertyId}/${fileName}`;

  await r2.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: file,
      ContentType: contentType,
    })
  );

  return `${PUBLIC_URL}/${key}`;
}

export async function listPropertyImages(
  propertyId: number,
  fallbackImages?: string[] | null,
): Promise<string[]> {
  const prefix = `${propertyId}/`;

  const response = await r2.send(
    new ListObjectsV2Command({
      Bucket: BUCKET,
      Prefix: prefix,
      StartAfter: prefix,
    })
  );

  const r2Images = (response.Contents ?? []).map((obj) => `${PUBLIC_URL}/${obj.Key!}`);
  if (r2Images.length > 0) return r2Images;
  return fallbackImages ?? [];
}

export async function getPropertyCoverImage(
  propertyId: number,
  fallbackImages?: string[] | null,
): Promise<string | null> {
  const prefix = `${propertyId}/`;

  const response = await r2.send(
    new ListObjectsV2Command({
      Bucket: BUCKET,
      Prefix: prefix,
      // StartAfter skips any folder-marker object (key === prefix) so
      // MaxKeys: 1 reliably returns the first real file.
      StartAfter: prefix,
      MaxKeys: 1,
    })
  );

  const first = response.Contents?.[0];
  if (first?.Key) return `${PUBLIC_URL}/${first.Key}`;
  return fallbackImages?.[0] ?? null;
}

export async function countPropertyImages(propertyId: number): Promise<number> {
  const prefix = `${propertyId}/`;

  const response = await r2.send(
    new ListObjectsV2Command({
      Bucket: BUCKET,
      Prefix: prefix,
      StartAfter: prefix,
    })
  );

  return response.Contents?.length ?? 0;
}
