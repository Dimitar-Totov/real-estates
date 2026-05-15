import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  await sql`DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'property_category') THEN
      CREATE TYPE "public"."property_category" AS ENUM('standard', 'luxury', 'affordable', 'development');
    END IF;
  END $$`;
  await sql`ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "category" "property_category" DEFAULT 'standard' NOT NULL`;
  console.log("Migration done.");
}

main().catch((e) => { console.error(e); process.exit(1); });
