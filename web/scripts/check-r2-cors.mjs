import { S3Client, GetBucketCorsCommand } from "@aws-sdk/client-s3";
import { config } from "dotenv";

config({ path: ".env.local" });

const r2 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_URL,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

try {
  const res = await r2.send(new GetBucketCorsCommand({ Bucket: process.env.R2_BUCKET }));
  console.log("Current CORS rules:", JSON.stringify(res.CORSRules, null, 2));
} catch (e) {
  console.log("No CORS rules set (or access denied):", e.message);
}
