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
  CheckCircle,
  XCircle,
  ChevronRight,
  Pencil,
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

/* ── Parse image URLs out of message body ──────────────────────── */
const R2_HOST = "r2.dev";

function parseMessageParts(message: string): { text: string; images: string[] } {
  const lines = message.split("\n");
  const images: string[] = [];
  const textLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("http") && trimmed.includes(R2_HOST)) {
      images.push(trimmed);
    } else if (/^Photos \(\d+\):$/.test(trimmed)) {
      // skip the "Photos (N):" header line — the grid heading replaces it
    } else {
      textLines.push(line);
    }
  }

  return { text: textLines.join("\n").trimEnd(), images };
}

/* ── Image lightbox modal ──────────────────────────────────────── */
function Lightbox({
  images,
  startIndex,
  onClose,
}: {
  images: string[];
  startIndex: number;
  onClose: () => void;
}) {
  const [idx, setIdx] = useState(startIndex);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft")  setIdx((i) => (i - 1 + images.length) % images.length);
      if (e.key === "ArrowRight") setIdx((i) => (i + 1) % images.length);
      if (e.key === "Escape")     onClose();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [images.length, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 flex items-center justify-center w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
        aria-label="Close"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Prev */}
      {images.length > 1 && (
        <button
          onClick={() => setIdx((i) => (i - 1 + images.length) % images.length)}
          className="absolute left-4 flex items-center justify-center w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          aria-label="Previous image"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}

      {/* Image */}
      <div className="max-w-5xl max-h-[90vh] w-full px-20 flex items-center justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={idx}
          src={images[idx]}
          alt={`Photo ${idx + 1}`}
          className="max-h-[85vh] max-w-full object-contain rounded-lg shadow-2xl"
        />
      </div>

      {/* Next */}
      {images.length > 1 && (
        <button
          onClick={() => setIdx((i) => (i + 1) % images.length)}
          className="absolute right-4 flex items-center justify-center w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          aria-label="Next image"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      )}

      {/* Counter */}
      {images.length > 1 && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-1.5">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              className={`rounded-full transition-all ${i === idx ? "w-5 h-2 bg-white" : "w-2 h-2 bg-white/40 hover:bg-white/70"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Pending listing property data type ────────────────────────── */
type PendingData = {
  title?: string;
  description?: string;
  price?: string | number;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  type?: string;
  status?: string;
  bedrooms?: number | null;
  bathrooms?: number | null;
  squareFeet?: string | number | null;
  lotSize?: string | number | null;
  yearBuilt?: number | null;
  garage?: boolean;
  pool?: boolean;
  [key: string]: unknown;
};

/* ── Edit listing modal ────────────────────────────────────────── */
function EditListingModal({
  pendingId,
  initialData,
  onClose,
  onSaved,
}: {
  pendingId: number;
  initialData: PendingData;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [data, setData] = useState<PendingData>({ ...initialData });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  function field(label: string, key: keyof PendingData, type = "text", opts?: { textarea?: boolean; rows?: number }) {
    return (
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold uppercase tracking-widest text-slate-400">{label}</label>
        {opts?.textarea ? (
          <textarea
            rows={opts.rows ?? 4}
            value={(data[key] as string) ?? ""}
            onChange={(e) => setData((d) => ({ ...d, [key]: e.target.value }))}
            className="px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-800 focus:outline-none focus:border-slate-400 focus:bg-white transition-colors resize-none"
          />
        ) : (
          <input
            type={type}
            value={(data[key] as string | number) ?? ""}
            onChange={(e) => setData((d) => ({ ...d, [key]: type === "number" ? (e.target.value === "" ? null : Number(e.target.value)) : e.target.value }))}
            className="px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-800 focus:outline-none focus:border-slate-400 focus:bg-white transition-colors"
          />
        )}
      </div>
    );
  }

  async function handleSave() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/pending-listings/${pendingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed to save");
      onSaved();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3 text-slate-700">
            <Pencil className="w-5 h-5" />
            <span className="text-lg font-semibold">Edit Listing Details</span>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-9 h-9 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-8 py-7 space-y-5 flex-1">
          {field("Title", "title")}
          {field("Description", "description", "text", { textarea: true, rows: 5 })}
          <div className="grid grid-cols-2 gap-4">
            {field("Price ($)", "price", "number")}
            {field("Year Built", "yearBuilt", "number")}
          </div>
          {field("Address", "address")}
          <div className="grid grid-cols-3 gap-4">
            {field("City", "city")}
            {field("State", "state")}
            {field("Zip Code", "zipCode")}
          </div>
          {field("Country", "country")}
          <div className="grid grid-cols-2 gap-4">
            {field("Bedrooms", "bedrooms", "number")}
            {field("Bathrooms", "bathrooms", "number")}
          </div>
          <div className="grid grid-cols-2 gap-4">
            {field("Square Feet", "squareFeet", "number")}
            {field("Lot Size (sqft)", "lotSize", "number")}
          </div>
          <div className="flex gap-6 pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={!!data.garage}
                onChange={(e) => setData((d) => ({ ...d, garage: e.target.checked }))}
                className="w-4 h-4 rounded accent-slate-800"
              />
              <span className="text-sm font-medium text-slate-700">Garage</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={!!data.pool}
                onChange={(e) => setData((d) => ({ ...d, pool: e.target.checked }))}
                className="w-4 h-4 rounded accent-slate-800"
              />
              <span className="text-sm font-medium text-slate-700">Pool</span>
            </label>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-8 py-5 border-t border-slate-100 shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-sm text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold bg-slate-800 text-white hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {loading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

function parseRole(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)user-info=([^;]*)/);
  if (!match) return null;
  try { return JSON.parse(decodeURIComponent(match[1]))?.role ?? null; } catch { return null; }
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
  const [role, setRole]                         = useState<string | null>(null);
  const [lightbox, setLightbox]                 = useState<{ images: string[]; index: number } | null>(null);
  const [pendingListing, setPendingListing]     = useState<{ id: number; status: string; propertyData?: PendingData } | null | undefined>(undefined);
  const [reviewLoading, setReviewLoading]       = useState<"approve" | "decline" | null>(null);
  const [editListing, setEditListing]           = useState(false);
  const [sentPendingStatus, setSentPendingStatus] = useState<string | null | undefined>(undefined);
  const [sentShowingStatus, setSentShowingStatus] = useState<string | null | undefined>(undefined);

  useEffect(() => { setRole(parseRole()); }, []);

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
    setSentPendingStatus(undefined);
    setSentShowingStatus(undefined);
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
      setPendingListing(undefined); setEditListing(false);
      return;
    }
    setSelectedReceived(msg);
    markSeen(msg);
    setPendingListing(undefined); setEditListing(false);
    fetch(`/api/pending-listings/by-message/${msg.id}`)
      .then((r) => r.json())
      .then((data) => setPendingListing(data ?? null))
      .catch(() => setPendingListing(null));
  };

  const handleReview = async (action: "approve" | "decline") => {
    if (!pendingListing) return;
    setReviewLoading(action);
    try {
      const res = await fetch(`/api/pending-listings/${pendingListing.id}/${action}`, { method: "POST" });
      if (!res.ok) throw new Error();
      setPendingListing({ ...pendingListing, status: action === "approve" ? "approved" : "declined" });
    } catch {
      // leave state unchanged so user can retry
    } finally {
      setReviewLoading(null);
    }
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
        <div className="flex items-center gap-2 ml-auto flex-wrap justify-end">
          {role === "agent" && pendingListing && (
            pendingListing.status === "pending" ? (
              <>
                <button
                  type="button"
                  onClick={() => setEditListing(true)}
                  disabled={reviewLoading !== null}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-slate-700 bg-slate-100 border border-slate-200 hover:bg-slate-200 hover:border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleReview("approve")}
                  disabled={reviewLoading !== null}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {reviewLoading === "approve"
                    ? <span className="w-4 h-4 border-2 border-emerald-500/40 border-t-emerald-600 rounded-full animate-spin" />
                    : <CheckCircle className="w-4 h-4" />}
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() => handleReview("decline")}
                  disabled={reviewLoading !== null}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-red-600 bg-red-50 border border-red-200 hover:bg-red-100 hover:border-red-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {reviewLoading === "decline"
                    ? <span className="w-4 h-4 border-2 border-red-400/40 border-t-red-500 rounded-full animate-spin" />
                    : <XCircle className="w-4 h-4" />}
                  Decline
                </button>
              </>
            ) : (
              <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold border ${
                pendingListing.status === "approved"
                  ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                  : "text-red-600 bg-red-50 border-red-200"
              }`}>
                {pendingListing.status === "approved"
                  ? <CheckCircle className="w-4 h-4" />
                  : <XCircle className="w-4 h-4" />}
                {pendingListing.status === "approved" ? "Approved" : "Declined"}
              </span>
            )
          )}
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
            <span className="text-base font-medium text-slate-700">From: {selectedReceived.senderName ?? "Unknown"}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Clock className="w-4 h-4" />
            <span>{formatFullDate(selectedReceived.sentAt)}</span>
          </div>
        </div>
      </div>

      {/* Body */}
      {(() => {
        const { text, images } = parseMessageParts(selectedReceived.message);
        return (
          <div className="flex-1 overflow-y-auto px-8 py-7 bg-white space-y-8">
            <p className="text-base text-slate-700 leading-8 whitespace-pre-wrap">{text}</p>

            {images.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                  Photos ({images.length})
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {images.map((url, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setLightbox({ images, index: i })}
                      className="group relative aspect-square rounded-xl overflow-hidden bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url}
                        alt={`Photo ${i + 1}`}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors duration-300 flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white/20 backdrop-blur-sm rounded-full p-2">
                          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                          </svg>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );

  const handleSelectSent = (msg: SentMessage) => {
    if (selectedSent?.id === msg.id) {
      setSelectedSent(null);
      setSentPendingStatus(undefined);
      setSentShowingStatus(undefined);
      return;
    }
    setSelectedSent(msg);
    setSentPendingStatus(undefined);
    setSentShowingStatus(undefined);
    fetch(`/api/pending-listings/by-message/${msg.id}`)
      .then((r) => r.json())
      .then((data) => setSentPendingStatus(data?.status ?? null))
      .catch(() => setSentPendingStatus(null));
    fetch(`/api/visitings/by-message/${msg.id}`)
      .then((r) => r.json())
      .then((data) => setSentShowingStatus(data?.status ?? null))
      .catch(() => setSentShowingStatus(null));
  };

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
        <ul
          className="flex-1 overflow-y-auto divide-y divide-slate-100"
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedSent(null); }}
        >
          {sent.map((msg) => {
            const isSelected = selectedSent?.id === msg.id;
            return (
              <li key={msg.id}>
                <button
                  onClick={() => handleSelectSent(msg)}
                  className={[
                    "w-full text-left px-6 py-5 transition-colors",
                    isSelected ? "bg-slate-100" : "hover:bg-slate-50",
                  ].join(" ")}
                >
                  <div className="flex items-center gap-4">
                    <Avatar name={msg.receiverName} size="md" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-base font-semibold text-slate-700 truncate">
                          {msg.receiverName ?? `User #${msg.receiverId}`}
                        </span>
                        <span className="text-sm text-slate-400 shrink-0">{formatDate(msg.sentAt)}</span>
                      </div>
                      <p className="mt-1 text-sm font-medium text-slate-500 truncate">{msg.subject}</p>
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

  /* ── Sent reading pane ── */
  const sentPane = selectedSent && (
    <div className="flex flex-col h-full border-l border-slate-200">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white">
        <button
          onClick={() => setSelectedSent(null)}
          className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors md:hidden"
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
      </div>

      <div className="px-8 pt-8 pb-6 border-b border-slate-100 bg-white">
        <h2 className="text-2xl font-bold text-slate-900 leading-snug">{selectedSent.subject}</h2>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-4">
          <div className="flex items-center gap-3">
            <Avatar name={selectedSent.receiverName} size="sm" />
            <span className="text-base font-medium text-slate-700">
              To: {selectedSent.receiverName ?? `User #${selectedSent.receiverId}`}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Clock className="w-4 h-4" />
            <span>{formatFullDate(selectedSent.sentAt)}</span>
          </div>
          {sentPendingStatus !== undefined && sentPendingStatus !== null && (
            <div className="flex items-center gap-2">
              {sentPendingStatus === "pending" && (
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-slate-100 text-slate-500 border border-slate-200">
                  <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0" />
                  Pending
                </span>
              )}
              {sentPendingStatus === "approved" && (
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  Approved
                </span>
              )}
              {sentPendingStatus === "declined" && (
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-red-50 text-red-600 border border-red-200">
                  <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                  Declined
                </span>
              )}
            </div>
          )}
          {sentShowingStatus !== undefined && sentShowingStatus !== null && (
            <div className="flex items-center gap-2">
              {sentShowingStatus === "pending" && (
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-amber-50 text-amber-700 border border-amber-200">
                  <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                  Showing Pending
                </span>
              )}
              {sentShowingStatus === "confirmed" && (
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  Showing Accepted
                </span>
              )}
              {sentShowingStatus === "cancelled" && (
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-red-50 text-red-600 border border-red-200">
                  <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                  Showing Declined
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {(() => {
        const { text, images } = parseMessageParts(selectedSent.message);
        return (
          <div className="flex-1 overflow-y-auto px-8 py-7 bg-white space-y-8">
            <p className="text-base text-slate-700 leading-8 whitespace-pre-wrap">{text}</p>

            {images.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                  Photos ({images.length})
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {images.map((url, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setLightbox({ images, index: i })}
                      className="group relative aspect-square rounded-xl overflow-hidden bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url}
                        alt={`Photo ${i + 1}`}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors duration-300 flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white/20 backdrop-blur-sm rounded-full p-2">
                          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                          </svg>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })()}
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
            <div className="flex h-full">
              <div className={[
                "h-full overflow-hidden",
                selectedSent
                  ? "hidden md:flex md:flex-col md:w-88 lg:w-[26rem] border-r border-slate-200"
                  : "flex flex-col w-full",
              ].join(" ")}>
                {loading ? <LoadingState /> : sentList}
              </div>
              {selectedSent && (
                <div className="flex-1 h-full overflow-hidden">
                  {sentPane}
                </div>
              )}
            </div>
          )}
        </div>
      </div>


      {replyTarget && (
        <ReplyModal
          original={replyTarget}
          onClose={() => setReplyTarget(null)}
          onSent={() => fetchTab("sent")}
        />
      )}

      {editListing && pendingListing?.propertyData && (
        <EditListingModal
          pendingId={pendingListing.id}
          initialData={pendingListing.propertyData}
          onClose={() => setEditListing(false)}
          onSaved={() => {
            // Refresh the pending listing data so the message reflects any updates
            if (selectedReceived) {
              fetch(`/api/pending-listings/by-message/${selectedReceived.id}`)
                .then((r) => r.json())
                .then((data) => setPendingListing(data ?? null))
                .catch(() => {});
            }
          }}
        />
      )}

      {lightbox && (
        <Lightbox
          images={lightbox.images}
          startIndex={lightbox.index}
          onClose={() => setLightbox(null)}
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
