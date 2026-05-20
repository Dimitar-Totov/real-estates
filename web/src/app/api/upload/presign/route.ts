import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { verifyToken } from "@/lib/jwt";

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
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

function guessType(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase();
  const map: Record<string, string> = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", gif: "image/gif" };
  return map[ext ?? ""] ?? "";
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let userId: number;
  try {
    userId = verifyToken(token).id;
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { files } = (await req.json()) as {
    files: { name: string; contentType: string }[];
  };

  if (!Array.isArray(files) || files.length === 0 || files.length > 20) {
    return NextResponse.json({ error: "1–20 files required" }, { status: 400 });
  }

  for (const f of files) {
    const type = f.contentType || guessType(f.name);
    if (!ALLOWED.has(type)) {
      return NextResponse.json(
        { error: `Unsupported type: ${f.contentType} (${f.name})` },
        { status: 400 }
      );
    }
    f.contentType = type;
  }

  const uploads = await Promise.all(
    files.map(async ({ name, contentType }, i) => {
      const safe = name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const key = `properties/tmp/${userId}/${Date.now()}-${i}-${safe}`;
      const cmd = new PutObjectCommand({ Bucket: BUCKET, Key: key, ContentType: contentType });
      // URL expires in 5 minutes — cannot be reused after that
      const presignedUrl = await getSignedUrl(r2, cmd, { expiresIn: 300 });
      return { key, presignedUrl, publicUrl: `${PUBLIC_URL}/${key}` };
    })
  );

  return NextResponse.json({ uploads });
}
