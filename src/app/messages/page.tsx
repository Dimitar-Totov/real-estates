"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Inbox,
  Send,
  Reply,
  X,
  ChevronLeft,
  Clock,
  User,
  Mail,
} from "lucide-react";

/* ── Types ─────────────────────────────────────────────────────── */
type ReceivedMessage = {
  id: number;
  subject: string;
  message: string;
  sentAt: string;
  seenAt: string | null;
  senderId: number;
  senderName: string | null;
};

type SentMessage = {
  id: number;
  subject: string;
  message: string;
  sentAt: string;
  receiverId: number;
  receiverName: string | null;
};

type Tab = "received" | "sent";

/* ── Helpers ───────────────────────────────────────────────────── */
function formatDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86_400_000);
  if (diffDays === 0) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7)  return d.toLocaleDateString([], { weekday: "short" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function formatFullDate(iso: string) {
  return new Date(iso).toLocaleString([], {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

/* ── Avatar initial bubble ─────────────────────────────────────── */
function Avatar({ name, size = "md" }: { name: string | null; size?: "sm" | "md" | "lg" }) {
  const sizes = { sm: "w-8 h-8 text-xs", md: "w-10 h-10 text-sm", lg: "w-12 h-12 text-base" };
  return (
    <div className={`${sizes[size]} rounded-full bg-slate-200 flex items-center justify-center shrink-0`}>
      <span className="font-semibold text-slate-500 uppercase">{(name ?? "?")[0]}</span>
    </div>
  );
}

/* ── Sent message modal ────────────────────────────────────────── */
function SentModal({ msg, onClose }: { msg: SentMessage; onClose: () => void }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3 text-slate-600">
            <Send className="w-5 h-5" />
            <span className="text-base font-semibold">Sent Message</span>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Fields */}
        <div className="px-6 py-6 space-y-5">
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-widest text-slate-400 font-semibold">To</label>
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200">
              <User className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="text-base text-slate-700">{msg.receiverName ?? `User #${msg.receiverId}`}</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs uppercase tracking-widest text-slate-400 font-semibold">Subject</label>
            <div className="px-4 py-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-base font-semibold text-slate-800">{msg.subject}</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs uppercase tracking-widest text-slate-400 font-semibold">Message</label>
            <div className="px-4 py-4 rounded-xl bg-slate-50 border border-slate-200 min-h-[130px] max-h-64 overflow-y-auto">
              <p className="text-base text-slate-700 leading-relaxed whitespace-pre-wrap">{msg.message}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Clock className="w-4 h-4" />
            <span>{formatFullDate(msg.sentAt)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Reply modal ───────────────────────────────────────────────── */
function ReplyModal({
  original,
  onClose,
  onSent,
}: {
  original: ReceivedMessage;
  onClose: () => void;
  onSent: () => void;
}) {
  const subject = `Re: ${original.subject}`;
  const [body, setBody]       = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  const handleSend = async () => {
    if (!subject.trim() || !body.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId: original.senderId, subject: subject.trim(), message: body.trim() }),
      });
      if (!res.ok) {
        const { error: e } = await res.json();
        throw new Error(e ?? "Failed to send");
      }
      onSent();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/50 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-8 py-5 border-b border-slate-100">
          <div className="flex items-center gap-3 text-slate-600">
            <Reply className="w-6 h-6" />
            <span className="text-lg font-semibold">Reply to {original.senderName ?? "User"}</span>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-9 h-9 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-8 py-7 space-y-6">
          <div className="space-y-2.5">
            <label className="text-sm uppercase tracking-widest text-slate-400 font-semibold">Subject</label>
            <input
              value={subject}
              readOnly
              className="w-full px-5 py-3.5 rounded-xl bg-slate-100 border border-slate-200 text-lg text-slate-500 cursor-default select-none focus:outline-none"
            />
          </div>

          <div className="space-y-2.5">
            <label className="text-sm uppercase tracking-widest text-slate-400 font-semibold">Message</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={8}
              placeholder="Write your reply…"
              className="w-full px-5 py-4 rounded-xl bg-slate-50 border border-slate-200 text-lg text-slate-800 placeholder-slate-300 focus:outline-none focus:border-slate-400 focus:bg-white transition-colors resize-none"
            />
          </div>

          {error && <p className="text-base text-red-500">{error}</p>}

          <div className="flex justify-end gap-3 pt-1">
            <button
              onClick={onClose}
              className="px-6 py-3 rounded-xl text-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSend}
              disabled={loading || !body.trim()}
              className="flex items-center gap-2.5 px-7 py-3 rounded-xl text-lg font-semibold bg-slate-800 text-white hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Main page ─────────────────────────────────────────────────── */
export default function MessagesPage() {
  const router = useRouter();

  const [tab, setTab]                           = useState<Tab>("received");
  const [received, setReceived]                 = useState<ReceivedMessage[]>([]);
  const [sent, setSent]                         = useState<SentMessage[]>([]);
  const [loading, setLoading]                   = useState(true);
  const [selectedReceived, setSelectedReceived] = useState<ReceivedMessage | null>(null);
  const [selectedSent, setSelectedSent]         = useState<SentMessage | null>(null);
  const [replyTarget, setReplyTarget]           = useState<ReceivedMessage | null>(null);

  useEffect(() => {
    fetch("/api/user/me")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .catch(() => router.replace("/auth"));
  }, [router]);

  const fetchTab = useCallback(async (t: Tab) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/messages?tab=${t}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (t === "received") setReceived(data);
      else setSent(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTab(tab); }, [tab, fetchTab]);

  const switchTab = (t: Tab) => {
    setTab(t);
    setSelectedReceived(null);
    setSelectedSent(null);
  };

/* ── Sidebar ── */
  const sidebar = (
    <aside className="w-60 shrink-0 flex flex-col bg-slate-50 border-r border-slate-200">
      <div className="px-5 pt-8 pb-5">
        <h2 className="text-xs uppercase tracking-widest text-slate-400 font-semibold px-2">Mailbox</h2>
      </div>
      <nav className="flex flex-col gap-1 px-4">
        {(["received", "sent"] as Tab[]).map((t) => {
          const isActive = tab === t;
          const Icon = t === "received" ? Inbox : Send;
          const label = t === "received" ? "Received" : "Sent";
          const count = t === "received" ? received.filter((m) => !m.seenAt).length : sent.length;
          return (
            <button
              key={t}
              onClick={() => switchTab(t)}
              className={[
                "flex items-center gap-3 w-full px-4 py-3 rounded-xl text-base font-medium transition-all duration-150",
                isActive
                  ? "bg-slate-800 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-200",
              ].join(" ")}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span className="flex-1 text-left">{label}</span>
              {count > 0 && (
                <span className={[
                  "text-xs font-bold px-2 py-0.5 rounded-full",
                  isActive ? "bg-white/20 text-white" : "bg-slate-200 text-slate-500",
                ].join(" ")}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </aside>
  );

  const markSeen = async (msg: ReceivedMessage) => {
    if (msg.seenAt) return;
    await fetch("/api/messages", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: msg.id }),
    });
    setReceived((prev) =>
      prev.map((m) => m.id === msg.id ? { ...m, seenAt: new Date().toISOString() } : m)
    );
    window.dispatchEvent(new Event("messages:seen"));
  };

  const handleSelectMessage = (msg: ReceivedMessage) => {
    if (selectedReceived?.id === msg.id) {
      setSelectedReceived(null);
      return;
    }
    setSelectedReceived(msg);
    markSeen(msg);
  };

  /* ── Received list ── */
  const unseenCount = received.filter((m) => !m.seenAt).length;

  const receivedList = (
    <div className="flex flex-col h-full">
      <div className="px-6 py-5 border-b border-slate-100">
        <h3 className="text-lg font-bold text-slate-800">Inbox</h3>
        <p className="text-sm text-slate-400 mt-0.5">
          {received.length} message{received.length !== 1 ? "s" : ""}
          {unseenCount > 0 && <span className="ml-2 text-slate-600 font-medium">· {unseenCount} unread</span>}
        </p>
      </div>
      {received.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-8">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
            <Inbox className="w-7 h-7 text-slate-300" />
          </div>
          <div>
            <p className="text-base font-medium text-slate-500">No messages yet</p>
            <p className="text-sm text-slate-400 mt-1">When someone sends you a message, it'll appear here.</p>
          </div>
        </div>
      ) : (
        <ul
          className="flex-1 overflow-y-auto divide-y divide-slate-100"
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedReceived(null); }}
        >
          {received.map((msg) => {
            const isSelected = selectedReceived?.id === msg.id;
            const unseen = !msg.seenAt;
            return (
              <li key={msg.id}>
                <button
                  onClick={() => handleSelectMessage(msg)}
                  className={[
                    "w-full text-left px-6 py-5 transition-colors",
                    isSelected ? "bg-slate-100" : unseen ? "bg-blue-50 hover:bg-blue-100/60" : "hover:bg-slate-50",
                  ].join(" ")}
                >
                  <div className="flex items-center gap-4">
                    <div className="relative shrink-0">
                      <Avatar name={msg.senderName} size="md" />
                      {unseen && (
                        <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-blue-500 rounded-full border-2 border-white" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-3">
                        <span className={["truncate", unseen ? "text-base font-bold text-slate-900" : "text-base font-semibold text-slate-700"].join(" ")}>
                          {msg.senderName ?? "Unknown"}
                        </span>
                        <span className={["text-sm shrink-0", unseen ? "text-slate-700 font-semibold" : "text-slate-400"].join(" ")}>
                          {formatDate(msg.sentAt)}
                        </span>
                      </div>
                      <p className={["mt-1 truncate", unseen ? "text-sm font-semibold text-slate-800" : "text-sm font-medium text-slate-500"].join(" ")}>
                        {msg.subject}
                      </p>
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );

  /* ── Reading pane ── */
  const readingPane = selectedReceived && (
    <div className="flex flex-col h-full border-l border-slate-200">
      {/* Action bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white">
        <button
          onClick={() => setSelectedReceived(null)}
          className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors md:hidden"
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <div className="flex items-center gap-3 ml-auto">
          <button
            onClick={() => setReplyTarget(selectedReceived)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            <Reply className="w-4 h-4" /> Reply
          </button>
        </div>
      </div>

      {/* Message header */}
      <div className="px-8 pt-8 pb-6 border-b border-slate-100 bg-white">
        <h2 className="text-2xl font-bold text-slate-900 leading-snug">{selectedReceived.subject}</h2>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-4">
          <div className="flex items-center gap-3">
            <Avatar name={selectedReceived.senderName} size="sm" />
            <span className="text-base font-medium text-slate-700">{selectedReceived.senderName ?? "Unknown"}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Clock className="w-4 h-4" />
            <span>{formatFullDate(selectedReceived.sentAt)}</span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-8 py-7 bg-white">
        <p className="text-base text-slate-700 leading-8 whitespace-pre-wrap">{selectedReceived.message}</p>
      </div>
    </div>
  );

  /* ── Sent list ── */
  const sentList = (
    <div className="flex flex-col h-full">
      <div className="px-6 py-5 border-b border-slate-100">
        <h3 className="text-lg font-bold text-slate-800">Sent</h3>
        <p className="text-sm text-slate-400 mt-0.5">{sent.length} message{sent.length !== 1 ? "s" : ""}</p>
      </div>
      {sent.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-8">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
            <Send className="w-7 h-7 text-slate-300" />
          </div>
          <div>
            <p className="text-base font-medium text-slate-500">Nothing sent yet</p>
            <p className="text-sm text-slate-400 mt-1">Messages you send will appear here.</p>
          </div>
        </div>
      ) : (
        <ul className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {sent.map((msg) => (
            <li key={msg.id}>
              <button
                onClick={() => setSelectedSent(msg)}
                className="w-full text-left px-6 py-5 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5 text-slate-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-base font-semibold text-slate-800 truncate">{msg.subject}</span>
                      <span className="text-sm text-slate-400 shrink-0">{formatDate(msg.sentAt)}</span>
                    </div>
                    <p className="mt-0.5 text-sm text-slate-400 truncate">
                      To: {msg.receiverName ?? `User #${msg.receiverId}`}
                    </p>
                  </div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  /* ── Layout ── */
  return (
    <div className="min-h-screen bg-white flex flex-col pt-16">
      <div className="flex flex-1 h-[calc(100vh-4rem)] overflow-hidden">
        {sidebar}

        <div className="flex-1 overflow-hidden bg-white">
          {tab === "received" ? (
            <div className="flex h-full">
              <div className={[
                "h-full overflow-hidden",
                selectedReceived
                  ? "hidden md:flex md:flex-col md:w-88 lg:w-[26rem] border-r border-slate-200"
                  : "flex flex-col w-full",
              ].join(" ")}>
                {loading ? <LoadingState /> : receivedList}
              </div>
              {selectedReceived && (
                <div className="flex-1 h-full overflow-hidden">
                  {readingPane}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col h-full">
              {loading ? <LoadingState /> : sentList}
            </div>
          )}
        </div>
      </div>

      {selectedSent && (
        <SentModal msg={selectedSent} onClose={() => setSelectedSent(null)} />
      )}
      {replyTarget && (
        <ReplyModal
          original={replyTarget}
          onClose={() => setReplyTarget(null)}
          onSent={() => fetchTab("sent")}
        />
      )}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <span className="w-6 h-6 border-2 border-slate-200 border-t-slate-500 rounded-full animate-spin" />
    </div>
  );
}
