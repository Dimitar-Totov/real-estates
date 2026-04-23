import { db } from "@/db";
import { properties } from "@/db/schema";
import { desc } from "drizzle-orm";
import PropertyCard from "@/components/PropertyCard";
import SearchFilters from "@/components/SearchFilters";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

interface SearchParams {
  city?: string;
  type?: string;
  status?: string;
}

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  const rows = await db
    .select()
    .from(properties)
    .orderBy(desc(properties.createdAt));

  const filtered = rows.filter((p) => {
    if (params.city && !p.city.toLowerCase().includes(params.city.toLowerCase()))
      return false;
    if (params.type && p.type !== params.type) return false;
    if (params.status && p.status !== params.status) return false;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Property Listings</h1>
        <span className="text-sm text-gray-500">
          {filtered.length} result{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      <Suspense>
        <SearchFilters />
      </Suspense>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg">No properties found.</p>
          <a
            href="/properties/new"
            className="mt-4 inline-block text-blue-600 hover:underline"
          >
            Add the first property →
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      )}
    </div>
  );
}
