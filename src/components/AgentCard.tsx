"use client";

import { useState } from "react";
import { Trash2, AlertTriangle } from "lucide-react";

interface Agent {
  id: string;
  userId?: number | null;
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

export default function AgentCard({
  agent,
  isAdmin = false,
  onDelete,
  onEmail,
}: {
  agent: Agent;
  isAdmin?: boolean;
  onDelete?: (id: string) => void;
  onEmail?: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [removing, setRemoving] = useState(false);

  const handleDelete = () => {
    setRemoving(true);
    setTimeout(() => onDelete?.(agent.id), 350);
  };

  if (removing) {
    return (
      <div className="rounded-xl border border-red-100 bg-red-50 h-full min-h-[340px] flex items-center justify-center opacity-0 scale-95 transition-all duration-350" />
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-default group">
      {/* Agent Image */}
      <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center overflow-hidden">
        {agent.image ? (
          <img
            src={agent.image}
            alt={agent.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = "none";
              const fallback = target.parentElement?.querySelector(".fallback");
              if (fallback) (fallback as HTMLElement).style.display = "flex";
            }}
          />
        ) : null}
        <div
          className={`fallback absolute inset-0 flex items-center justify-center text-gray-400 text-sm${agent.image ? " hidden" : ""}`}
        >
          <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
          </svg>
        </div>

        {/* Rating Badge */}
        <div className="absolute top-3 right-3 bg-white dark:bg-gray-800 rounded-full px-2 py-1 flex items-center gap-1 shadow-md">
          <svg
            className="w-4 h-4 text-yellow-400 fill-current"
            viewBox="0 0 24 24"
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
          <span className="text-sm font-semibold text-gray-900 dark:text-white">
            {agent.rating}
          </span>
        </div>
      </div>

      {/* Agent Info */}
      <div className="p-6">
        <div className="space-y-3">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {agent.name}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {agent.specialty}
            </p>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            {agent.city}
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {agent.experience} years exp.
            </div>
            <div className="text-gray-600 dark:text-gray-400">
              {agent.reviews} reviews
            </div>
          </div>

          {/* Phone */}
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 cursor-default">
            <svg
              className="w-4 h-4 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
              />
            </svg>
            {agent.phone || "No phone"}
          </div>

          {/* Email button */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={(e) => { e.stopPropagation(); onEmail?.(); }}
              className="w-full border border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-700 dark:text-gray-300 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-1"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              Email
            </button>
          </div>

          {/* Delete — admin only */}
          {isAdmin && (
            <div className="pt-2 border-t border-gray-100 dark:border-gray-700 mt-1">
              {confirming ? (
                <div className="flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5 flex-1 min-w-0">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-500" />
                    <span className="truncate font-medium">
                      Remove {agent.name}?
                    </span>
                  </div>
                  <button
                    onClick={handleDelete}
                    className="shrink-0 bg-red-600 hover:bg-red-700 active:scale-95 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-all duration-150"
                  >
                    Yes, delete
                  </button>
                  <button
                    onClick={() => setConfirming(false)}
                    className="shrink-0 text-xs font-medium text-gray-500 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirming(true);
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-400 active:scale-[0.98] text-sm font-medium transition-all duration-150"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Agent
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
