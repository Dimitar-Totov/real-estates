"use client";

import { useState, useEffect } from "react";
import {
  User, GraduationCap, Briefcase, Zap, Clock,
  Calendar, ChevronLeft, ChevronRight, Users, Loader2,
  Hash, CheckCircle2, XCircle, ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";

interface Candidate {
  id: number;
  userId: number;
  username: string;
  avatarUrl: string | null;
  personalInfo: string | null;
  education: string | null;
  workExperience: string | null;
  skills: string | null;
  availability: string | null;
  createdAt: string;
}

const FIELDS: { key: keyof Candidate; label: string; Icon: React.ElementType }[] = [
  { key: "personalInfo",   label: "Personal Info",  Icon: User          },
  { key: "education",      label: "Education",       Icon: GraduationCap },
  { key: "workExperience", label: "Work Experience", Icon: Briefcase     },
  { key: "skills",         label: "Skills",          Icon: Zap           },
  { key: "availability",   label: "Availability",    Icon: Clock         },
];

const SPECIALTIES = [
  { id: "Residential Sales",      emoji: "🏠" },
  { id: "Commercial Real Estate", emoji: "🏢" },
  { id: "Luxury Properties",      emoji: "✨" },
  { id: "Property Management",    emoji: "🔑" },
  { id: "Investment Properties",  emoji: "📈" },
  { id: "First-Time Buyers",      emoji: "🌟" },
  { id: "New Developments",       emoji: "🏗️" },
  { id: "Vacation & Resort",      emoji: "🌴" },
];

const NAVY = "#1e3a5f";
const TEAL = "#0d9488";

export default function AgentCandidatesView() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [index,      setIndex]      = useState(0);
  const [loading,    setLoading]    = useState(true);
  const [animKey,    setAnimKey]    = useState(0);
  const [direction,  setDirection]  = useState<"next" | "prev">("next");

  // Accept flow state
  const [accepting,  setAccepting]  = useState(false);
  const [specialty,  setSpecialty]  = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<"accept" | "decline" | null>(null);

  useEffect(() => {
    fetch("/api/admin/agent-candidates")
      .then((r) => r.json())
      .then((data: Candidate[]) => { setCandidates(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // Reset accept flow when card changes
  useEffect(() => {
    setAccepting(false);
    setSpecialty(null);
  }, [index]);

  const navigate = (dir: "next" | "prev") => {
    setDirection(dir);
    setIndex((i) =>
      dir === "next"
        ? (i + 1) % candidates.length
        : (i - 1 + candidates.length) % candidates.length
    );
    setAnimKey((k) => k + 1);
  };

  const removeCandidate = (id: number) => {
    setCandidates((prev) => {
      const next = prev.filter((c) => c.id !== id);
      // keep index in bounds
      setIndex((i) => Math.min(i, Math.max(next.length - 1, 0)));
      return next;
    });
    setAnimKey((k) => k + 1);
  };

  const handleAccept = async () => {
    if (!specialty || !candidate) return;
    setSubmitting("accept");
    try {
      const res = await fetch(`/api/admin/agent-candidates/${candidate.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ specialty }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to accept");
      toast.success(`${candidate.username} is now an agent!`);
      removeCandidate(candidate.id);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(null);
    }
  };

  const handleDecline = async () => {
    if (!candidate) return;
    setSubmitting("decline");
    try {
      const res = await fetch(`/api/admin/agent-candidates/${candidate.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to decline");
      toast.success(`Application from ${candidate.username} was declined.`);
      removeCandidate(candidate.id);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(null);
    }
  };

  const candidate = candidates[index];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-300" />
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center">
          <Users className="w-9 h-9 text-gray-300" />
        </div>
        <p className="text-gray-400 text-sm font-medium">No agent candidates yet.</p>
      </div>
    );
  }

  const appliedDate = new Date(candidate.createdAt).toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric",
  });
  const initial = candidate.username.charAt(0).toUpperCase();

  return (
    <>
      <style>{`
        @keyframes ac-in-right {
          from { opacity: 0; transform: translateX(52px) scale(0.985); }
          to   { opacity: 1; transform: translateX(0)    scale(1);     }
        }
        @keyframes ac-in-left {
          from { opacity: 0; transform: translateX(-52px) scale(0.985); }
          to   { opacity: 1; transform: translateX(0)     scale(1);     }
        }
        @keyframes ac-avatar-in {
          from { opacity: 0; transform: scale(0.88) translateY(12px); }
          to   { opacity: 1; transform: scale(1)    translateY(0);    }
        }
        @keyframes ac-spec-in {
          from { opacity: 0; transform: translateY(-10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .ac-slide-next  { animation: ac-in-right  0.42s cubic-bezier(0.22,1,0.36,1) both; }
        .ac-slide-prev  { animation: ac-in-left   0.42s cubic-bezier(0.22,1,0.36,1) both; }
        .ac-avatar-pop  { animation: ac-avatar-in 0.50s cubic-bezier(0.22,1,0.36,1) both 0.05s; }
        .ac-spec-grid   { animation: ac-spec-in   0.28s cubic-bezier(0.22,1,0.36,1) both; }

        .ac-arrow {
          width: 48px; height: 48px; border-radius: 50%;
          border: 2px solid #e5e7eb;
          display: flex; align-items: center; justify-content: center;
          color: #9ca3af; cursor: pointer; background: white;
          transition: border-color 0.18s, color 0.18s, box-shadow 0.18s, transform 0.12s;
        }
        .ac-arrow:hover  { border-color: #0d9488; color: #0d9488; box-shadow: 0 4px 16px rgba(13,148,136,0.22); transform: scale(1.08); }
        .ac-arrow:active { transform: scale(0.94); }

        .ac-dot { width: 8px; height: 8px; border-radius: 50%; background: #e5e7eb; cursor: pointer; transition: background 0.2s, transform 0.2s; }
        .ac-dot-active  { background: #0d9488; transform: scale(1.3); }

        .ac-field-row {
          display: flex; gap: 14px; align-items: flex-start;
          padding: 14px 0; border-bottom: 1px solid #f3f4f6;
          border-radius: 0; transition: background 0.15s, border-radius 0.15s, padding-left 0.15s;
        }
        .ac-field-row:last-child { border-bottom: none; }
        .ac-field-row:hover { background: #fafafa; border-radius: 12px; padding-left: 8px; }

        /* ── Accept button ── */
        .ac-btn-accept {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          padding: 11px 28px; border-radius: 14px;
          font-size: 0.875rem; font-weight: 700;
          color: white; border: none; cursor: pointer;
          background: linear-gradient(135deg, #059669 0%, #047857 100%);
          box-shadow: 0 4px 14px rgba(5,150,105,0.32);
          transition: filter 0.18s, box-shadow 0.18s, transform 0.12s, opacity 0.18s;
        }
        .ac-btn-accept:hover:not(:disabled)  { filter: brightness(1.1); box-shadow: 0 6px 22px rgba(5,150,105,0.45); transform: translateY(-1px); }
        .ac-btn-accept:active:not(:disabled) { transform: scale(0.96) translateY(0); }
        .ac-btn-accept:disabled { opacity: 0.45; cursor: not-allowed; box-shadow: none; }

        /* ── Decline button ── */
        .ac-btn-decline {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          padding: 11px 28px; border-radius: 14px;
          font-size: 0.875rem; font-weight: 700;
          color: #ef4444; background: transparent;
          border: 2px solid #fecaca; cursor: pointer;
          transition: background 0.18s, border-color 0.18s, color 0.18s, box-shadow 0.18s, transform 0.12s, opacity 0.18s;
        }
        .ac-btn-decline:hover:not(:disabled)  { background: #fef2f2; border-color: #ef4444; box-shadow: 0 4px 14px rgba(239,68,68,0.18); transform: translateY(-1px); }
        .ac-btn-decline:active:not(:disabled) { transform: scale(0.96) translateY(0); }
        .ac-btn-decline:disabled { opacity: 0.45; cursor: not-allowed; }

        /* ── Back button ── */
        .ac-btn-back {
          display: flex; align-items: center; justify-content: center; gap: 6px;
          padding: 11px 20px; border-radius: 14px;
          font-size: 0.875rem; font-weight: 600;
          color: #6b7280; background: transparent;
          border: 2px solid #e5e7eb; cursor: pointer;
          transition: border-color 0.18s, color 0.18s, background 0.18s, transform 0.12s;
        }
        .ac-btn-back:hover  { border-color: #9ca3af; color: #374151; background: #f9fafb; }
        .ac-btn-back:active { transform: scale(0.96); }

        /* ── Specialty pill ── */
        .ac-spec-pill {
          display: flex; align-items: center; gap: 6px;
          padding: 7px 13px; border-radius: 10px; border: 1.5px solid #e5e7eb;
          background: #fafafa; cursor: pointer; font-size: 0.8125rem; font-weight: 600; color: #374151;
          transition: border-color 0.15s, background 0.15s, box-shadow 0.15s, transform 0.1s, color 0.15s;
          white-space: nowrap;
        }
        .ac-spec-pill:hover  { border-color: #6ee7b7; background: #f0fdf4; color: #065f46; transform: translateY(-1px); }
        .ac-spec-pill:active { transform: scale(0.95) translateY(0); }
        .ac-spec-pill-active {
          border-color: #059669 !important; background: #ecfdf5 !important;
          color: #065f46 !important; box-shadow: 0 0 0 3px rgba(5,150,105,0.15) !important;
        }
      `}</style>

      <div className="p-6 lg:p-10">
        {/* ── Section header ── */}
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-extrabold" style={{ color: NAVY }}>Agent Candidates</h2>
            <p className="text-sm text-gray-400 mt-1">
              {candidates.length} application{candidates.length !== 1 ? "s" : ""} received
            </p>
          </div>
          {candidates.length > 1 && (
            <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-3 py-1.5 rounded-full">
              {index + 1} of {candidates.length}
            </span>
          )}
        </div>

        {/* ── Card ── */}
        <div
          className="mx-auto rounded-3xl shadow-xl border border-gray-100 overflow-hidden"
          style={{ maxWidth: 920, background: "#f8fafc" }}
        >
          <div
            key={animKey}
            className={`flex flex-col md:flex-row ${direction === "next" ? "ac-slide-next" : "ac-slide-prev"}`}
            style={{ minHeight: 520 }}
          >
            {/* ══ Left: Avatar section ══ */}
            <div
              className="md:w-[38%] shrink-0 flex flex-col items-center justify-center py-12 px-8 relative overflow-hidden"
              style={{ background: `linear-gradient(150deg, ${NAVY} 0%, #164e63 55%, ${TEAL} 100%)` }}
            >
              {/* Decorative rings */}
              <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full pointer-events-none" style={{ border: "1px solid rgba(255,255,255,0.07)" }} />
              <div className="absolute -bottom-16 -right-16 w-56 h-56 rounded-full pointer-events-none" style={{ border: "1px solid rgba(255,255,255,0.07)" }} />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(255,255,255,0.04) 0%, transparent 70%)" }} />

              {/* Avatar */}
              <div
                className="ac-avatar-pop relative z-10 mb-6"
                style={{ width: 152, height: 152, borderRadius: "50%", boxShadow: "0 0 0 6px rgba(255,255,255,0.15), 0 20px 48px rgba(0,0,0,0.35)", overflow: "hidden" }}
              >
                {candidate.avatarUrl ? (
                  <img src={candidate.avatarUrl} alt={candidate.username} className="w-full h-full object-cover" />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center text-6xl font-extrabold text-white select-none"
                    style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.06) 100%)" }}
                  >
                    {initial}
                  </div>
                )}
              </div>

              <h3 className="relative z-10 text-xl font-bold text-white text-center tracking-tight">{candidate.username}</h3>

              <div className="relative z-10 mt-2 flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold" style={{ background: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.7)" }}>
                <Hash className="w-3 h-3" />
                Candidate {candidate.id}
              </div>

              <div className="relative z-10 mt-5 flex items-center gap-2 text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
                <Calendar className="w-3.5 h-3.5" />
                <span>Applied {appliedDate}</span>
              </div>
            </div>

            {/* ── Thin gap divider ── */}
            <div className="hidden md:block w-1 shrink-0 self-stretch bg-gradient-to-b from-transparent via-gray-200 to-transparent mx-1" />

            {/* ══ Right: Info section ══ */}
            <div className="flex-1 flex flex-col bg-white px-8 py-10 md:px-10">
              {/* Heading */}
              <div className="mb-5">
                <h2 className="text-3xl font-extrabold tracking-tight" style={{ color: NAVY }}>
                  {candidate.username}
                </h2>
                <div className="flex items-center gap-2 mt-2">
                  <div className="h-0.5 w-10 rounded-full" style={{ background: `linear-gradient(to right, ${TEAL}, ${NAVY})` }} />
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Agent Application</p>
                </div>
              </div>

              {/* Fields */}
              <div className="flex-1 overflow-y-auto -mx-2 px-2 mb-6">
                {FIELDS.map(({ key, label, Icon }) => {
                  const value = candidate[key] as string | null;
                  return (
                    <div key={key} className="ac-field-row">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5" style={{ background: "rgba(13,148,136,0.09)" }}>
                        <Icon className="w-4 h-4" style={{ color: TEAL }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">{label}</p>
                        <p className="text-sm leading-relaxed" style={{ color: value ? "#1f2937" : "#d1d5db", fontStyle: value ? "normal" : "italic" }}>
                          {value ?? "Not provided"}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ══ Action area ══ */}
              <div className="border-t border-gray-100 pt-5">
                {!accepting ? (
                  /* ── Default: Accept + Decline ── */
                  <div className="flex items-center gap-3 flex-wrap">
                    <button
                      className="ac-btn-accept"
                      onClick={() => setAccepting(true)}
                      disabled={submitting !== null}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Accept
                    </button>
                    <button
                      className="ac-btn-decline"
                      onClick={handleDecline}
                      disabled={submitting !== null}
                    >
                      {submitting === "decline"
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <XCircle className="w-4 h-4" />
                      }
                      Decline
                    </button>
                  </div>
                ) : (
                  /* ── Accept flow: pick specialty ── */
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">
                      Choose a specialty for {candidate.username}
                    </p>
                    <div className="ac-spec-grid flex flex-wrap gap-2 mb-4">
                      {SPECIALTIES.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => setSpecialty(s.id === specialty ? null : s.id)}
                          className={`ac-spec-pill ${specialty === s.id ? "ac-spec-pill-active" : ""}`}
                          disabled={submitting !== null}
                        >
                          <span className="text-base leading-none">{s.emoji}</span>
                          {s.id}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        className="ac-btn-accept"
                        onClick={handleAccept}
                        disabled={!specialty || submitting !== null}
                      >
                        {submitting === "accept"
                          ? <Loader2 className="w-4 h-4 animate-spin" />
                          : <CheckCircle2 className="w-4 h-4" />
                        }
                        Confirm Accept
                      </button>
                      <button
                        className="ac-btn-back"
                        onClick={() => { setAccepting(false); setSpecialty(null); }}
                        disabled={submitting !== null}
                      >
                        <ArrowLeft className="w-4 h-4" />
                        Back
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Navigation ── */}
        {candidates.length > 1 && (
          <div className="flex flex-col items-center gap-5 mt-8">
            <div className="flex items-center gap-5">
              <button className="ac-arrow" onClick={() => navigate("prev")} aria-label="Previous">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-sm font-bold tabular-nums" style={{ color: NAVY, minWidth: 56, textAlign: "center" }}>
                {index + 1} / {candidates.length}
              </span>
              <button className="ac-arrow" onClick={() => navigate("next")} aria-label="Next">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              {candidates.map((_, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setDirection(i > index ? "next" : "prev");
                    setIndex(i);
                    setAnimKey((k) => k + 1);
                  }}
                  className={`ac-dot ${i === index ? "ac-dot-active" : ""}`}
                  aria-label={`Go to candidate ${i + 1}`}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
