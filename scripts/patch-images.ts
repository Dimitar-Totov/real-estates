/**
 * Patches the seeded properties (those with no images) with picsum placeholder images.
 * Uses the property id as the picsum seed so images are stable across runs.
 */
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { properties } from "../src/db/schema";
import { eq, isNull } from "drizzle-orm";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

async function main() {
  const rows = await db
    .select({ id: properties.id, images: properties.images })
    .from(properties);

  const toUpdate = rows.filter((r) => !r.images || r.images.length === 0);
  console.log(`Patching ${toUpdate.length} properties with placeholder images…`);

  for (const row of toUpdate) {
    const imgs = [
      `https://picsum.photos/seed/prop-${row.id}-a/800/600`,
      `https://picsum.photos/seed/prop-${row.id}-b/800/600`,
      `https://picsum.photos/seed/prop-${row.id}-c/800/600`,
    ];
    await db
      .update(properties)
      .set({ images: imgs })
      .where(eq(properties.id, row.id));
  }

  console.log("Done.");
}

main().catch((e) => { console.error(e); process.exit(1); });
