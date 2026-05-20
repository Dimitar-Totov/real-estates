"use client";

import { useState } from "react";
import { Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import type { UserResult } from "./UserProfileCard";

const TEAL = "#0d9488";
const NAVY = "#1e3a5f";

const SPECIALTIES = [
  { id: "Residential Sales",      emoji: "🏠", desc: "Houses & apartments"   },
  { id: "Commercial Real Estate", emoji: "🏢", desc: "Office & retail space"  },
  { id: "Luxury Properties",      emoji: "✨", desc: "High-end estates"       },
  { id: "Property Management",    emoji: "🔑", desc: "Rentals & tenants"      },
  { id: "Investment Properties",  emoji: "📈", desc: "ROI-focused deals"      },
  { id: "First-Time Buyers",      emoji: "🌟", desc: "Starter home guide"     },
  { id: "New Developments",       emoji: "🏗️", desc: "Off-plan & builds"     },
  { id: "Vacation & Resort",      emoji: "🌴", desc: "Holiday properties"     },
];

interface Props {
  user: UserResult;
  onClose: () => void;
  onSuccess: () => void;
}

export default function MakeAgentModal({ user, onClose, onSuccess }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  const phone = user.officePhone || user.mobilePhone || "";
  const email = user.contactEmail || user.email;

  const handleConfirm = async () => {
    if (!selected || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId:    user.id,
          name:      user.username,
          specialty: selected,
          city:      user.location || "Unknown",
          image:     user.avatarUrl || "",
          phone,
          email,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create agent");
      toast.success(`${user.username} is now an agent!`);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @keyframes mam-backdrop { from { opacity: 0 } to { opacity: 1 } }
        @keyframes mam-card {
          from { opacity: 0; transform: translateY(36px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0)   scale(1);    }
        }
        .mam-backdrop { animation: mam-backdrop 0.22s ease both; }
        .mam-card     { animation: mam-card 0.38s cubic-bezier(0.22,1,0.36,1) both; }
        .mam-spec { transition: border-color 0.15s ease, background 0.15s ease, box-shadow 0.15s ease, transform 0.12s ease; }
        .mam-spec:hover  { transform: translateY(-2px); }
        .mam-spec:active { transform: scale(0.96); }
        .mam-confirm { transition: box-shadow 0.2s ease, filter 0.15s ease, transform 0.12s ease, background 0.15s ease; }
        .mam-confirm:hover:not(:disabled)  { filter: brightness(1.08); box-shadow: 0 6px 22px rgba(13,148,136,0.40); }
        .mam-confirm:active:not(:disabled) { transform: scale(0.97); }
        .mam-cancel { transition: border-color 0.15s ease, color 0.15s ease, background 0.15s ease, transform 0.12s ease; }
        .mam-cancel:hover:not(:disabled)  { border-color: #9ca3af; color: #111827; background: #f9fafb; }
        .mam-cancel:active:not(:disabled) { transform: scale(0.97); }
      `}</style>

      {/* Backdrop */}
      <div
        className="mam-backdrop fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
        style={{ backgroundColor: "rgba(10,18,35,0.65)", backdropFilter: "blur(7px)" }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        {/* Card */}
        <div
          className="mam-card bg-white rounded-3xl shadow-2xl w-full overflow-hidden"
          style={{ maxWidth: 560 }}
        >
          {/* ── Header ── */}
          <div
            className="px-7 pt-7 pb-6 sm:px-8"
            style={{ background: `linear-gradient(135deg, ${TEAL} 0%, ${NAVY} 100%)` }}
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl shrink-0">
                🏡
              </div>
              <div className="min-w-0">
                <h2 className="text-lg sm:text-xl font-bold text-white leading-tight">
                  Assign as Agent
                </h2>
                <p className="text-sm text-white/65 mt-0.5 truncate">
                  Setting up{" "}
                  <span className="font-semibold text-white/90">{user.username}</span>{" "}
                  as a real estate agent
                </p>
              </div>
            </div>
          </div>

          {/* ── Body ── */}
          <div className="px-7 py-6 sm:px-8">
            <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-3.5">
              Choose a speciality
            </p>

            {/* Specialty grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {SPECIALTIES.map((s) => {
                const active = selected === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => setSelected(s.id)}
                    className="mam-spec flex flex-col items-center gap-1.5 px-2 py-3.5 rounded-2xl border-2 text-center focus:outline-none"
                    style={{
                      borderColor:     active ? TEAL        : "#e5e7eb",
                      backgroundColor: active ? "#f0fdfa"   : "#fafafa",
                      boxShadow:       active ? `0 0 0 3px rgba(13,148,136,0.14)` : undefined,
                    }}
                  >
                    <span className="text-[22px] leading-none">{s.emoji}</span>
                    <span
                      className="text-[11px] font-bold leading-snug"
                      style={{ color: active ? TEAL : "#374151" }}
                    >
                      {s.id}
                    </span>
                    <span className="text-[9px] text-gray-400 leading-tight">{s.desc}</span>
                  </button>
                );
              })}
            </div>

            {/* Error */}
            {error && (
              <p className="mt-4 text-[13px] text-red-500 text-center font-medium">{error}</p>
            )}

            {/* ── Buttons ── */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={onClose}
                disabled={loading}
                className="mam-cancel flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-500 font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={!selected || loading}
                className="mam-confirm flex-1 py-3 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
                style={{
                  background: selected
                    ? `linear-gradient(135deg, ${TEAL} 0%, ${NAVY} 100%)`
                    : "#d1d5db",
                  boxShadow: selected ? "0 4px 16px rgba(13,148,136,0.32)" : undefined,
                }}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Confirm
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
