"use client";

import { useState, useCallback } from "react";

interface FeedItemRow {
  id: number;
  type: "listing" | "agent_activity" | "review" | "market_update";
  content: any;
  createdAt: string;
}

const ITEMS_PER_PAGE = 6;

const FILTERS = [
  { id: "all", label: "All Activity" },
  { id: "listings", label: "New Listings" },
  { id: "agents", label: "Agent Activity" },
  { id: "reviews", label: "Reviews" },
] as const;

type FilterId = (typeof FILTERS)[number]["id"];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function ListingCard({ item }: { item: FeedItemRow }) {
  const c = item.content;
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
      <div className="flex flex-col sm:flex-row">
        <div className="sm:w-44 h-44 sm:h-auto flex-shrink-0 bg-gray-200 dark:bg-gray-700 relative overflow-hidden">
          {c.image ? (
            <img src={c.image} alt={c.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9.75L12 3l9 6.75V21H3V9.75z" />
              </svg>
            </div>
          )}
          <span className="absolute top-2 left-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-green-500 text-white shadow-sm">
            {c.status === "for_rent" ? "For Rent" : "For Sale"}
          </span>
        </div>
        <div className="flex-1 p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-400 dark:text-gray-500">{formatDate(item.createdAt)}</span>
              <span className="text-xs font-medium text-blue-600 dark:text-blue-400 capitalize">{c.propertyType}</span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-1 line-clamp-1">
              {c.title}
            </h3>
            <p className="text-xl font-bold text-blue-600 dark:text-blue-400 mb-2">
              ${Number(c.price).toLocaleString()}
              {c.status === "for_rent" && <span className="text-sm font-normal text-gray-500 dark:text-gray-400">/mo</span>}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-1">
              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              {c.location}
            </p>
            <div className="flex flex-wrap gap-3 text-xs text-gray-500 dark:text-gray-400">
              {c.beds != null && (
                <span className="flex items-center gap-1 bg-gray-50 dark:bg-gray-700/50 px-2 py-1 rounded-lg">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M3 12h18M3 17h18" />
                  </svg>
                  {c.beds} beds
                </span>
              )}
              {c.baths != null && (
                <span className="flex items-center gap-1 bg-gray-50 dark:bg-gray-700/50 px-2 py-1 rounded-lg">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12h16M4 12a4 4 0 014-4h8a4 4 0 014 4" />
                  </svg>
                  {c.baths} baths
                </span>
              )}
              {c.sqft != null && (
                <span className="flex items-center gap-1 bg-gray-50 dark:bg-gray-700/50 px-2 py-1 rounded-lg">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                  {Number(c.sqft).toLocaleString()} sqft
                </span>
              )}
            </div>
          </div>
          {c.agent && (
            <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center gap-2">
              {c.agentImage ? (
                <img src={c.agentImage} alt={c.agent} className="w-8 h-8 rounded-full object-cover ring-2 ring-white dark:ring-gray-700" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-300">{c.agent[0]}</span>
                </div>
              )}
              <div>
                <p className="text-xs font-medium text-gray-900 dark:text-white">{c.agent}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">Listing agent</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AgentActivityCard({ item }: { item: FeedItemRow }) {
  const c = item.content;
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 sm:p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs text-gray-400 dark:text-gray-500">{formatDate(item.createdAt)}</span>
        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300">
          Agent Activity
        </span>
      </div>
      <div className="flex items-center gap-3">
        {c.agentImage ? (
          <img src={c.agentImage} alt={c.agent} className="w-11 h-11 rounded-full object-cover flex-shrink-0 ring-2 ring-purple-100 dark:ring-purple-900" />
        ) : (
          <div className="w-11 h-11 rounded-full bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-bold text-purple-600 dark:text-purple-300">{c.agent?.[0] ?? "?"}</span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-snug">
            <span className="font-semibold text-gray-900 dark:text-white">{c.agent}</span>{" "}
            <span className="text-gray-500 dark:text-gray-400">{c.action}</span>
          </p>
          <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5 truncate">{c.property}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1 flex-wrap">
            {c.price && <span>{c.price}</span>}
            {c.price && c.location && <span>·</span>}
            {c.location && (
              <span className="flex items-center gap-0.5">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                {c.location}
              </span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

function ReviewCard({ item }: { item: FeedItemRow }) {
  const c = item.content;
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 sm:p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs text-gray-400 dark:text-gray-500">{formatDate(item.createdAt)}</span>
        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
          Review
        </span>
      </div>
      <div className="flex items-start gap-3">
        {c.reviewerImage ? (
          <img src={c.reviewerImage} alt={c.reviewer} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-bold text-amber-600 dark:text-amber-300">{c.reviewer?.[0] ?? "?"}</span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            <span className="font-semibold text-gray-900 dark:text-white">{c.reviewer}</span>{" "}
            <span className="text-gray-500 dark:text-gray-400">reviewed</span>{" "}
            <span className="font-semibold text-gray-900 dark:text-white">{c.agent}</span>
          </p>
          <div className="flex items-center gap-0.5 my-1.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <svg
                key={i}
                className={`w-4 h-4 ${i < c.rating ? "text-amber-400" : "text-gray-200 dark:text-gray-600"}`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
            <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">{c.rating}/5</span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300 italic leading-relaxed">"{c.text}"</p>
        </div>
      </div>
    </div>
  );
}

function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages: (number | "ellipsis")[] = [];
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    pages.push(1);
    if (currentPage > 3) pages.push("ellipsis");
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (currentPage < totalPages - 2) pages.push("ellipsis");
    pages.push(totalPages);
    return pages;
  };

  return (
    <div className="mt-10 flex items-center justify-center gap-1 sm:gap-2">
      {/* Prev */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 shadow-sm"
        aria-label="Previous page"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        <span className="hidden sm:inline">Prev</span>
      </button>

      {/* Page numbers */}
      <div className="flex items-center gap-1">
        {getPageNumbers().map((page, idx) =>
          page === "ellipsis" ? (
            <span key={`ellipsis-${idx}`} className="w-9 text-center text-gray-400 dark:text-gray-500 select-none">
              …
            </span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page as number)}
              className={[
                "w-9 h-9 rounded-xl text-sm font-semibold transition-all duration-150",
                currentPage === page
                  ? "bg-blue-600 text-white shadow-md shadow-blue-200 dark:shadow-blue-900/40 scale-105"
                  : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm",
              ].join(" ")}
              aria-label={`Page ${page}`}
              aria-current={currentPage === page ? "page" : undefined}
            >
              {page}
            </button>
          )
        )}
      </div>

      {/* Next */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 shadow-sm"
        aria-label="Next page"
      >
        <span className="hidden sm:inline">Next</span>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}

export default function FeedView({ items }: { items: FeedItemRow[] }) {
  const [filterType, setFilterType] = useState<FilterId>("all");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredItems = items.filter((item) => {
    if (filterType === "all") return true;
    if (filterType === "listings") return item.type === "listing";
    if (filterType === "agents") return item.type === "agent_activity";
    if (filterType === "reviews") return item.type === "review";
    return true;
  });

  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
  const pageItems = filteredItems.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleFilterChange = useCallback((id: FilterId) => {
    setFilterType(id);
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Filter Tabs */}
      <div className="mb-8 flex flex-wrap gap-2 justify-center">
        {FILTERS.map((filter) => (
          <button
            key={filter.id}
            onClick={() => handleFilterChange(filter.id)}
            className={[
              "px-4 py-2 rounded-full font-medium transition-all duration-200 text-sm",
              filterType === filter.id
                ? "bg-blue-600 text-white shadow-md shadow-blue-200 dark:shadow-blue-900/40"
                : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-blue-300 dark:hover:border-blue-600 hover:text-blue-600 dark:hover:text-blue-400",
            ].join(" ")}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Results count */}
      {filteredItems.length > 0 && (
        <p className="text-xs text-gray-400 dark:text-gray-500 text-center mb-6">
          Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredItems.length)} of {filteredItems.length} items
        </p>
      )}

      {/* Feed Items */}
      <div className="space-y-4">
        {pageItems.map((item) => (
          <div key={item.id}>
            {item.type === "listing" && <ListingCard item={item} />}
            {item.type === "agent_activity" && <AgentActivityCard item={item} />}
            {item.type === "review" && <ReviewCard item={item} />}
          </div>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-gray-500 dark:text-gray-400 font-medium">No items to display</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Try a different filter</p>
        </div>
      )}

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
    </div>
  );
}
