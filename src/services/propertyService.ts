import { db } from "@/db";
import { properties } from "@/db/schema";
import { and, desc, eq, gte, ilike, lte, or, SQL } from "drizzle-orm";
import type { Property } from "@/db/schema";

const VALID_TYPES = new Set<Property["type"]>(["house", "apartment", "condo", "townhouse", "land", "commercial"]);
const VALID_STATUSES = new Set<Property["status"]>(["for_sale", "for_rent", "sold", "rented"]);
const VALID_CATEGORIES = new Set<Property["category"]>(["standard", "luxury", "affordable", "development"]);

export interface PropertyFilters {
  city?: string;
  type?: string;
  status?: string;
  minPrice?: string;
  maxPrice?: string;
  minBeds?: string;
  minBaths?: string;
  sort?: string;
}

export async function getAllProperties(filters: PropertyFilters = {}): Promise<Property[]> {
  const conditions: SQL[] = [];

  if (filters.city) conditions.push(ilike(properties.city, `%${filters.city}%`));

  // type param can be a real DB type OR a category alias
  if (filters.type) {
    if (VALID_CATEGORIES.has(filters.type as Property["category"])) {
      conditions.push(eq(properties.category, filters.type as Property["category"]));
    } else if (VALID_TYPES.has(filters.type as Property["type"])) {
      conditions.push(eq(properties.type, filters.type as Property["type"]));
    }
  }

  if (filters.status && VALID_STATUSES.has(filters.status as Property["status"])) {
    conditions.push(eq(properties.status, filters.status as Property["status"]));
  }
  if (filters.minPrice) conditions.push(gte(properties.price, filters.minPrice));
  if (filters.maxPrice) conditions.push(lte(properties.price, filters.maxPrice));
  if (filters.minBeds)  conditions.push(gte(properties.bedrooms, Number(filters.minBeds)));
  if (filters.minBaths) conditions.push(gte(properties.bathrooms, Number(filters.minBaths)));

  const query = db
    .select()
    .from(properties)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  if (filters.sort === "newest") {
    return query.orderBy(desc(properties.createdAt)).limit(5);
  }

  return query.orderBy(properties.createdAt);
}

export async function getPropertyById(id: number): Promise<Property | null> {
  const [row] = await db
    .select()
    .from(properties)
    .where(eq(properties.id, id));
  return row ?? null;
}

export async function searchProperties(query: string, status?: string): Promise<Property[]> {
  const term = `%${query}%`;
  const conditions: SQL[] = [
    or(
      ilike(properties.city, term),
      ilike(properties.address, term),
      ilike(properties.state, term),
      ilike(properties.zipCode, term),
      ilike(properties.title, term),
    )!,
  ];

  if (status) conditions.push(eq(properties.status, status as Property["status"]));

  return db
    .select()
    .from(properties)
    .where(and(...conditions))
    .orderBy(properties.createdAt);
}
