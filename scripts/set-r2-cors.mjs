import { S3Client, PutBucketCorsCommand } from "@aws-sdk/client-s3";
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

await r2.send(
  new PutBucketCorsCommand({
    Bucket: process.env.R2_BUCKET,
    CORSConfiguration: {
      CORSRules: [
        {
          // Presigned URLs are already the security mechanism (5-min expiry + signature).
          // Allowing * here does not grant any extra access.
          AllowedOrigins: ["*"],
          AllowedMethods: ["PUT"],
          AllowedHeaders: ["Content-Type"],
          MaxAgeSeconds: 3600,
        },
      ],
    },
  })
);

console.log("✓ CORS applied to bucket:", process.env.R2_BUCKET);
