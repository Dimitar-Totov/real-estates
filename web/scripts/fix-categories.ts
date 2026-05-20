import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { properties } from "../src/db/schema";
import { eq, inArray } from "drizzle-orm";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

async function main() {
  // Delete the 12 seeded properties (ids 14-25)
  await db.delete(properties).where(inArray(properties.id, [14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25]));
  console.log("Deleted seeded properties 14-25.");

  // Assign categories to original properties based on title/price
  const assignments: Array<{ id: number; category: "luxury" | "affordable" | "development" | "standard" }> = [
    { id: 1,  category: "standard"    }, // Modern Family Home with Pool — $850k
    { id: 2,  category: "luxury"      }, // Downtown Luxury Apartment
    { id: 3,  category: "luxury"      }, // Beachfront Condo with Ocean Views — $1.25M
    { id: 4,  category: "affordable"  }, // Charming Townhouse Near Park — $2200/mo rent
    { id: 5,  category: "standard"    }, // Spacious Suburban House — $540k
    { id: 6,  category: "affordable"  }, // Studio Apartment in Arts District — $1450/mo
    { id: 7,  category: "luxury"      }, // Luxury Penthouse with Skyline Views — $4.2M
    { id: 8,  category: "standard"    }, // Commercial Retail Space
    { id: 9,  category: "affordable"  }, // Cozy Starter Home in Quiet Street — $310k
    { id: 10, category: "development" }, // Vacant Land — Build Your Dream Home
    { id: 11, category: "development" }, // Renovated Townhouse — Move-in Ready
    { id: 12, category: "affordable"  }, // Modern 1-Bed Apartment with Gym — $2750/mo
  ];

  for (const { id, category } of assignments) {
    await db.update(properties).set({ category }).where(eq(properties.id, id));
  }
  console.log("Categories assigned to original properties.");
}

main().catch((e) => { console.error(e); process.exit(1); });
