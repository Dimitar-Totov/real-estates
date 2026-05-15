"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { Search, X } from "lucide-react";
import { toast } from "sonner";
import AgentCard from "@/components/AgentCard";

const TEAL = "#0d9488";
const NAVY = "#1e3a5f";

interface Agent {
  id: string;
  name: string;
  specialty: string;
  city: string;
  image: string;
  rating: number;
  reviews: number;
  experience: number;
  phone: string;
  email: string;
}

interface Props {
  agents: Agent[];
  isAdmin: boolean;
  sort?: string;
  featured: boolean;
}

const TABS = [
  { label: "All Agents", href: "/agents" },
  { label: "Top-Rated",  href: "/agents?sort=rating" },
  { label: "New Agents", href: "/agents?sort=newest" },
  { label: "Featured",   href: "/agents?featured=true" },
];

export default function AgentsClientView({ agents: initial, isAdmin, sort, featured }: Props) {
  const [agents,      setAgents]      = useState(initial);
  const [inputValue,  setInputValue]  = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Client-side filter — only applied after Search button click
  const displayed = activeQuery
    ? agents.filter((a) =>
        [a.name, a.specialty, a.city].some((f) =>
          f.toLowerCase().includes(activeQuery.toLowerCase())
        )
      )
    : agents;

  const handleSearch = () => {
    const q = inputValue.trim();
    setActiveQuery(q);
  };

  const handleClear = () => {
    setInputValue("");
    setActiveQuery("");
    inputRef.current?.focus();
  };

  const handleDelete = async (id: string) => {
    const agent = agents.find((a) => a.id === id);
    await fetch(`/api/admin/agents/${id}`, { method: "DELETE" });
    setAgents((prev) => prev.filter((a) => a.id !== id));
    toast.success(`${agent?.name ?? "Agent"} has been removed.`);
  };

  const isActive = (href: string) =>
    href === "/agents"
      ? !sort && !featured
      : href === `/agents?sort=${sort}`
      ? !!sort && !featured
      : href === "/agents?featured=true"
      ? featured
      : false;

  return (
    <>
      {/* ── Filter row ── */}
      <div className="flex flex-wrap items-center gap-2 mb-8">
        {/* Tab pills */}
        {TABS.map(({ label, href }) => (
          <Link
            key={href}
            href={href}
            onClick={() => { setInputValue(""); setActiveQuery(""); }}
            className={[
              "text-xs font-semibold px-4 py-2 rounded-full border transition-colors shrink-0",
              isActive(href)
                ? "bg-gray-900 text-white border-gray-900"
                : "border-gray-200 text-gray-600 hover:border-gray-400 hover:text-gray-900",
            ].join(" ")}
          >
            {label}
          </Link>
        ))}

        {/* Admin search — same row, pushed right */}
        {isAdmin && (
          <div className="flex items-center gap-2 ml-auto">
            <div className="relative flex items-center">
              <Search className="absolute left-3 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Search agents…"
                className="pl-9 pr-8 py-2 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition-all w-44 sm:w-56"
              />
              {inputValue && (
                <button
                  onClick={handleClear}
                  className="absolute right-2.5 text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <button
              onClick={handleSearch}
              disabled={!inputValue.trim()}
              className="shrink-0 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all duration-150 hover:brightness-110 active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: `linear-gradient(135deg, ${TEAL} 0%, ${NAVY} 100%)`,
                boxShadow: "0 2px 10px rgba(13,148,136,0.30)",
              }}
            >
              Search
            </button>
          </div>
        )}

        {/* Count — only shown when not admin-searching (admin has search in that slot) */}
        {!isAdmin && (
          <span className="ml-auto text-sm text-gray-500">
            <span className="font-semibold text-gray-900">{agents.length}</span>{" "}
            agent{agents.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Active search label */}
      {activeQuery && (
        <div className="flex items-center gap-2 mb-5 -mt-3">
          <span className="text-sm text-gray-500">
            <span className="font-semibold text-gray-800">{displayed.length}</span>{" "}
            result{displayed.length !== 1 ? "s" : ""} for{" "}
            <span className="font-semibold text-gray-800">&ldquo;{activeQuery}&rdquo;</span>
          </span>
          <button
            onClick={handleClear}
            className="text-xs text-teal-600 hover:text-teal-800 font-medium underline underline-offset-2 transition-colors"
          >
            Clear
          </button>
        </div>
      )}

      {/* ── Grid ── */}
      {displayed.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-gray-100 shadow-sm text-center">
          <svg className="w-16 h-16 mb-4 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={0.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <p className="text-lg font-semibold text-gray-700 mb-1">No agents found</p>
          <p className="text-sm text-gray-400">
            {activeQuery ? `No agents match "${activeQuery}".` : "All agents have been removed or no results match your filter."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {displayed.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              isAdmin={isAdmin}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </>
  );
}
