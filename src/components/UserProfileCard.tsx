"use client";

import { MapPin, UserCheck, MessageCircle, Phone, Smartphone, Mail } from "lucide-react";

export interface UserResult {
  id: number;
  username: string;
  email: string;
  role: string;
  avatarUrl: string | null;
  location: string | null;
  createdAt: string;
  officePhone: string | null;
  mobilePhone: string | null;
  contactEmail: string | null;
}

const TEAL = "#0d9488";
const NAVY = "#1e3a5f";

export default function UserProfileCard({
  user,
  onMakeAgent,
  onMessage,
}: {
  user: UserResult;
  onMakeAgent?: () => void;
  onMessage?: () => void;
}) {
  const hasContact = !!(user.officePhone || user.mobilePhone || user.contactEmail);
  const joinedDate = new Date(user.createdAt).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <>
      <style>{`
        @keyframes upc-in {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .upc-card { animation: upc-in 0.45s cubic-bezier(0.22,1,0.36,1) both; }
        .upc-msg { transition: transform 0.18s ease, background 0.18s ease, box-shadow 0.18s ease; }
        .upc-msg:hover { transform: scale(1.05); background: rgba(255,255,255,1); box-shadow: 0 2px 10px rgba(13,148,136,0.20); }
        .upc-make { transition: box-shadow 0.2s ease, filter 0.2s ease, transform 0.15s ease; }
        .upc-make:hover { box-shadow: 0 8px 28px rgba(13,148,136,0.40); filter: brightness(1.07); }
        .upc-make:active { transform: scale(0.97); }
        .upc-email { transition: background 0.15s ease; border-radius: 0.75rem; }
        .upc-email:hover { background: #f0fdfa; }
      `}</style>

      <div
        className="upc-card bg-white rounded-3xl shadow-xl w-full"
        style={{ fontFamily: "var(--font-inter), Inter, sans-serif", maxWidth: 520 }}
      >
        {/* ── Gradient header ─────────────────────────────────────────────── */}
        <div
          className="relative rounded-t-3xl px-8 pt-6 h-32"
          style={{ background: `linear-gradient(135deg, ${TEAL} 0%, ${NAVY} 100%)` }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-medium text-white/80">
              <UserCheck className="w-3.5 h-3.5 text-teal-300 shrink-0" />
              Joined {joinedDate}
            </div>
            <button onClick={onMessage} className="upc-msg flex items-center gap-1.5 text-sm font-semibold text-teal-700 bg-white/85 backdrop-blur-sm px-3.5 py-1.5 rounded-full">
              <MessageCircle className="w-4 h-4" />
              Message
            </button>
          </div>
        </div>

        {/* ── Avatar ──────────────────────────────────────────────────────── */}
        <div className="flex justify-center -mt-16 relative z-10">
          <div
            className="w-32 h-32 rounded-full border-4 border-white shadow-lg overflow-hidden flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${TEAL}, ${NAVY})` }}
          >
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.username} className="w-full h-full object-cover" />
            ) : (
              <span className="text-5xl font-bold text-white select-none">
                {user.username.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
        </div>

        {/* ── Body ────────────────────────────────────────────────────────── */}
        <div className="px-9 pt-5 pb-9">
          {/* Name */}
          <h2 className="text-3xl font-extrabold text-gray-900 text-center tracking-tight">
            {user.username}
          </h2>

          {/* Location */}
          <div className="flex items-center justify-center gap-1 mt-1.5">
            <MapPin className="w-4 h-4 shrink-0" style={{ color: TEAL }} />
            <span className="text-sm text-gray-400">{user.location || "No location set"}</span>
          </div>

          {/* Contact info */}
          <div className="border-t border-gray-100 my-5" />
          <div className="space-y-1">
            {user.officePhone ? (
              <div className="flex items-center gap-3 px-3 py-2.5">
                <Phone className="w-4 h-4 shrink-0" style={{ color: TEAL }} />
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Office</span>
                  <span className="text-sm text-gray-700">{user.officePhone}</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 px-3 py-2.5">
                <Phone className="w-4 h-4 shrink-0 text-gray-300" />
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-300">Office</span>
                  <span className="text-sm text-gray-300 italic">No office phone added yet</span>
                </div>
              </div>
            )}
            {user.mobilePhone ? (
              <div className="flex items-center gap-3 px-3 py-2.5">
                <Smartphone className="w-4 h-4 shrink-0" style={{ color: TEAL }} />
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Mobile</span>
                  <span className="text-sm text-gray-700">{user.mobilePhone}</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 px-3 py-2.5">
                <Smartphone className="w-4 h-4 shrink-0 text-gray-300" />
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-300">Mobile</span>
                  <span className="text-sm text-gray-300 italic">No mobile phone added yet</span>
                </div>
              </div>
            )}
            {user.contactEmail ? (
              <a
                href={`mailto:${user.contactEmail}`}
                className="upc-email flex items-center gap-3 px-3 py-2.5 cursor-pointer"
              >
                <Mail className="w-4 h-4 shrink-0" style={{ color: TEAL }} />
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Email</span>
                  <span className="text-sm break-all" style={{ color: TEAL }}>{user.contactEmail}</span>
                </div>
              </a>
            ) : (
              <div className="flex items-center gap-3 px-3 py-2.5">
                <Mail className="w-4 h-4 shrink-0 text-gray-300" />
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-300">Email</span>
                  <span className="text-sm text-gray-300 italic">No contact email added yet</span>
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-gray-100 mt-5 mb-5" />

          {/* Make Agent */}
          {hasContact ? (
            <button
              onClick={onMakeAgent}
              className="upc-make w-full py-3.5 rounded-full font-semibold text-white text-sm"
              style={{ background: `linear-gradient(135deg, ${TEAL} 0%, ${NAVY} 100%)` }}
            >
              Make Agent
            </button>
          ) : (
            <div className="w-full py-3.5 rounded-full text-center text-sm font-semibold text-gray-400 bg-gray-100 cursor-not-allowed select-none"
              title="User has no contact information — add a phone or email first">
              No Contact Info
            </div>
          )}
        </div>
      </div>
    </>
  );
}
