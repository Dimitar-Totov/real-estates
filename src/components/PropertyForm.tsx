"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const PROPERTY_TYPES = [
  "house",
  "apartment",
  "condo",
  "townhouse",
  "land",
  "commercial",
];

const STATUSES = ["for_sale", "for_rent", "sold", "rented"];

export default function PropertyForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form));

    const body = {
      ...data,
      bedrooms: data.bedrooms ? Number(data.bedrooms) : null,
      bathrooms: data.bathrooms ? Number(data.bathrooms) : null,
      squareFeet: data.squareFeet || null,
      lotSize: data.lotSize || null,
      yearBuilt: data.yearBuilt ? Number(data.yearBuilt) : null,
      garage: data.garage === "on",
      pool: data.pool === "on",
    };

    try {
      const res = await fetch("/api/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error("Failed to create property");
      const created = await res.json();
      router.push(`/properties/${created.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <Field label="Title" name="title" required />
      <Field label="Description" name="description" as="textarea" />

      <div className="grid grid-cols-2 gap-4">
        <Field label="Price" name="price" type="number" required />
        <SelectField label="Status" name="status" options={STATUSES} required />
      </div>

      <SelectField
        label="Property Type"
        name="type"
        options={PROPERTY_TYPES}
        required
      />

      <Field label="Address" name="address" required />

      <div className="grid grid-cols-2 gap-4">
        <Field label="City" name="city" required />
        <Field label="State" name="state" required />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Zip Code" name="zipCode" required />
        <Field label="Country" name="country" defaultValue="US" required />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Field label="Bedrooms" name="bedrooms" type="number" />
        <Field label="Bathrooms" name="bathrooms" type="number" />
        <Field label="Year Built" name="yearBuilt" type="number" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Square Feet" name="squareFeet" type="number" />
        <Field label="Lot Size (sqft)" name="lotSize" type="number" />
      </div>

      <div className="flex gap-6 text-sm">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" name="garage" className="rounded" />
          Garage
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" name="pool" className="rounded" />
          Pool
        </label>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white font-medium py-2.5 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
      >
        {loading ? "Saving..." : "Add Property"}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  as,
  defaultValue,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  as?: "textarea";
  defaultValue?: string;
}) {
  const cls =
    "w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500";
  return (
    <label className="block space-y-1">
      <span className="text-sm font-medium">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </span>
      {as === "textarea" ? (
        <textarea name={name} rows={3} className={cls} />
      ) : (
        <input
          type={type}
          name={name}
          required={required}
          defaultValue={defaultValue}
          className={cls}
        />
      )}
    </label>
  );
}

function SelectField({
  label,
  name,
  options,
  required,
}: {
  label: string;
  name: string;
  options: string[];
  required?: boolean;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-medium">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </span>
      <select
        name={name}
        required={required}
        className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o.replace(/_/g, " ")}
          </option>
        ))}
      </select>
    </label>
  );
}
