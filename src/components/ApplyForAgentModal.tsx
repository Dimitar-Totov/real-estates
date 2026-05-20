"use client";

import { useState } from "react";
import { X, Loader2, CheckCircle2, User, GraduationCap, Briefcase, Zap, Clock } from "lucide-react";

interface Props {
  username: string;
  onClose: () => void;
}

const FIELDS = [
  {
    key: "personalInfo" as const,
    label: "Personal Info",
    Icon: User,
    placeholder: "Tell us about yourself — your background, personality, and what drives you...",
    hint: "Give us a brief overview of who you are",
  },
  {
    key: "education" as const,
    label: "Education",
    Icon: GraduationCap,
    placeholder: "e.g. BSc in Business Administration, Real Estate License, RICS qualification...",
    hint: "List your degrees, certifications, and relevant training",
  },
  {
    key: "workExperience" as const,
    label: "Work Experience",
    Icon: Briefcase,
    placeholder: "e.g. 3 years as a sales associate at XYZ Realty, property management...",
    hint: "Describe your experience in real estate or related fields",
  },
  {
    key: "skills" as const,
    label: "Skills",
    Icon: Zap,
    placeholder: "e.g. Negotiation, Market Analysis, CRM Tools, Client Relations, Photography...",
    hint: "List key skills that make you a great agent",
  },
  {
    key: "availability" as const,
    label: "Availability",
    Icon: Clock,
    placeholder: "e.g. Full-time, available weekends, starting from June 2025...",
    hint: "Let us know when and how much you're available to work",
  },
] as const;

type FieldKey = (typeof FIELDS)[number]["key"];

