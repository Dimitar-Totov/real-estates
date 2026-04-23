import { db } from "@/db";
import { properties } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import InquiryForm from "@/components/InquiryForm";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, string> = {
  for_sale: "For Sale",
  for_rent: "For Rent",
  sold: "Sold",
  rented: "Rented",
};

const TYPE_LABELS: Record<string, string> = {
  house: "House",
  apartment: "Apartment",
  condo: "Condo",
  townhouse: "Townhouse",
  land: "Land",
  commercial: "Commercial",
};

export default async function PropertyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [property] = await db
    .select()
    .from(properties)
    .where(eq(properties.id, Number(id)));

  if (!property) notFound();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <div className="bg-gray-100 dark:bg-gray-800 rounded-xl h-72 flex items-center justify-center text-gray-400">
        No image
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-2xl font-bold">{property.title}</h1>
            <span className="shrink-0 text-sm font-medium bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
              {STATUS_LABELS[property.status] ?? property.status}
            </span>
          </div>

          <p className="text-gray-500">
            {property.address}, {property.city}, {property.state}{" "}
            {property.zipCode}
          </p>

          <p className="text-3xl font-bold">
            ${Number(property.price).toLocaleString()}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm border-t border-gray-200 dark:border-gray-700 pt-4">
            <div>
              <p className="text-gray-400">Type</p>
              <p className="font-medium">
                {TYPE_LABELS[property.type] ?? property.type}
              </p>
            </div>
            {property.bedrooms != null && (
              <div>
                <p className="text-gray-400">Bedrooms</p>
                <p className="font-medium">{property.bedrooms}</p>
              </div>
            )}
            {property.bathrooms != null && (
              <div>
                <p className="text-gray-400">Bathrooms</p>
                <p className="font-medium">{property.bathrooms}</p>
              </div>
            )}
            {property.squareFeet != null && (
              <div>
                <p className="text-gray-400">Square Feet</p>
                <p className="font-medium">
                  {Number(property.squareFeet).toLocaleString()}
                </p>
              </div>
            )}
            {property.yearBuilt != null && (
              <div>
                <p className="text-gray-400">Year Built</p>
                <p className="font-medium">{property.yearBuilt}</p>
              </div>
            )}
            {property.lotSize != null && (
              <div>
                <p className="text-gray-400">Lot Size</p>
                <p className="font-medium">
                  {Number(property.lotSize).toLocaleString()} sqft
                </p>
              </div>
            )}
          </div>

          {property.description && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h2 className="font-semibold mb-2">Description</h2>
              <p className="text-gray-600 dark:text-gray-400 whitespace-pre-line">
                {property.description}
              </p>
            </div>
          )}

          <div className="flex gap-4 text-sm border-t border-gray-200 dark:border-gray-700 pt-4">
            {property.garage && (
              <span className="bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
                Garage
              </span>
            )}
            {property.pool && (
              <span className="bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
                Pool
              </span>
            )}
          </div>
        </div>

        <div>
          <InquiryForm propertyId={property.id} />
        </div>
      </div>
    </div>
  );
}
