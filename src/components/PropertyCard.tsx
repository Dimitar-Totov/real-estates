import { Property } from "@/db/schema";
import Link from "next/link";

const STATUS_LABELS: Record<Property["status"], string> = {
  for_sale: "For Sale",
  for_rent: "For Rent",
  sold:     "Sold",
  rented:   "Rented",
};

const STATUS_COLORS: Record<Property["status"], string> = {
  for_sale: "bg-emerald-500 text-white",
  for_rent: "bg-blue-500 text-white",
  sold:     "bg-gray-400 text-white",
  rented:   "bg-gray-400 text-white",
};

export default function PropertyCard({ property }: { property: Property }) {
  return (
    <Link
      href={`/properties/${property.id}`}
      className="group flex flex-col rounded-2xl overflow-hidden bg-white border border-gray-100 shadow-sm hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300"
    >
      {/* ── Image area ── */}
      <div className="relative h-52 bg-gradient-to-br from-slate-100 via-gray-50 to-slate-200 overflow-hidden flex items-center justify-center">
        <svg
          className="w-20 h-20 text-gray-200 group-hover:scale-110 transition-transform duration-500"
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={0.8}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
        </svg>

        {/* Status badge */}
        <span className={`absolute top-3 left-3 text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLORS[property.status]}`}>
          {STATUS_LABELS[property.status]}
        </span>

        {/* Type badge */}
        <span className="absolute top-3 right-3 bg-black/25 backdrop-blur-sm text-white text-xs font-medium px-2.5 py-1 rounded-full capitalize">
          {property.type.replace("_", " ")}
        </span>

        {/* Hover tint */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/[0.04] transition-colors duration-300" />
      </div>

      {/* ── Content ── */}
      <div className="flex flex-col flex-1 p-4 gap-1.5">

        {/* Price */}
        <p className="text-xl font-bold text-[#CC0000] leading-tight">
          ${Number(property.price).toLocaleString()}
          {property.status === "for_rent" && (
            <span className="text-sm font-normal text-gray-400 ml-0.5">/mo</span>
          )}
        </p>

        {/* Title */}
        <h2 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-1">
          {property.title}
        </h2>

        {/* Location */}
        <p className="flex items-center gap-1 text-xs text-gray-400">
          <svg className="w-3.5 h-3.5 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"/>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"/>
          </svg>
          {property.address}, {property.city}, {property.state}
        </p>

        {/* Stats row */}
        <div className="mt-auto pt-3 border-t border-gray-100 flex items-center gap-4 text-sm text-gray-500">
          {property.bedrooms != null && (
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"/>
              </svg>
              {property.bedrooms} bd
            </span>
          )}
          {property.bathrooms != null && (
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              {property.bathrooms} ba
            </span>
          )}
          {property.squareFeet != null && (
            <span className="flex items-center gap-1.5 ml-auto text-xs text-gray-400">
              <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15"/>
              </svg>
              {Number(property.squareFeet).toLocaleString()} sqft
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
