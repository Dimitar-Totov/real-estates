"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17];
const VISIBLE_COUNT = 3;

function isWeekday(date: Date) {
  const day = date.getDay();
  return day !== 0 && day !== 6;
}

function generateWorkdays(startOffset: number, count: number): Date[] {
  const days: Date[] = [];
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  let checked = 0;
  while (days.length < count) {
    if (isWeekday(cursor)) {
      if (checked >= startOffset) days.push(new Date(cursor));
      checked++;
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

function formatDate(date: Date) {
  return {
    month: date.toLocaleString("en-US", { month: "short" }).toUpperCase(),
    day: String(date.getDate()),
    weekday: date.toLocaleString("en-US", { weekday: "short" }).toUpperCase(),
  };
}

function formatHour(h: number) {
  return h < 12 ? `${h}:00 AM` : h === 12 ? "12:00 PM" : `${h - 12}:00 PM`;
}

function formatFullDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

type SliderProps = {
  items: React.ReactNode[];
  visibleCount?: number;
};

function HorizontalSlider({ items, visibleCount = VISIBLE_COUNT }: SliderProps) {
  const [offset, setOffset] = useState(0);
  const [animDir, setAnimDir] = useState<"left" | "right" | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const canGoLeft = offset > 0;
  const canGoRight = offset + visibleCount < items.length;

  function slide(dir: "left" | "right") {
    if (isAnimating) return;
    setAnimDir(dir);
    setIsAnimating(true);
    timerRef.current = setTimeout(() => {
      setOffset((prev) => prev + (dir === "right" ? 1 : -1));
      setAnimDir(null);
      setIsAnimating(false);
    }, 220);
  }

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const visible = items.slice(offset, offset + visibleCount);

  const translateClass =
    animDir === "right"
      ? "-translate-x-4 opacity-0"
      : animDir === "left"
      ? "translate-x-4 opacity-0"
      : "translate-x-0 opacity-100";

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => slide("left")}
        aria-label="Previous"
        className={[
          "shrink-0 w-9 h-9 flex items-center justify-center rounded-xl border-2 transition-all duration-300",
          canGoLeft
            ? "border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-700 opacity-100 scale-100"
            : "border-transparent text-transparent opacity-0 scale-75 pointer-events-none",
        ].join(" ")}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <div className="flex gap-2 flex-1 overflow-hidden">
        <div
          className={["flex gap-2 w-full transition-all ease-in-out", translateClass].join(" ")}
          style={{ transitionDuration: "220ms" }}
        >
          {visible.map((item, i) => (
            <div key={offset + i} className="flex-1">
              {item}
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={() => slide("right")}
        aria-label="Next"
        className={[
          "shrink-0 w-9 h-9 flex items-center justify-center rounded-xl border-2 transition-all duration-300",
          canGoRight
            ? "border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-700 opacity-100 scale-100"
            : "border-transparent text-transparent opacity-0 scale-75 pointer-events-none",
        ].join(" ")}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}

type BookingStatus = "idle" | "loading" | "error" | "conflict" | "unauthenticated";
type VisitingState = {
  visitingId: number;
  visitDate: string;
  hour: number;
  status: "pending" | "confirmed" | "cancelled";
} | null;

export default function TourBookingCard({ propertyId }: { propertyId: number }) {
  const router = useRouter();
  const workdays = useMemo(() => generateWorkdays(0, 30), []);

  const [selectedDateIdx, setSelectedDateIdx] = useState(0);
  const [selectedHour, setSelectedHour] = useState(8);
  const [bookingStatus, setBookingStatus] = useState<BookingStatus>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [visiting, setVisiting] = useState<VisitingState>(null);

  useEffect(() => {
    fetch(`/api/visitings?propertyId=${propertyId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.booked) {
          setVisiting({
            visitingId: data.visitingId,
            visitDate: data.visitDate,
            hour: data.hour,
            status: data.status ?? "pending",
          });
        }
      })
      .catch(() => {});
  }, [propertyId]);

  const selectedDate = workdays[selectedDateIdx];
  const { month, day, weekday } = formatDate(selectedDate);

  async function handleRequestShowing() {
    setBookingStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/visitings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId,
          visitDate: selectedDate.toISOString(),
          hour: selectedHour,
        }),
      });

      if (res.status === 401) { setBookingStatus("unauthenticated"); return; }
      if (res.status === 409) { setBookingStatus("conflict"); return; }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setErrorMsg(data.error ?? "Something went wrong. Please try again.");
        setBookingStatus("error");
        return;
      }

      const created = await res.json();
      setVisiting({
        visitingId: created.id,
        visitDate: created.visitDate,
        hour: created.hour,
        status: created.status ?? "pending",
      });
      setBookingStatus("idle");
    } catch {
      setErrorMsg("Network error. Please try again.");
      setBookingStatus("error");
    }
  }

  // ── Confirmed state ──────────────────────────────────────────────
  if (visiting?.status === "confirmed") {
    const displayDate = new Date(visiting.visitDate);
    return (
      <div className="bg-white rounded-2xl border border-emerald-200 shadow-lg overflow-hidden mb-4">
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 px-6 py-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-100">Showing</p>
            <h3 className="text-xl font-bold text-white leading-tight">Request is accepted</h3>
          </div>
        </div>
        <div className="px-6 py-5 space-y-3">
          <p className="text-sm text-gray-500 leading-relaxed">
            We will be waiting you at
          </p>
          <div className="flex items-center gap-3 bg-emerald-50 rounded-xl px-4 py-3 border border-emerald-100">
            <svg className="w-5 h-5 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-emerald-800">{formatFullDate(displayDate)}</p>
              <p className="text-xs text-emerald-600 mt-0.5">{formatHour(visiting.hour)}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Cancelled state ──────────────────────────────────────────────
  if (visiting?.status === "cancelled") {
    return (
      <div className="bg-white rounded-2xl border border-red-200 shadow-lg overflow-hidden mb-4">
        <div className="bg-gradient-to-br from-red-500 to-red-600 px-6 py-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-red-100">Unavailable</p>
            <h3 className="text-xl font-bold text-white leading-tight">Request declined</h3>
          </div>
        </div>
        <div className="px-6 py-5 space-y-4">
          <p className="text-sm text-gray-600 leading-relaxed">
            At this time the agent is not available. Please choose another date.
          </p>
          <button
            onClick={() => setVisiting(null)}
            className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-semibold text-sm tracking-wide transition-colors shadow-sm"
          >
            Choose Another Date
          </button>
        </div>
      </div>
    );
  }

  // ── Pending state ────────────────────────────────────────────────
  if (visiting?.status === "pending") {
    const displayDate = new Date(visiting.visitDate);
    return (
      <div className="bg-white rounded-2xl border border-amber-200 shadow-lg overflow-hidden mb-4">
        <div className="bg-gradient-to-br from-amber-400 to-amber-500 px-6 py-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            <svg className="w-6 h-6 text-white animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-amber-100">Awaiting</p>
            <h3 className="text-xl font-bold text-white leading-tight">Showing Requested</h3>
          </div>
        </div>
        <div className="px-6 py-5 space-y-3">
          <p className="text-sm text-gray-500 leading-relaxed">
            Your request has been sent. The agent will review and respond shortly.
          </p>
          <div className="flex items-center gap-3 bg-amber-50 rounded-xl px-4 py-3 border border-amber-100">
            <svg className="w-5 h-5 text-amber-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-amber-800">{formatFullDate(displayDate)}</p>
              <p className="text-xs text-amber-600 mt-0.5">{formatHour(visiting.hour)}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Booking form ─────────────────────────────────────────────────
  const dateItems = workdays.map((date, i) => {
    const { month, day, weekday } = formatDate(date);
    const isSelected = selectedDateIdx === i;
    return (
      <button
        key={i}
        onClick={() => { setSelectedDateIdx(i); setBookingStatus("idle"); }}
        className={[
          "flex flex-col items-center justify-center w-full py-2.5 px-1 rounded-xl border-2 transition-all duration-150 shrink-0",
          isSelected
            ? "border-gray-900 bg-gray-900 text-white"
            : "border-gray-200 text-gray-700 hover:border-gray-400",
        ].join(" ")}
      >
        <span className="text-[10px] font-semibold tracking-widest uppercase opacity-70">{month}</span>
        <span className="text-xl font-bold leading-tight">{day}</span>
        <span className="text-[10px] font-medium tracking-wider uppercase opacity-70">{weekday}</span>
      </button>
    );
  });

  const hourItems = HOURS.map((h) => {
    const isSelected = selectedHour === h;
    return (
      <button
        key={h}
        onClick={() => { setSelectedHour(h); setBookingStatus("idle"); }}
        className={[
          "flex flex-col items-center justify-center w-full py-2.5 px-1 rounded-xl border-2 transition-all duration-150 shrink-0",
          isSelected
            ? "border-gray-900 bg-gray-900 text-white"
            : "border-gray-200 text-gray-700 hover:border-gray-400",
        ].join(" ")}
      >
        <span className="text-base font-bold leading-tight">{h}</span>
        <span className="text-[10px] font-medium tracking-wider uppercase opacity-70">{h < 12 ? "AM" : "PM"}</span>
      </button>
    );
  });

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6 space-y-5 mb-4">
      <h3 className="text-lg font-bold text-gray-900">Thinking of buying?</h3>

      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Select date</p>
        <HorizontalSlider items={dateItems} visibleCount={VISIBLE_COUNT} />
      </div>

      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Select time</p>
        <HorizontalSlider items={hourItems} visibleCount={VISIBLE_COUNT} />
      </div>

      {bookingStatus === "unauthenticated" && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 flex items-center gap-3">
          <svg className="w-4 h-4 text-amber-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <span className="text-sm text-amber-700">
            Please{" "}
            <button
              onClick={() => router.push("/auth")}
              className="font-semibold underline underline-offset-2 hover:text-amber-900"
            >
              sign in
            </button>{" "}
            to request a showing.
          </span>
        </div>
      )}

      {bookingStatus === "conflict" && (
        <div className="rounded-xl bg-blue-50 border border-blue-200 px-4 py-3 flex items-center gap-3">
          <svg className="w-4 h-4 text-blue-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
          </svg>
          <span className="text-sm text-blue-700">
            You already have a showing booked at this date and time. Pick a different slot.
          </span>
        </div>
      )}

      {bookingStatus === "error" && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 flex items-center gap-3">
          <svg className="w-4 h-4 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <span className="text-sm text-red-700">{errorMsg}</span>
        </div>
      )}

      <button
        onClick={handleRequestShowing}
        disabled={bookingStatus === "loading"}
        className="w-full py-3.5 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm tracking-wide transition-colors shadow-sm flex items-center justify-center gap-2"
      >
        {bookingStatus === "loading" ? (
          <>
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Requesting…
          </>
        ) : (
          "Request Showing"
        )}
      </button>

      <p className="text-center text-xs text-gray-400">
        Selected:{" "}
        <span className="font-medium text-gray-600">
          {weekday} {month} {day} at {formatHour(selectedHour)}
        </span>
      </p>
    </div>
  );
}