export default function ApplyForAgentModal({ username, onClose }: Props) {
  const [values, setValues] = useState<Record<FieldKey, string>>({
    personalInfo: "",
    education: "",
    workExperience: "",
    skills: "",
    availability: "",
  });
  const [focused, setFocused] = useState<FieldKey | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = Object.values(values).some((v) => v.trim().length > 0) && !loading;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/agent-candidates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personalInfo: values.personalInfo || null,
          education: values.education || null,
          workExperience: values.workExperience || null,
          skills: values.skills || null,
          availability: values.availability || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submission failed");
      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
        .afa-root * { font-family: 'DM Sans', sans-serif; }

        @keyframes afa-fade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes afa-rise {
          from { opacity: 0; transform: translateY(44px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
        .afa-backdrop { animation: afa-fade 0.22s ease both; }
        .afa-card     { animation: afa-rise 0.42s cubic-bezier(0.22,1,0.36,1) both; }

        .afa-textarea {
          width: 100%;
          border: 1.5px solid #e2e8f0;
          border-radius: 0.875rem;
          padding: 0.8rem 1rem;
          font-size: 0.9375rem;
          color: #111827;
          background: #f8fafc;
          outline: none;
          resize: none;
          transition: border-color 0.18s, box-shadow 0.18s, background 0.18s;
          line-height: 1.65;
          min-height: 88px;
        }
        .afa-textarea:focus {
          border-color: #7c3aed;
          box-shadow: 0 0 0 3.5px rgba(124,58,237,0.14);
          background: #ffffff;
        }
        .afa-textarea::placeholder { color: #94a3b8; }

        @media (prefers-color-scheme: dark) {
          .afa-card       { background: #1e293b !important; }
          .afa-body-sep   { border-color: #334155 !important; }
          .afa-field-hint { color: #64748b !important; }
          .afa-textarea {
            background: #0f172a !important;
            border-color: #334155 !important;
            color: #e2e8f0 !important;
          }
          .afa-textarea:focus {
            border-color: #7c3aed !important;
            background: #1e293b !important;
            box-shadow: 0 0 0 3.5px rgba(124,58,237,0.22) !important;
          }
          .afa-textarea::placeholder { color: #475569 !important; }
          .afa-success-ring { background: #1e1b4b !important; }
          .afa-success-text { color: #f1f5f9 !important; }
          .afa-success-sub  { color: #94a3b8 !important; }
        }
      `}</style>

      <div
        className="afa-backdrop afa-root fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
        style={{ backgroundColor: "rgba(8,12,28,0.74)", backdropFilter: "blur(10px)" }}
      >
        <div
          className="afa-card bg-white rounded-2xl shadow-2xl w-full flex flex-col overflow-hidden"
          style={{ maxWidth: 600, maxHeight: "92vh" }}
        >
          {/* ── Header ── */}
          <div
            className="relative px-8 pt-8 pb-7 shrink-0"
            style={{ background: "linear-gradient(135deg, #7c3aed 0%, #4338ca 100%)" }}
          >
            <button
              onClick={onClose}
              className="absolute top-5 right-5 w-9 h-9 flex items-center justify-center rounded-full text-white/60 hover:text-white hover:bg-white/15 transition-all duration-150"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-5">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
                style={{ background: "rgba(255,255,255,0.16)", backdropFilter: "blur(4px)" }}
              >
                <Briefcase className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white tracking-tight leading-tight">
                  Apply to Become an Agent
                </h2>
                <p className="text-white/60 text-sm mt-1">
                  Hi{" "}
                  <span className="font-semibold text-white/90">{username}</span>
                  {" "}— fill in what you can and we'll be in touch.
                </p>
              </div>
            </div>

            {/* Decorative blobs */}
            <div
              className="absolute -bottom-6 -right-6 w-32 h-32 rounded-full pointer-events-none"
              style={{ background: "rgba(255,255,255,0.06)" }}
            />
            <div
              className="absolute -top-8 -left-8 w-24 h-24 rounded-full pointer-events-none"
              style={{ background: "rgba(255,255,255,0.04)" }}
            />
          </div>

          {/* ── Body ── */}
          {success ? (
            <div className="flex flex-col items-center justify-center gap-6 px-8 py-16">
              <div
                className="afa-success-ring w-24 h-24 rounded-full bg-violet-50 flex items-center justify-center"
                style={{ boxShadow: "0 0 0 8px rgba(124,58,237,0.08)" }}
              >
                <CheckCircle2 className="w-13 h-13 text-violet-500" style={{ width: 52, height: 52 }} />
              </div>
              <div className="text-center">
                <p className="afa-success-text text-3xl font-bold text-gray-900 tracking-tight">
                  Application Submitted!
                </p>
                <p className="afa-success-sub text-base text-gray-400 mt-3 max-w-xs mx-auto leading-relaxed">
                  Our team will review your application and reach out to you shortly.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="px-8 py-6 space-y-6 overflow-y-auto flex-1">
                {FIELDS.map(({ key, label, Icon, placeholder, hint }) => {
                  const active = focused === key;
                  return (
                    <div key={key}>
                      <div className="flex items-center gap-2 mb-1">
                        <Icon
                          className="w-4 h-4 transition-colors duration-150"
                          style={{ color: active ? "#7c3aed" : "#9ca3af" }}
                        />
                        <span
                          className="text-sm font-semibold tracking-wide transition-colors duration-150"
                          style={{ color: active ? "#7c3aed" : "#6b7280" }}
                        >
                          {label}
                        </span>
                      </div>
                      <p className="afa-field-hint text-xs text-gray-400 mb-2 ml-6">{hint}</p>
                      <textarea
                        className="afa-textarea"
                        placeholder={placeholder}
                        value={values[key]}
                        onChange={(e) => setValues((prev) => ({ ...prev, [key]: e.target.value }))}
                        onFocus={() => setFocused(key)}
                        onBlur={() => setFocused(null)}
                        rows={3}
                      />
                    </div>
                  );
                })}
              </div>

              {/* ── Footer ── */}
              <div className="afa-body-sep px-8 pb-7 pt-5 border-t border-gray-100 flex flex-col items-end gap-3 shrink-0">
                {error && (
                  <p className="text-sm text-red-500 self-start">{error}</p>
                )}
                <button
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  className="flex items-center gap-2.5 px-8 py-3.5 rounded-full text-base font-semibold text-white transition-all duration-150 hover:brightness-110 active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    background: "linear-gradient(135deg, #7c3aed 0%, #4338ca 100%)",
                    boxShadow: canSubmit ? "0 4px 20px rgba(124,58,237,0.38)" : undefined,
                  }}
                >
                  {loading
                    ? <Loader2 className="w-5 h-5 animate-spin" />
                    : <Briefcase className="w-5 h-5" />
                  }
                  Submit Application
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
