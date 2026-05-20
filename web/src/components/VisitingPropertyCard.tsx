"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";

const PROPERTY_STATUS_LABELS: Record<string, string> = {
  for_sale: "For Sale",
  for_rent: "For Rent",
  sold:     "Sold",
  rented:   "Rented",
};

const PROPERTY_STATUS_COLORS: Record<string, string> = {
  for_sale: "bg-emerald-500 text-white",
  for_rent: "bg-blue-500 text-white",
  sold:     "bg-gray-400 text-white",
  rented:   "bg-gray-400 text-white",
};

const VISITING_STATUS_COLORS: Record<string, string> = {
  pending:   "bg-amber-500 text-white",
  confirmed: "bg-emerald-500 text-white",
  cancelled: "bg-gray-400 text-white",
};

const VISITING_STATUS_LABELS: Record<string, string> = {
  pending:   "Requested",
  confirmed: "Approved",
  cancelled: "Cancelled",
};

export function formatHour(h: number) {
  return h < 12 ? `${h}:00 AM` : h === 12 ? "12:00 PM" : `${h - 12}:00 PM`;
}

export type VisitingRow = {
  visitingId: number;
  visitDate: string | Date;
  hour: number;
  status: string;
  propertyId: number;
  title: string;
  address: string;
  city: string;
  state: string;
  price: string;
  propertyStatus: string;
  type: string;
  bedrooms: number | null;
  bathrooms: number | null;
  squareFeet: string | null;
  coverImage: string | null;
};

export default function VisitingPropertyCard({
  visiting,
  showActions = false,
  onAccept,
  onDecline,
}: {
  visiting: VisitingRow;
  showActions?: boolean;
  onAccept?: () => Promise<void>;
  onDecline?: () => Promise<void>;
}) {
  const [isLoading, setIsLoading] = useState(false);

  const coverImage = visiting.coverImage;
  const visitDate = new Date(visiting.visitDate);
  const dateLabel = visitDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

  const handleAccept = async () => {
    if (!onAccept || isLoading) return;
    setIsLoading(true);
    try {
      await onAccept();
    } finally {
      setIsLoading(false);
    }
  };

  const handleDecline = async () => {
    if (!onDecline || isLoading) return;
    setIsLoading(true);
    try {
      await onDecline();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative group flex flex-col rounded-2xl overflow-hidden bg-white border border-gray-100 shadow-sm hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300">
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-10 bg-gray-100/70 rounded-2xl flex items-center justify-center">
          <Loader2 className="w-7 h-7 text-gray-500 animate-spin" />
        </div>
      )}

      <Link href={`/properties/${visiting.propertyId}`} className="flex flex-col flex-1">
        {/* Image area */}
        <div className="relative h-64 bg-gradient-to-br from-slate-100 via-gray-50 to-slate-200 overflow-hidden flex items-center justify-center">
          {coverImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coverImage}
              alt={visiting.title}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <svg
              className="w-20 h-20 text-gray-200 group-hover:scale-110 transition-transform duration-500"
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={0.8}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>
          )}

          {/* Visiting status — top left (hidden for agents since they use Accept/Decline) */}
          {!showActions && (
            <span className={`absolute top-3 left-3 text-sm font-semibold px-3 py-1.5 rounded-full ${VISITING_STATUS_COLORS[visiting.status] ?? "bg-gray-400 text-white"}`}>
              Status: {VISITING_STATUS_LABELS[visiting.status] ?? visiting.status}
            </span>
          )}

          {/* Property status — top right */}
          <span className={`absolute top-3 right-3 text-sm font-semibold px-3 py-1.5 rounded-full ${PROPERTY_STATUS_COLORS[visiting.propertyStatus] ?? "bg-gray-400 text-white"}`}>
            {PROPERTY_STATUS_LABELS[visiting.propertyStatus] ?? visiting.propertyStatus}
          </span>

          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/[0.04] transition-colors duration-300" />
        </div>

        {/* Content */}
        <div className="flex flex-col flex-1 p-5 gap-2">
          <p className="text-2xl font-bold text-[#CC0000] leading-tight">
            ${Number(visiting.price).toLocaleString()}
            {visiting.propertyStatus === "for_rent" && (
              <span className="text-base font-normal text-gray-400 ml-1">/mo</span>
            )}
          </p>

          <h2 className="font-semibold text-gray-900 text-base leading-snug line-clamp-1">
            {visiting.title}
          </h2>

          <p className="flex items-center gap-1.5 text-sm text-gray-400">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"/>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"/>
            </svg>
            {visiting.address}, {visiting.city}, {visiting.state}
          </p>

          {/* Booked slot */}
          <p className="flex items-center gap-1.5 text-sm font-semibold text-indigo-600">
            <svg className="w-4 h-4 shrink-0 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
            {dateLabel} · {formatHour(visiting.hour)}
          </p>

          {/* Stats row */}
          <div className="mt-auto pt-4 border-t border-gray-100 flex items-center gap-5 text-base text-gray-500">
            {visiting.bedrooms != null && (
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"/>
                </svg>
                {visiting.bedrooms} bd
              </span>
            )}
            {visiting.bathrooms != null && (
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                {visiting.bathrooms} ba
              </span>
            )}
            {visiting.squareFeet != null && (
              <span className="flex items-center gap-2 ml-auto text-sm text-gray-400">
                <svg className="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15"/>
                </svg>
                {Number(visiting.squareFeet).toLocaleString()} sqft
              </span>
            )}
          </div>
        </div>
      </Link>

      {/* Accept / Decline actions — agent only */}
      {showActions && (
        <div className="px-4 pb-4 pt-1 flex gap-2">
          <button
            type="button"
            onClick={handleAccept}
            disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-emerald-50 text-emerald-700 text-sm font-semibold border border-emerald-200 hover:bg-emerald-500 hover:text-white hover:border-emerald-500 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 shrink-0 animate-spin" />
            ) : (
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            )}
            Accept
          </button>
          <button
            type="button"
            onClick={handleDecline}
            disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-red-50 text-red-600 text-sm font-semibold border border-red-200 hover:bg-red-500 hover:text-white hover:border-red-500 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 shrink-0 animate-spin" />
            ) : (
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            Decline
          </button>
        </div>
      )}
    </div>
  );
}
