"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import SearchInput from "@/components/SearchInput";
import UserProfileCard, { type UserResult } from "@/components/UserProfileCard";

const NAVY = "#1e3a5f";

export default function UserManagement() {
  const [query,    setQuery]    = useState("");
  const [results,  setResults]  = useState<UserResult[]>([]);
  const [index,    setIndex]    = useState(0);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const runSearch = async () => {
    const q = query.trim();
    if (!q) return;
    setLoading(true);
    setError(null);
    setSearched(true);
    setIndex(0);
    try {
      const res = await fetch(`/api/admin/users/search?q=${encodeURIComponent(q)}`);
      if (!res.ok) throw new Error();
      setResults(await res.json());
    } catch {
      setError("Search failed. Please try again.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const prev = () => setIndex((i) => Math.max(0, i - 1));
  const next = () => setIndex((i) => Math.min(results.length - 1, i + 1));

  const multiple = results.length > 1;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">

      {/* ── Search row ────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <SearchInput
            value={query}
            onChange={(v) => {
              setQuery(v);
              if (!v) { setSearched(false); setResults([]); setError(null); }
            }}
            onSubmit={runSearch}
          />
        </div>
        <button
          onClick={runSearch}
          disabled={loading || !query.trim()}
          className="shrink-0 flex items-center justify-center w-24 py-3 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:brightness-110 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            backgroundColor: NAVY,
            boxShadow: "0 4px 14px rgba(30,58,95,0.30)",
            fontFamily: "var(--font-poppins), Poppins, sans-serif",
          }}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Search</span>}
        </button>
      </div>

      {/* ── Error ─────────────────────────────────────────────────────────── */}
      {error && (
        <p className="mt-4 text-sm text-red-500">{error}</p>
      )}

      {/* ── No results ────────────────────────────────────────────────────── */}
      {searched && !loading && !error && results.length === 0 && (
        <p className="mt-6 text-sm text-gray-400 text-center">
          No users found for <span className="font-semibold text-gray-600">&ldquo;{query}&rdquo;</span>.
        </p>
      )}

      {/* ── Results ───────────────────────────────────────────────────────── */}
      {results.length > 0 && (
        <div className="mt-8 flex flex-col items-center gap-6">
          <UserProfileCard key={index} user={results[index]} />

          {multiple && (
            <div className="flex items-center gap-4">
              <button
                onClick={prev}
                disabled={index === 0}
                aria-label="Previous user"
                className="p-2.5 rounded-full bg-white shadow-md hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 active:scale-95"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>

              <span className="text-sm font-medium text-gray-600 tabular-nums">
                {index + 1}
                <span className="mx-1.5 text-gray-300">of</span>
                {results.length}
              </span>

              <button
                onClick={next}
                disabled={index === results.length - 1}
                aria-label="Next user"
                className="p-2.5 rounded-full bg-white shadow-md hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 active:scale-95"
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
