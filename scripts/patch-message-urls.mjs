import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, "../.env.local") });

const sql = neon(process.env.DATABASE_URL);
const PUBLIC_URL = process.env.R2_PUBLIC_URL;

const MESSAGE_ID = 11;
const PROPERTY_ID = 28;

const [row] = await sql`SELECT message FROM messages WHERE id = ${MESSAGE_ID}`;
if (!row) { console.error("Message not found"); process.exit(1); }

let updated = row.message;
// Replace all tmp URLs with permanent ones — same filenames, different folder
updated = updated.replace(
  new RegExp(`${PUBLIC_URL.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/properties/tmp/\\d+/`, "g"),
  `${PUBLIC_URL}/properties/${PROPERTY_ID}/`
);

await sql`UPDATE messages SET message = ${updated} WHERE id = ${MESSAGE_ID}`;
console.log("Done. Updated image URLs in message", MESSAGE_ID);
console.log("\nNew image lines:");
updated.split("\n").filter(l => l.includes("r2.dev")).forEach(l => console.log(" ", l));
