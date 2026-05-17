import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { getPropertyById } from "@/services/propertyService";
import { listPropertyImages } from "@/services/imagesService";
import TourBookingCard from "@/components/TourBookingCard";
import PropertyGallery from "@/components/PropertyGallery";
import PropertyAgentCard from "@/components/PropertyAgentCard";
import { db } from "@/db";
import { agents } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyToken } from "@/lib/jwt";

export const dynamic = "force-dynamic";

const STATUS_CONFIG = {
  for_sale: { label: "FOR SALE · ACTIVE",  dot: "bg-green-500" },
  for_rent: { label: "FOR RENT · ACTIVE",  dot: "bg-green-500" },
  sold:     { label: "SOLD",               dot: "bg-gray-400"  },
  rented:   { label: "RENTED",             dot: "bg-gray-400"  },
};

const TYPE_LABELS: Record<string, string> = {
  house:      "House",
  apartment:  "Apartment",
  condo:      "Condo",
  townhouse:  "Townhouse",
  land:       "Land",
  commercial: "Commercial",
};

function estimateMonthly(price: string) {
  return Math.round(Number(price) * 0.00688).toLocaleString();
}

export default async function PropertyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const property = await getPropertyById(Number(id));
  if (!property) notFound();

  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  let isAdmin = false;
  let currentUserId: number | null = null;
  if (token) {
    try {
      const payload = verifyToken(token);
      isAdmin = payload.role === "admin";
      currentUserId = payload.id;
    } catch { /* invalid token */ }
  }

  const status = STATUS_CONFIG[property.status];
  const images = await listPropertyImages(property.id, property.images);
  const seed = property.id;

  // Prefer the agent who approved the listing; fall back to a deterministic pick
  let agent: { id: number; userId: number | null; name: string } | null = null;
  if (property.listedByAgentId) {
    const [listed] = await db
      .select({ id: agents.id, userId: agents.userId, name: agents.name })
      .from(agents)
      .where(eq(agents.id, property.listedByAgentId));
    agent = listed ?? null;
  }
  if (!agent) {
    const allAgents = await db.select({ id: agents.id, userId: agents.userId, name: agents.name }).from(agents);
    agent = allAgents.length > 0 ? allAgents[property.id % allAgents.length] : null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* ════════════════════════════════════════
          GALLERY
      ════════════════════════════════════════ */}
      <PropertyGallery images={images} title={property.title} />

      {/* ════════════════════════════════════════
          INFO + SIDEBAR
      ════════════════════════════════════════ */}
      <div className="flex flex-col lg:flex-row gap-10">

        {/* ── LEFT: Main content ── */}
        <div className="flex-1 min-w-0 space-y-8">

          {/* 1. Status row */}
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${status.dot}`} />
            <span className="text-xs font-semibold tracking-widest text-gray-500 uppercase">
              {status.label}
            </span>
            <span className="mx-2 text-gray-200">·</span>
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
              {TYPE_LABELS[property.type]}
            </span>
          </div>

          {/* 2. Address + map thumbnail */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-snug">
                {property.address}
              </h1>
              <p className="text-gray-500 mt-1">
                {property.city}, {property.state} {property.zipCode}
              </p>
            </div>
          </div>

          {/* 3. Price + stats */}
          <div>
            <p className="text-3xl font-bold text-gray-900">
              ${Number(property.price).toLocaleString()}
              {property.status === "for_rent" && (
                <span className="text-lg font-normal text-gray-400 ml-1">/mo</span>
              )}
            </p>
            {property.status !== "for_rent" && (
              <p className="text-sm text-gray-400 mt-1">
                Est.{" "}
                <span className="font-medium text-gray-600">
                  ${estimateMonthly(property.price)}/mo
                </span>
              </p>
            )}

            {/* Stat chips */}
            {(property.bedrooms != null || property.bathrooms != null || property.squareFeet != null) && (
              <div className="flex flex-wrap items-center gap-0 mt-5 divide-x divide-gray-200 border border-gray-200 rounded-2xl overflow-hidden w-fit shadow-sm">
                {property.bedrooms != null && (
                  <div className="flex flex-col items-center px-6 py-3">
                    <span className="text-xl font-bold text-gray-900">{property.bedrooms}</span>
                    <span className="text-xs text-gray-400 font-medium mt-0.5">Beds</span>
                  </div>
                )}
                {property.bathrooms != null && (
                  <div className="flex flex-col items-center px-6 py-3">
                    <span className="text-xl font-bold text-gray-900">{property.bathrooms}</span>
                    <span className="text-xs text-gray-400 font-medium mt-0.5">Baths</span>
                  </div>
                )}
                {property.squareFeet != null && (
                  <div className="flex flex-col items-center px-6 py-3">
                    <span className="text-xl font-bold text-gray-900">
                      {Number(property.squareFeet).toLocaleString()}
                    </span>
                    <span className="text-xs text-gray-400 font-medium mt-0.5">Sq Ft</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 4. About this home */}
          <div className="border-t border-gray-100 pt-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">About this home</h2>
            <div className="space-y-4 text-gray-600 leading-relaxed text-[15px]">
              <p>{property.description}</p>
            </div>
          </div>

          {/* 5. Details grid */}
          <div className="border-t border-gray-100 pt-8">
            <h2 className="text-xl font-bold text-gray-900 mb-5">Property Details</h2>
            <dl className="grid grid-cols-2 sm:grid-cols-3 gap-y-5 gap-x-6">
              {[
                { label: "Type",       value: TYPE_LABELS[property.type] },
                { label: "Status",     value: STATUS_CONFIG[property.status].label },
                property.yearBuilt   && { label: "Year Built",  value: property.yearBuilt },
                property.lotSize     && { label: "Lot Size",    value: `${Number(property.lotSize).toLocaleString()} sqft` },
                property.garage      && { label: "Garage",      value: "Yes" },
                property.pool        && { label: "Pool",        value: "Yes" },
              ].filter(Boolean).map((item) => {
                const { label, value } = item as { label: string; value: string | number };
                return (
                  <div key={label}>
                    <dt className="text-xs font-semibold uppercase tracking-wider text-gray-400">{label}</dt>
                    <dd className="mt-1 text-sm font-medium text-gray-900">{value}</dd>
                  </div>
                );
              })}
            </dl>
          </div>
        </div>

        {/* ── RIGHT: Sticky sidebar ── */}
        <div className="lg:w-[360px] lg:shrink-0">
          <div className="lg:sticky lg:top-24">
            {!isAdmin && currentUserId !== agent?.userId && <TourBookingCard propertyId={property.id} />}

            <PropertyAgentCard
              seed={seed}
              agentName={agent?.name ?? "Top Agent"}
              agentUserId={agent?.userId ?? null}
              propertyTitle={property.title}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
