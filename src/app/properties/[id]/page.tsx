import { notFound } from "next/navigation";
import { getPropertyById } from "@/services/propertyService";
import TourBookingCard from "@/components/TourBookingCard";

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

  const status = STATUS_CONFIG[property.status];
  const seed   = property.id;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* ════════════════════════════════════════
          GALLERY
      ════════════════════════════════════════ */}
      <div className="flex flex-col lg:flex-row gap-3 lg:h-[500px] mb-8">

        {/* Hero image */}
        <div className="h-64 sm:h-80 lg:h-full lg:w-[65%] lg:shrink-0 overflow-hidden rounded-2xl lg:rounded-2xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://picsum.photos/seed/prop-${seed}-hero/900/600`}
            alt={property.title}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
          />
        </div>

        {/* Two side images */}
        <div className="flex flex-row lg:flex-col gap-3 h-44 sm:h-56 lg:h-full lg:flex-1">
          <div className="flex-1 overflow-hidden rounded-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://picsum.photos/seed/prop-${seed}-side1/600/400`}
              alt=""
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
            />
          </div>
          <div className="flex-1 overflow-hidden rounded-2xl relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://picsum.photos/seed/prop-${seed}-side2/600/400`}
              alt=""
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
            />
            <button className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm hover:bg-black/75 text-white text-xs font-semibold px-3.5 py-2 rounded-full transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
                <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
              </svg>
              83 photos
            </button>
          </div>
        </div>
      </div>

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
            <div className="shrink-0 hidden sm:block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://picsum.photos/seed/map-${seed}/200/120`}
                alt="Map"
                className="w-28 h-16 object-cover rounded-xl border border-gray-200 shadow-sm"
              />
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
                {" · "}
                <a href="#" className="text-teal-600 hover:underline font-medium">
                  Get pre-approved
                </a>
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
              <p>
                The property is situated in one of the most desirable pockets of the city, within walking
                distance to top-rated schools, boutique shopping, and an array of dining options. Public
                transit connections make commuting effortless, while the neighbourhood's tree-lined streets
                offer the kind of calm you rarely find so close to everything.
              </p>
              <p>
                Recent capital improvements include a full HVAC replacement, new roof, updated electrical
                panel, and energy-efficient double-glazed windows throughout — giving the next owner peace
                of mind and lower running costs from day one.
              </p>
              <p>
                Don't miss the opportunity to make this exceptional property your own. Homes of this
                calibre in this location are extremely rare and are expected to move quickly. Schedule a
                private showing today to experience it in person.
              </p>
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
            <TourBookingCard />

            {/* Agent card */}
            <div className="mt-4 bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex items-center gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://picsum.photos/seed/agent-${seed}/80/80`}
                alt="Agent"
                className="w-14 h-14 rounded-full object-cover border-2 border-gray-100 shrink-0"
              />
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 text-sm">Listed by</p>
                <p className="text-gray-700 font-medium truncate">Sarah Mitchell</p>
                <p className="text-xs text-gray-400">RealEstate · Top Agent</p>
              </div>
              <a
                href="tel:+15551234567"
                className="ml-auto shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-gray-600"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
