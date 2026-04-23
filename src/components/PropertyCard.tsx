import { Property } from "@/db/schema";
import Link from "next/link";

const STATUS_LABELS: Record<Property["status"], string> = {
  for_sale: "For Sale",
  for_rent: "For Rent",
  sold: "Sold",
  rented: "Rented",
};

const STATUS_COLORS: Record<Property["status"], string> = {
  for_sale: "bg-green-100 text-green-800",
  for_rent: "bg-blue-100 text-blue-800",
  sold: "bg-gray-100 text-gray-600",
  rented: "bg-gray-100 text-gray-600",
};

export default function PropertyCard({ property }: { property: Property }) {
  return (
    <Link
      href={`/properties/${property.id}`}
      className="block rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden hover:shadow-md transition-shadow"
    >
      <div className="bg-gray-100 dark:bg-gray-800 h-48 flex items-center justify-center text-gray-400 text-sm">
        No image
      </div>

      <div className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h2 className="font-semibold text-base leading-snug line-clamp-2">
            {property.title}
          </h2>
          <span
            className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[property.status]}`}
          >
            {STATUS_LABELS[property.status]}
          </span>
        </div>

        <p className="text-sm text-gray-500">
          {property.city}, {property.state}
        </p>

        <p className="text-lg font-bold">
          ${Number(property.price).toLocaleString()}
        </p>

        <div className="flex gap-4 text-sm text-gray-500">
          {property.bedrooms != null && <span>{property.bedrooms} bd</span>}
          {property.bathrooms != null && <span>{property.bathrooms} ba</span>}
          {property.squareFeet != null && (
            <span>{Number(property.squareFeet).toLocaleString()} sqft</span>
          )}
        </div>
      </div>
    </Link>
  );
}
