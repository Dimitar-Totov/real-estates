"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

interface PreviewFile {
  id: string;
  name: string;
  url: string;
  size: number;
  file: File;
}

interface Agent {
  id: number;
  name: string;
  specialty: string;
  city: string;
  image: string;
  rating: string;
  reviews: number;
  experience: number;
}

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
  const [loadingMsg, setLoadingMsg] = useState("Saving…");
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [images, setImages] = useState<PreviewFile[]>([]);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [agents, setAgents] = useState<Agent[]>([]);
  const [agentIndex, setAgentIndex] = useState(0);
  const [agentsLoading, setAgentsLoading] = useState(true);
  const [selectedAgentId, setSelectedAgentId] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/agents")
      .then((r) => r.json())
      .then((data: Agent[]) => {
        setAgents(data);
        if (data.length > 0) setSelectedAgentId(data[0].id);
      })
      .finally(() => setAgentsLoading(false));
  }, []);

  function prevAgent() {
    setAgentIndex((i) => {
      const next = (i - 1 + agents.length) % agents.length;
      setSelectedAgentId(agents[next].id);
      return next;
    });
  }

  function nextAgent() {
    setAgentIndex((i) => {
      const next = (i + 1) % agents.length;
      setSelectedAgentId(agents[next].id);
      return next;
    });
  }

  function addFiles(files: FileList | null) {
    if (!files) return;
    const next: PreviewFile[] = Array.from(files)
      .filter((f) => f.type.startsWith("image/"))
      .map((f) => ({
        id: `${f.name}-${f.size}-${Date.now()}`,
        name: f.name,
        url: URL.createObjectURL(f),
        size: f.size,
        file: f,
      }));
    setImages((prev) => [...prev, ...next]);
  }

  function removeImage(id: string) {
    setImages((prev) => {
      const removed = prev.find((f) => f.id === id);
      if (removed) URL.revokeObjectURL(removed.url);
      return prev.filter((f) => f.id !== id);
    });
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form));

    try {
      // 1. Upload images directly to R2 via presigned URLs
      let imageUrls: string[] = [];
      if (images.length > 0) {
        setLoadingMsg(`Uploading ${images.length} photo${images.length > 1 ? "s" : ""}…`);

        const presignRes = await fetch("/api/upload/presign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            files: images.map((img) => ({ name: img.name, contentType: img.file.type })),
          }),
        });
        if (!presignRes.ok) throw new Error("Failed to get upload URLs");
        const { uploads } = await presignRes.json() as {
          uploads: { presignedUrl: string; publicUrl: string }[];
        };

        // Browser PUTs each file straight to R2 — server never touches the bytes
        await Promise.all(
          uploads.map(async (upload, i) => {
            let r: Response;
            try {
              r = await fetch(upload.presignedUrl, {
                method: "PUT",
                headers: { "Content-Type": images[i].file.type },
                body: images[i].file,
              });
            } catch (networkErr) {
              console.error("R2 PUT network error:", networkErr);
              throw new Error(`Network error uploading image ${i + 1} — check browser console`);
            }
            if (!r.ok) {
              const text = await r.text().catch(() => "");
              console.error(`R2 PUT ${r.status}:`, text);
              throw new Error(`Image upload failed (HTTP ${r.status}) — check browser console`);
            }
          })
        );

        imageUrls = uploads.map((u) => u.publicUrl);
      }

      // 2. Submit property data + image URLs + selected agent
      setLoadingMsg("Saving property…");
      const body = {
        ...data,
        bedrooms: data.bedrooms ? Number(data.bedrooms) : null,
        bathrooms: data.bathrooms ? Number(data.bathrooms) : null,
        squareFeet: data.squareFeet || null,
        lotSize: data.lotSize || null,
        yearBuilt: data.yearBuilt ? Number(data.yearBuilt) : null,
        garage: data.garage === "on",
        pool: data.pool === "on",
        images: imageUrls.length > 0 ? imageUrls : undefined,
        agentId: data.agentId || undefined,
      };

      const res = await fetch("/api/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error("Failed to create property");
      const created = await res.json();
      if (created.pending) {
        setSubmitted(true);
        setLoading(false);
        return;
      }
      router.push(`/properties/${created.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  const currentAgent = agents[agentIndex] ?? null;

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-6 text-center">
        <div className="flex items-center justify-center w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/40">
          <svg className="w-10 h-10 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Listing submitted!</h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-sm">
            Your property has been sent to the agent for review. You&apos;ll receive a reply once it&apos;s approved.
          </p>
        </div>
        <div className="flex gap-3 mt-2">
          <button
            onClick={() => router.push("/listings")}
            className="px-6 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Browse listings
          </button>
          <button
            onClick={() => { setSubmitted(false); setError(null); }}
            className="px-6 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Submit another
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row gap-8 items-start">

      {/* ── Left column: agent selector (sticky on desktop) ── */}
      <div className="w-full lg:w-[28rem] xl:w-[32rem] lg:sticky lg:top-6 space-y-5">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Choose an agent
          </h2>
          <p className="text-base text-gray-500 dark:text-gray-400 mt-1.5">
            Choose one of our agents to help you sell your property.
          </p>
        </div>

        {agentsLoading ? (
          <div className="flex items-center justify-center py-32 rounded-3xl border border-gray-200 dark:border-gray-700">
            <div className="flex flex-col items-center gap-4">
              <div className="w-10 h-10 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
              <p className="text-base text-gray-400">Loading agents…</p>
            </div>
          </div>
        ) : agents.length === 0 ? (
          <div className="flex items-center justify-center py-32 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700">
            <p className="text-base text-gray-400">No agents available at the moment.</p>
          </div>
        ) : (
          <div className="relative">
            <input type="hidden" name="agentId" value={selectedAgentId ?? ""} />

            <div className="flex items-center gap-2 sm:gap-4">
              {/* Left arrow */}
              <button
                type="button"
                onClick={prevAgent}
                aria-label="Previous agent"
                className="flex-none w-10 h-10 sm:w-14 sm:h-14 flex items-center justify-center rounded-full border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-md hover:border-blue-400 hover:text-blue-600 dark:hover:border-blue-500 dark:hover:text-blue-400 transition-colors text-gray-500 dark:text-gray-400"
              >
                <svg className="w-4 h-4 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              {/* Card */}
              {currentAgent && (
                <div className="flex-1 flex flex-col items-center gap-3 sm:gap-5 rounded-3xl border border-blue-200 dark:border-blue-800 bg-gradient-to-b from-blue-50/70 to-white dark:from-blue-950/40 dark:to-gray-900 px-4 sm:px-8 py-7 sm:py-12 text-center shadow-md">
                  {/* Avatar */}
                  <div className="relative">
                    <div className="w-24 h-24 sm:w-44 sm:h-44 rounded-full overflow-hidden ring-4 sm:ring-[6px] ring-white dark:ring-gray-900 shadow-xl bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 flex items-center justify-center">
                      {currentAgent.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={currentAgent.image}
                          alt={currentAgent.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-4xl sm:text-6xl font-semibold text-blue-600 dark:text-blue-300 select-none">
                          {currentAgent.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    {/* Rating badge */}
                    <div className="absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2 flex items-center gap-0.5 sm:gap-1 bg-amber-400 text-white text-xs sm:text-sm font-bold px-2 sm:px-3 py-1 sm:py-1.5 rounded-full shadow-lg">
                      <svg className="w-3 h-3 sm:w-4 sm:h-4" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      {currentAgent.rating}
                    </div>
                  </div>

                  {/* Name */}
                  <div>
                    <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-gray-100 leading-tight">
                      {currentAgent.name}
                    </p>
                    {currentAgent.experience > 0 && (
                      <p className="text-sm sm:text-base text-gray-400 mt-1 sm:mt-1.5">
                        {currentAgent.experience} yr{currentAgent.experience !== 1 ? "s" : ""} experience
                      </p>
                    )}
                  </div>

                  {/* Specialty pill */}
                  <span className="inline-flex items-center px-3 sm:px-5 py-1.5 sm:py-2 rounded-full text-sm sm:text-base font-medium bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
                    {currentAgent.specialty}
                  </span>

                  {/* City */}
                  <div className="flex items-center gap-1.5 sm:gap-2 text-sm sm:text-lg text-gray-500 dark:text-gray-400">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                    </svg>
                    {currentAgent.city}
                  </div>

                  {/* Reviews count */}
                  {currentAgent.reviews > 0 && (
                    <p className="text-sm sm:text-base text-gray-400">
                      {currentAgent.reviews} review{currentAgent.reviews !== 1 ? "s" : ""}
                    </p>
                  )}
                </div>
              )}

              {/* Right arrow */}
              <button
                type="button"
                onClick={nextAgent}
                aria-label="Next agent"
                className="flex-none w-10 h-10 sm:w-14 sm:h-14 flex items-center justify-center rounded-full border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-md hover:border-blue-400 hover:text-blue-600 dark:hover:border-blue-500 dark:hover:text-blue-400 transition-colors text-gray-500 dark:text-gray-400"
              >
                <svg className="w-4 h-4 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Dot indicators */}
            {agents.length > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                {agents.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => { setAgentIndex(i); setSelectedAgentId(agents[i].id); }}
                    aria-label={`Select agent ${i + 1}`}
                    className={`rounded-full transition-all ${
                      i === agentIndex
                        ? "w-6 h-2.5 bg-blue-500"
                        : "w-2.5 h-2.5 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Right column: property fields ── */}
      <div className="w-full lg:flex-1 space-y-5">
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

        {/* Image upload */}
        <div className="space-y-3">
          <span className="text-sm font-medium block">Photos</span>
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }}
            className={`relative flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl px-6 py-10 cursor-pointer transition-colors select-none
              ${dragging
                ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                : "border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800/40"
              }`}
          >
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/40">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Drop photos here or <span className="text-blue-600 dark:text-blue-400">browse</span>
            </p>
            <p className="text-xs text-gray-400">PNG, JPG, WEBP up to any size</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => addFiles(e.target.files)}
            />
          </div>

          {images.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {images.map((img) => (
                <div key={img.id} className="group relative aspect-square rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(img.id)}
                    className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-colors"
                    aria-label="Remove image"
                  >
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 dark:bg-gray-900/90 rounded-full p-1">
                      <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </span>
                  </button>
                  <div className="absolute bottom-0 inset-x-0 px-1.5 py-1 bg-gradient-to-t from-black/60 to-transparent">
                    <p className="text-white text-[10px] truncate">{img.name}</p>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800/40 flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer"
              >
                <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                <span className="text-xs text-gray-400">Add more</span>
              </button>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white font-medium py-2.5 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {loading ? loadingMsg : "Add Property"}
        </button>
      </div>

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
