"use client";

import { useState } from "react";
import { X, Loader2, CheckCircle2, Send } from "lucide-react";

export interface MessageSender   { id: number; name: string; email: string }
export interface MessageReceiver { id: number; name: string }

interface Props {
  sender:         MessageSender;
  receiver:       MessageReceiver;
  onClose:        () => void;
  initialSubject?: string;
}

export default function SendMessageModal({ sender, receiver, onClose, initialSubject = "" }: Props) {
  const [subject, setSubject] = useState(initialSubject);
  const [body,    setBody]    = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const canSend = subject.trim().length > 0 && body.trim().length > 0 && !loading;

  const handleSend = async () => {
    if (!canSend) return;
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch("/api/messages", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ receiverId: receiver.id, subject, message: body }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send message");
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
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&display=swap');
        .smm-root * { font-family: 'DM Sans', sans-serif; }

        @keyframes smm-bg { from { opacity:0 } to { opacity:1 } }
        @keyframes smm-up {
          from { opacity:0; transform: translateY(36px) scale(0.97); }
          to   { opacity:1; transform: translateY(0)    scale(1);    }
        }
        .smm-bg   { animation: smm-bg 0.22s ease both; }
        .smm-card { animation: smm-up 0.38s cubic-bezier(0.22,1,0.36,1) both; }

        .smm-input {
          width:100%; border:1.5px solid #e5e7eb; border-radius:0.875rem;
          padding:0.8rem 1rem; font-size:0.9375rem; color:#111827;
          background:#fafafa; outline:none;
          transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
        }
        .smm-input:focus {
          border-color:#0d9488; box-shadow:0 0 0 3px rgba(13,148,136,0.13); background:#fff;
        }
        .smm-input::placeholder { color:#9ca3af; }

        .smm-textarea {
          width:100%; border:1.5px solid #e5e7eb; border-radius:0.875rem;
          padding:0.875rem 1rem; font-size:0.9375rem; color:#111827;
          background:#fafafa; outline:none; resize:none; flex:1;
          transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
          line-height:1.6;
        }
        .smm-textarea:focus {
          border-color:#0d9488; box-shadow:0 0 0 3px rgba(13,148,136,0.13); background:#fff;
        }
        .smm-textarea::placeholder { color:#9ca3af; }

        @media (prefers-color-scheme: dark) {
          .smm-card        { background:#1e293b !important; }
          .smm-label       { color:#94a3b8 !important; }
          .smm-title       { color:#f1f5f9 !important; }
          .smm-to          { color:#cbd5e1 !important; }
          .smm-sender-name { color:#e2e8f0 !important; }
          .smm-sender-mail { color:#94a3b8 !important; }
          .smm-sender-box  { background:#0f172a !important; border-color:#334155 !important; }
          .smm-border      { border-color:#334155 !important; }
          .smm-input, .smm-textarea {
            background:#0f172a !important; border-color:#334155 !important; color:#e2e8f0 !important;
          }
          .smm-input:focus, .smm-textarea:focus {
            border-color:#0d9488 !important; background:#1e293b !important;
          }
        }
      `}</style>

      {/* ── Backdrop — no click-outside close ── */}
      <div
        className="smm-bg smm-root fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
        style={{ backgroundColor: "rgba(10,18,35,0.68)", backdropFilter: "blur(9px)" }}
      >
        {/* ── Card ── */}
        <div
          className="smm-card bg-white rounded-2xl shadow-2xl w-full flex flex-col overflow-hidden"
          style={{ maxWidth: 800 }}
        >
          {/* ── Header ── */}
          <div className="smm-border flex items-center justify-between px-9 pt-7 pb-5 border-b border-gray-100">
            <div>
              <h2 className="smm-title text-2xl font-bold text-gray-900 tracking-tight">
                Send a Message
              </h2>
              <p className="smm-to text-sm text-gray-400 mt-1">
                To: <span className="font-semibold text-gray-700">{receiver.name}</span>
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* ── Body ── */}
          {success ? (
            /* ── Success state — bigger, no Close button, only X ── */
            <div className="flex flex-col items-center justify-center gap-6 px-9 py-20">
              <div className="w-24 h-24 rounded-full bg-teal-50 flex items-center justify-center">
                <CheckCircle2 className="w-14 h-14 text-teal-500" />
              </div>
              <div className="text-center max-w-md">
                <p className="smm-title text-3xl font-bold text-gray-900 tracking-tight">
                  Message sent!
                </p>
                <p className="smm-label text-base text-gray-400 mt-3 leading-relaxed">
                  Your message has been successfully delivered to{" "}
                  <span className="font-semibold text-gray-600">{receiver.name}</span>.
                  They will be able to read and reply to it shortly.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* ── Two-column form ── */}
              <div
                className="px-9 py-8 grid grid-cols-1 md:grid-cols-2 gap-8"
                style={{ minHeight: 320 }}
              >
                {/* ── Left column ── */}
                <div className="flex flex-col gap-6">
                  {/* Sending as */}
                  <div>
                    <p className="smm-label text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">
                      Sending as
                    </p>
                    <div className="smm-sender-box flex items-center gap-4 px-5 py-4 rounded-xl bg-gray-50 border border-gray-100">
                      <div
                        className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 text-white font-bold text-base select-none"
                        style={{ background: "linear-gradient(135deg, #0d9488, #1e3a5f)" }}
                      >
                        {sender.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="smm-sender-name text-base font-semibold text-gray-800 truncate">
                          {sender.name}
                        </p>
                        <p className="smm-sender-mail text-sm text-gray-400 truncate">
                          {sender.email}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Subject */}
                  <div className="flex flex-col gap-2">
                    <label className="smm-label text-xs font-bold uppercase tracking-widest text-gray-400">
                      Subject
                    </label>
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="What's this about?"
                      className="smm-input"
                      maxLength={120}
                    />
                  </div>
                </div>

                {/* ── Right column ── */}
                <div className="flex flex-col gap-2" style={{ minHeight: 240 }}>
                  <label className="smm-label text-xs font-bold uppercase tracking-widest text-gray-400">
                    Your Message
                  </label>
                  <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Write your message here…"
                    className="smm-textarea flex-1"
                    style={{ minHeight: 200 }}
                  />
                </div>
              </div>

              {/* ── Footer ── */}
              <div className="px-9 pb-8 flex flex-col items-end gap-2">
                {error && (
                  <p className="text-sm text-red-500 self-start">{error}</p>
                )}
                <button
                  onClick={handleSend}
                  disabled={!canSend}
                  className="flex items-center gap-2.5 px-8 py-3.5 rounded-full text-base font-semibold text-white transition-all duration-150 hover:brightness-110 active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    background: "linear-gradient(135deg, #0d9488 0%, #1e3a5f 100%)",
                    boxShadow: canSend ? "0 4px 18px rgba(13,148,136,0.34)" : undefined,
                  }}
                >
                  {loading
                    ? <Loader2 className="w-5 h-5 animate-spin" />
                    : <Send className="w-5 h-5" />
                  }
                  Send a Message
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
