"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const HERO_TABS = ["Buy", "Rent", "Sell", "Mortgage", "Home Estimate"];

export default function HeroSearch() {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState(0);
  const router = useRouter();

  function handleSearch() {
    if (query.trim()) {
      router.push(`/listings?city=${encodeURIComponent(query.trim())}`);
    }
  }

  return (
    <div className="max-w-xl">
      {/* Tabs */}
      <div className="flex gap-7 mb-4">
        {HERO_TABS.map((tab, i) => (
          <button
            key={tab}
            onClick={() => setActiveTab(i)}
            className={`text-sm pb-2 transition-colors ${
              i === activeTab
                ? "text-white border-b-2 border-white font-semibold"
                : "text-white/80 hover:text-white border-b-2 border-transparent hover:border-white/40"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Search bar */}
      <div className="flex shadow-2xl">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="City, Address, School, Agent, ZIP"
          className="flex-1 px-5 py-4 text-white text-sm focus:outline-none placeholder-white/60 bg-white/20 backdrop-blur-sm"
        />
        <button
          onClick={handleSearch}
          className="bg-[#CC0000] hover:bg-[#aa0000] px-6 flex items-center justify-center transition-colors"
        >
          <svg
            className="w-5 h-5 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
