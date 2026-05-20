"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

const TYPES = [
  { value: "house",      label: "House" },
  { value: "apartment",  label: "Apartment" },
  { value: "condo",      label: "Condo" },
  { value: "townhouse",  label: "Townhouse" },
  { value: "land",       label: "Land" },
  { value: "commercial", label: "Commercial" },
];

const STATUSES = [
  { value: "for_sale", label: "For Sale" },
  { value: "for_rent", label: "For Rent" },
  { value: "sold",     label: "Sold" },
  { value: "rented",   label: "Rented" },
];

const BED_OPTS  = [{ label: "1+", value: "1" }, { label: "2+", value: "2" }, { label: "3+", value: "3" }, { label: "4+", value: "4" }];
const BATH_OPTS = [{ label: "1+", value: "1" }, { label: "2+", value: "2" }, { label: "3+", value: "3" }];

export default function PropertyFilters() {
  const router   = useRouter();
  const pathname = usePathname();
  const sp       = useSearchParams();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [city,       setCity]       = useState(sp.get("city")     ?? "");
  const [minPrice,   setMinPrice]   = useState(sp.get("minPrice") ?? "");
  const [maxPrice,   setMaxPrice]   = useState(sp.get("maxPrice") ?? "");

  // Keep local inputs in sync if URL changes externally
  useEffect(() => {
    setCity(sp.get("city")     ?? "");
    setMinPrice(sp.get("minPrice") ?? "");
    setMaxPrice(sp.get("maxPrice") ?? "");
  }, [sp]);

  const pushParam = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(sp.toString());
    value ? params.set(key, value) : params.delete(key);
    router.push(`${pathname}?${params.toString()}`);
  }, [router, pathname, sp]);

  const toggle = (key: string, value: string) =>
    pushParam(key, sp.get(key) === value ? "" : value);

  const applyCity = () => pushParam("city", city);

  const applyPrice = () => {
    const params = new URLSearchParams(sp.toString());
    minPrice ? params.set("minPrice", minPrice) : params.delete("minPrice");
    maxPrice ? params.set("maxPrice", maxPrice) : params.delete("maxPrice");
    router.push(`${pathname}?${params.toString()}`);
  };

  const clearAll = () => {
    setCity(""); setMinPrice(""); setMaxPrice("");
    router.push(pathname);
  };

  const on  = (key: string, value: string) => sp.get(key) === value;
  const has = sp.toString().length > 0;

  const pill    = "flex-1 py-2 rounded-xl text-sm font-medium border transition-all duration-150 cursor-pointer focus:outline-none";
  const pillOn  = "bg-[#CC0000] text-white border-[#CC0000] shadow-sm";
  const pillOff = "bg-white text-gray-600 border-gray-200 hover:border-gray-400 hover:text-gray-900";

  /* ── Shared section label ── */
  const SectionLabel = ({ children }: { children: React.ReactNode }) => (
    <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-2.5">{children}</p>
  );

  const body = (
    <div className="space-y-5">

      {/* Location */}
      <div>
        <SectionLabel>Location</SectionLabel>
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            type="text"
            placeholder="City or neighbourhood…"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applyCity()}
            onBlur={applyCity}
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000]/20 focus:border-[#CC0000]/50 transition-all"
          />
        </div>
      </div>

      <div className="border-t border-gray-100" />

      {/* Listing type */}
      <div>
        <SectionLabel>Listing Type</SectionLabel>
        <div className="grid grid-cols-2 gap-2">
          {STATUSES.map((s) => (
            <button key={s.value} onClick={() => toggle("status", s.value)}
              className={`${pill} ${on("status", s.value) ? pillOn : pillOff}`}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-gray-100" />

      {/* Property type */}
      <div>
        <SectionLabel>Property Type</SectionLabel>
        <div className="grid grid-cols-2 gap-2">
          {TYPES.map((t) => (
            <button key={t.value} onClick={() => toggle("type", t.value)}
              className={`${pill} ${on("type", t.value) ? pillOn : pillOff}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-gray-100" />

      {/* Price range */}
      <div>
        <SectionLabel>Price Range</SectionLabel>
        <div className="flex gap-2 mb-2">
          <input type="number" min={0} placeholder="Min $"
            value={minPrice} onChange={(e) => setMinPrice(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000]/20 focus:border-[#CC0000]/50 transition-all" />
          <input type="number" min={0} placeholder="Max $"
            value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000]/20 focus:border-[#CC0000]/50 transition-all" />
        </div>
        <button onClick={applyPrice}
          className="w-full py-2.5 rounded-xl bg-gray-900 hover:bg-gray-700 text-white text-sm font-medium transition-colors">
          Apply Price
        </button>
      </div>

      <div className="border-t border-gray-100" />

      {/* Bedrooms */}
      <div>
        <SectionLabel>Bedrooms</SectionLabel>
        <div className="flex gap-1.5">
          <button onClick={() => pushParam("minBeds", "")}
            className={`${pill} ${!sp.get("minBeds") ? pillOn : pillOff}`}>
            Any
          </button>
          {BED_OPTS.map((b) => (
            <button key={b.value} onClick={() => pushParam("minBeds", b.value)}
              className={`${pill} ${on("minBeds", b.value) ? pillOn : pillOff}`}>
              {b.label}
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-gray-100" />

      {/* Bathrooms */}
      <div>
        <SectionLabel>Bathrooms</SectionLabel>
        <div className="flex gap-1.5">
          <button onClick={() => pushParam("minBaths", "")}
            className={`${pill} ${!sp.get("minBaths") ? pillOn : pillOff}`}>
            Any
          </button>
          {BATH_OPTS.map((b) => (
            <button key={b.value} onClick={() => pushParam("minBaths", b.value)}
              className={`${pill} ${on("minBaths", b.value) ? pillOn : pillOff}`}>
              {b.label}
            </button>
          ))}
        </div>
      </div>

      {has && (
        <>
          <div className="border-t border-gray-100" />
          <button onClick={clearAll}
            className="w-full py-2.5 rounded-xl border border-red-200 text-[#CC0000] text-sm font-medium hover:bg-red-50 transition-colors">
            Clear All Filters
          </button>
        </>
      )}
    </div>
  );

  return (
    <>
      {/* ── Mobile toggle ── */}
      <div className="md:hidden">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="w-full flex items-center gap-2 px-4 py-3 rounded-2xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
        >
          <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path d="M22 3H2l8 9.46V19l4 2v-8.54z"/>
          </svg>
          Filters
          {has && (
            <span className="ml-1 inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#CC0000] text-white text-[10px] font-bold">
              {sp.toString().split("&").length}
            </span>
          )}
          <svg className={["w-4 h-4 ml-auto text-gray-400 transition-transform duration-200", mobileOpen ? "rotate-180" : ""].join(" ")} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd"/>
          </svg>
        </button>

        <div className={[
          "overflow-hidden transition-all duration-300 ease-in-out",
          mobileOpen ? "max-h-[1200px] mt-3 opacity-100" : "max-h-0 opacity-0",
        ].join(" ")}>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            {body}
          </div>
        </div>
      </div>

      {/* ── Desktop sidebar ── */}
      <div className="hidden md:block sticky top-[84px] self-start bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-gray-900 text-base">Filters</h2>
          {has && (
            <button onClick={clearAll} className="text-xs text-[#CC0000] hover:underline font-medium">
              Clear all
            </button>
          )}
        </div>
        {body}
      </div>
    </>
  );
}
