import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";

config({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL);

async function run(label, query) {
  try {
    await query();
    console.log(`✓ ${label}`);
  } catch (e) {
    if (e.code === "42710" || e.code === "42701" || e.code === "42P07") {
      console.log(`  skip (already exists): ${label}`);
    } else {
      console.error(`✗ ${label}:`, e.message);
      process.exit(1);
    }
  }
}

await run("create enum pending_listing_status", () => sql`
  CREATE TYPE "public"."pending_listing_status" AS ENUM('pending', 'approved', 'declined')
`);

await run("create table pending_listings", () => sql`
  CREATE TABLE "pending_listings" (
    "id" serial PRIMARY KEY NOT NULL,
    "message_id" integer,
    "agent_id" integer NOT NULL,
    "submitted_by" integer,
    "status" "pending_listing_status" DEFAULT 'pending' NOT NULL,
    "property_data" jsonb NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "reviewed_at" timestamp
  )
`);

await run("add column listed_by_agent_id to properties", () => sql`
  ALTER TABLE "properties" ADD COLUMN "listed_by_agent_id" integer
`);

await run("fk pending_listings.message_id", () => sql`
  ALTER TABLE "pending_listings" ADD CONSTRAINT "pending_listings_message_id_messages_id_fk"
    FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE SET NULL
`);

await run("fk pending_listings.agent_id", () => sql`
  ALTER TABLE "pending_listings" ADD CONSTRAINT "pending_listings_agent_id_agents_id_fk"
    FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE CASCADE
`);

await run("fk pending_listings.submitted_by", () => sql`
  ALTER TABLE "pending_listings" ADD CONSTRAINT "pending_listings_submitted_by_users_id_fk"
    FOREIGN KEY ("submitted_by") REFERENCES "public"."users"("id") ON DELETE SET NULL
`);

await run("fk properties.listed_by_agent_id", () => sql`
  ALTER TABLE "properties" ADD CONSTRAINT "properties_listed_by_agent_id_agents_id_fk"
    FOREIGN KEY ("listed_by_agent_id") REFERENCES "public"."agents"("id") ON DELETE SET NULL
`);

console.log("\n✓ Migration complete");
