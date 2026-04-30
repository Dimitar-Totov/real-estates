import { Suspense } from "react";
import Link from "next/link";
import PropertyCard from "@/components/PropertyCard";
import PropertyFilters from "@/components/PropertyFilters";
import { MOCK_PROPERTIES } from "@/data/properties";

export const dynamic = "force-dynamic";

interface SearchParams {
  city?: string;
  type?: string;
  status?: string;
  minPrice?: string;
  maxPrice?: string;
  minBeds?: string;
  minBaths?: string;
}

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  const filtered = MOCK_PROPERTIES.filter((p) => {
    if (params.city     && !p.city.toLowerCase().includes(params.city.toLowerCase())) return false;
    if (params.type     && p.type   !== params.type)   return false;
    if (params.status   && p.status !== params.status) return false;
    if (params.minPrice && Number(p.price) < Number(params.minPrice)) return false;
    if (params.maxPrice && Number(p.price) > Number(params.maxPrice)) return false;
    if (params.minBeds  && (p.bedrooms  == null || p.bedrooms  < Number(params.minBeds)))  return false;
    if (params.minBaths && (p.bathrooms == null || p.bathrooms < Number(params.minBaths))) return false;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      {/* ── Page header ── */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Property Listings</h1>
        <p className="text-gray-400 mt-1.5 text-sm">
          Browse thousands of homes for sale and rent
        </p>
      </div>

      {/* ── Two-column layout ── */}
      <div className="flex flex-col md:flex-row gap-6 items-start">

        {/* ── Section 1: Filters sidebar ── */}
        <aside className="w-full md:w-72 shrink-0">
          <Suspense>
            <PropertyFilters />
          </Suspense>
        </aside>

        {/* ── Section 2: Results ── */}
        <section className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-5 h-9">
            <p className="text-sm text-gray-500">
              <span className="font-semibold text-gray-900">{filtered.length}</span>
              {" "}propert{filtered.length !== 1 ? "ies" : "y"} found
            </p>
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-gray-100 shadow-sm text-center">
              <svg className="w-16 h-16 mb-4 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={0.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75" />
              </svg>
              <p className="text-lg font-semibold text-gray-700 mb-1">No properties found</p>
              <p className="text-sm text-gray-400 mb-5">Try adjusting your filters or search area</p>
              <Link href="/listings" className="text-sm font-medium text-[#CC0000] hover:underline">
                Clear all filters
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {filtered.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
