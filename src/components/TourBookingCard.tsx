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
  return h < 12 ? `${h} AM` : h === 12 ? "12 PM" : `${h - 12} PM`;
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

type Status = "idle" | "loading" | "success" | "error" | "conflict" | "unauthenticated";

export default function TourBookingCard({ propertyId }: { propertyId: number }) {
  const router = useRouter();
  const workdays = useMemo(() => generateWorkdays(0, 30), []);

  const [selectedDateIdx, setSelectedDateIdx] = useState(0);
  const [selectedHour, setSelectedHour] = useState(8);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [bookedSlot, setBookedSlot] = useState<{ visitDate: string; hour: number } | null>(null);

  useEffect(() => {
    fetch(`/api/visitings?propertyId=${propertyId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.booked) {
          setBookedSlot({ visitDate: data.visitDate, hour: data.hour });
          setStatus("success");
        }
      })
      .catch(() => {});
  }, [propertyId]);

  const selectedDate = workdays[selectedDateIdx];
  const { month, day, weekday } = formatDate(selectedDate);

  async function handleRequestShowing() {
    setStatus("loading");
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

      if (res.status === 401) {
        setStatus("unauthenticated");
        return;
      }
      if (res.status === 409) {
        setStatus("conflict");
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setErrorMsg(data.error ?? "Something went wrong. Please try again.");
        setStatus("error");
        return;
      }

      setStatus("success");
    } catch {
      setErrorMsg("Network error. Please try again.");
      setStatus("error");
    }
  }

  const dateItems = workdays.map((date, i) => {
    const { month, day, weekday } = formatDate(date);
    const isSelected = selectedDateIdx === i;
    return (
      <button
        key={i}
        onClick={() => { setSelectedDateIdx(i); setStatus("idle"); }}
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
        onClick={() => { setSelectedHour(h); setStatus("idle"); }}
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

  if (status === "success") {
    const displayDate = bookedSlot ? new Date(bookedSlot.visitDate) : selectedDate;
    const displayHour = bookedSlot ? bookedSlot.hour : selectedHour;
    const { month: dm, day: dd, weekday: dw } = formatDate(displayDate);
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6 flex flex-col items-center text-center gap-4">
        <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
          <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">Showing Requested!</h3>
          <p className="text-sm text-gray-500 mt-1">
            {dw} {dm} {dd} at {formatHour(displayHour)}
          </p>
          <p className="text-xs text-gray-400 mt-2">
            You&apos;ll be contacted shortly to confirm your visit.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6 space-y-5">
      <h3 className="text-lg font-bold text-gray-900">Thinking of buying?</h3>

      {/* Date slider */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Select date</p>
        <HorizontalSlider items={dateItems} visibleCount={VISIBLE_COUNT} />
      </div>

      {/* Hour slider */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Select time</p>
        <HorizontalSlider items={hourItems} visibleCount={VISIBLE_COUNT} />
      </div>

      {/* Feedback messages */}
      {status === "unauthenticated" && (
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

      {status === "conflict" && (
        <div className="rounded-xl bg-blue-50 border border-blue-200 px-4 py-3 flex items-center gap-3">
          <svg className="w-4 h-4 text-blue-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
          </svg>
          <span className="text-sm text-blue-700">
            You already have a showing booked at this date and time. Pick a different slot.
          </span>
        </div>
      )}

      {status === "error" && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 flex items-center gap-3">
          <svg className="w-4 h-4 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <span className="text-sm text-red-700">{errorMsg}</span>
        </div>
      )}

      {/* CTA */}
      <button
        onClick={handleRequestShowing}
        disabled={status === "loading"}
        className="w-full py-3.5 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm tracking-wide transition-colors shadow-sm flex items-center justify-center gap-2"
      >
        {status === "loading" ? (
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
