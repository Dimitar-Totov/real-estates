"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, MessageSquare, ChevronLeft, ChevronRight, Star } from "lucide-react";

interface Review {
  id: number;
  rating: number;
  comment: string;
  createdAt: string;
  username: string;
}

interface Props {
  agentId: string;
  agentName: string;
  agentImage: string;
  reviewCount: number;
  onClose: () => void;
}

const AVATAR_PALETTE: [string, string][] = [
  ["#6366f1", "#4f46e5"],
  ["#8b5cf6", "#7c3aed"],
  ["#ec4899", "#db2777"],
  ["#f59e0b", "#d97706"],
  ["#10b981", "#059669"],
  ["#3b82f6", "#2563eb"],
  ["#ef4444", "#dc2626"],
  ["#14b8a6", "#0d9488"],
  ["#f97316", "#ea580c"],
  ["#84cc16", "#65a30d"],
];

function avatarGradient(username: string): string {
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = (hash * 31 + username.charCodeAt(i)) & 0xffffffff;
  }
  const [from, to] = AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
  return `linear-gradient(135deg, ${from}, ${to})`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function ReviewStars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 6 }, (_, i) => (
        <svg
          key={i}
          viewBox="0 0 24 24"
          className="w-3.5 h-3.5"
          fill={i < rating ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth={1.5}
          style={{ color: i < rating ? "#f59e0b" : "#d1d5db" }}
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
      <span className="ml-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400 tabular-nums">
        {rating}/6
      </span>
    </div>
  );
}

export default function AgentReviewsModal({
  agentId,
  agentName,
  agentImage,
  reviewCount,
  onClose,
}: Props) {
  const [page, setPage]       = useState(1);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [pages, setPages]     = useState(1);
  const [total, setTotal]     = useState(reviewCount);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(false);

  const fetchPage = useCallback(
    async (p: number) => {
      setLoading(true);
      setError(false);
      try {
        const res = await fetch(`/api/agents/${agentId}/reviews?page=${p}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        setReviews(data.reviews ?? []);
        setPages(data.pages ?? 1);
        setTotal(data.total ?? 0);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    },
    [agentId]
  );

  useEffect(() => {
    fetchPage(page);
  }, [fetchPage, page]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)" }}
    >
      <div
        className="relative w-full sm:max-w-2xl bg-white dark:bg-gray-900 sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden rounded-t-2xl"
        style={{
          animation: "modalIn 0.22s cubic-bezier(0.34,1.56,0.64,1) both",
          maxHeight: "min(92vh, 700px)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Amber gradient accent */}
        <div className="h-1 w-full flex-shrink-0 bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-400" />

        {/* Header */}
        <div className="flex-shrink-0 flex items-center gap-4 px-5 sm:px-6 pt-5 pb-4 border-b border-gray-100 dark:border-gray-800">
          {/* Agent avatar */}
          <div className="relative flex-shrink-0">
            {agentImage ? (
              <img
                src={agentImage}
                alt={agentName}
                className="w-12 h-12 rounded-xl object-cover ring-2 ring-amber-200 dark:ring-amber-700"
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center ring-2 ring-amber-200 dark:ring-amber-700">
                <span className="text-white font-bold text-lg">{agentName[0]?.toUpperCase()}</span>
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow">
              <Star className="w-2.5 h-2.5 text-white fill-white" />
            </div>
          </div>

          {/* Title */}
          <div className="flex-1 min-w-0">
            <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white leading-tight truncate">
              {agentName}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1.5 mt-0.5">
              <MessageSquare className="w-3.5 h-3.5 flex-shrink-0" />
              <span>
                <span className="font-semibold text-gray-700 dark:text-gray-300">{total}</span>
                {" "}review{total !== 1 ? "s" : ""}
              </span>
            </p>
          </div>

          {/* Close */}
          <button
            onClick={onClose}
            className="flex-shrink-0 p-2 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Close reviews"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Reviews list */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-4 space-y-3 min-h-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <svg className="w-7 h-7 animate-spin text-amber-500" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              <span className="text-sm text-gray-400">Loading reviews…</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
              <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                <X className="w-6 h-6 text-red-400" />
              </div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Failed to load reviews</p>
              <button
                onClick={() => fetchPage(page)}
                className="text-sm text-amber-600 hover:text-amber-700 dark:text-amber-400 font-semibold underline underline-offset-2 transition-colors"
              >
                Try again
              </button>
            </div>
          ) : reviews.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
                  <MessageSquare className="w-7 h-7 text-amber-300 dark:text-amber-600" />
                </div>
              </div>
              <div>
                <p className="text-base font-semibold text-gray-700 dark:text-gray-300">No reviews yet</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1 max-w-xs">
                  Be the first to share your experience with {agentName}.
                </p>
              </div>
            </div>
          ) : (
            reviews.map((review, idx) => (
              <div
                key={review.id}
                className="flex gap-3.5 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/60 hover:border-amber-200 dark:hover:border-amber-800/50 hover:bg-amber-50/40 dark:hover:bg-amber-900/10 transition-colors"
                style={{ animation: `fadeIn 0.18s ease both ${idx * 50}ms` }}
              >
                {/* Avatar */}
                <div
                  className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm select-none"
                  style={{ background: avatarGradient(review.username) }}
                  aria-hidden="true"
                >
                  {review.username[0]?.toUpperCase()}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {/* Name + date row */}
                  <div className="flex items-baseline justify-between gap-2 flex-wrap mb-1.5">
                    <span className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                      {review.username}
                    </span>
                    <span className="flex-shrink-0 text-xs text-gray-400 dark:text-gray-500 tabular-nums">
                      {formatDate(review.createdAt)}
                    </span>
                  </div>

                  {/* Stars */}
                  <ReviewStars rating={review.rating} />

                  {/* Comment */}
                  <p className="mt-2.5 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    {review.comment}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {!loading && !error && pages > 1 && (
          <div className="flex-shrink-0 flex items-center justify-between px-5 sm:px-6 py-3.5 border-t border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-900/80">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Previous</span>
            </button>

            {/* Page pills */}
            <div className="flex items-center gap-1.5">
              {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={[
                    "w-8 h-8 rounded-lg text-sm font-semibold transition-all",
                    p === page
                      ? "bg-amber-500 text-white shadow-sm shadow-amber-300/50"
                      : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800",
                  ].join(" ")}
                >
                  {p}
                </button>
              ))}
            </div>

            <button
              onClick={() => setPage((p) => Math.min(pages, p + 1))}
              disabled={page === pages}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
