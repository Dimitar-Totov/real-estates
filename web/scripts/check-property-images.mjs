import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, "../.env.local") });

const r2 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_URL,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const BUCKET = process.env.R2_BUCKET;
const PUBLIC_URL = process.env.R2_PUBLIC_URL;
const PROPERTY_ID = 28;

// List files in properties/28/
const res = await r2.send(new ListObjectsV2Command({
  Bucket: BUCKET,
  Prefix: `properties/${PROPERTY_ID}/`,
}));
console.log(`\nFiles in R2 properties/${PROPERTY_ID}/:`);
if (!res.Contents?.length) {
  console.log("  (none)");
} else {
  res.Contents.forEach(obj => console.log(" ", obj.Key));
}

// List files in properties/tmp/
const tmp = await r2.send(new ListObjectsV2Command({
  Bucket: BUCKET,
  Prefix: `properties/tmp/`,
}));
console.log(`\nFiles in R2 properties/tmp/:`);
if (!tmp.Contents?.length) {
  console.log("  (none)");
} else {
  tmp.Contents.forEach(obj => console.log(" ", obj.Key));
}

// Check message body
const sql = neon(process.env.DATABASE_URL);
const rows = await sql`
  SELECT m.id, m.message
  FROM messages m
  JOIN pending_listings pl ON pl.message_id = m.id
  WHERE pl.status = 'approved'
  ORDER BY pl.id DESC
  LIMIT 1
`;
if (rows.length) {
  console.log(`\nMessage id ${rows[0].id} body (image lines):`);
  rows[0].message.split("\n").filter(l => l.includes("r2.dev")).forEach(l => console.log(" ", l));
} else {
  console.log("\nNo approved pending listing with a message found.");
}
