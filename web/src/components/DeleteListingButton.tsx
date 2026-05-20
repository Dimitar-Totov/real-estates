"use client";

import { useState } from "react";
import { Trash2, AlertTriangle, Loader2 } from "lucide-react";

interface Props {
  propertyId: number;
  onDeleted: (id: number) => void;
}

export default function DeleteListingButton({ propertyId, onDeleted }: Props) {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/properties/${propertyId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to delete listing.");
      }
      onDeleted(propertyId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete listing.");
      setLoading(false);
      setConfirming(false);
    }
  };

  if (confirming) {
    return (
      <div className="flex flex-col gap-2 p-3 rounded-xl bg-red-50 border border-red-200 animate-in fade-in slide-in-from-bottom-1 duration-200">
        <div className="flex items-center gap-2 text-red-700">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span className="text-xs font-semibold">Delete this listing?</span>
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
        <div className="flex gap-2">
          <button
            onClick={handleDelete}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-xs font-semibold shadow-sm transition-all duration-150 disabled:opacity-60"
          >
            {loading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Trash2 className="w-3.5 h-3.5" />
            )}
            {loading ? "Deleting…" : "Yes, delete"}
          </button>
          <button
            onClick={() => { setConfirming(false); setError(null); }}
            disabled={loading}
            className="px-3 py-1.5 rounded-lg bg-white hover:bg-gray-100 active:bg-gray-200 text-gray-600 text-xs font-semibold border border-gray-200 shadow-sm transition-all duration-150 disabled:opacity-60"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="group flex items-center gap-2 w-full px-3.5 py-2.5 rounded-xl bg-white border border-gray-200 hover:border-red-300 hover:bg-red-50 active:bg-red-100 shadow-sm hover:shadow-md text-gray-500 hover:text-red-600 text-sm font-medium transition-all duration-200"
    >
      <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-gray-100 group-hover:bg-red-100 transition-colors duration-200">
        <Trash2 className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
      </span>
      Delete listing
    </button>
  );
}
