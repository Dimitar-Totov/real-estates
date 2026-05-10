"use client";

import { useState, useMemo, useRef, useEffect } from "react";

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
    } else {
      // skip weekend but don't count toward offset
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
      {/* Left arrow */}
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

      {/* Slides */}
      <div className="flex gap-2 flex-1 overflow-hidden">
        <div
          className={[
            "flex gap-2 w-full transition-all duration-220 ease-in-out",
            translateClass,
          ].join(" ")}
          style={{ transitionDuration: "220ms" }}
        >
          {visible.map((item, i) => (
            <div key={offset + i} className="flex-1">
              {item}
            </div>
          ))}
        </div>
      </div>

      {/* Right arrow */}
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

export default function TourBookingCard() {
  const workdays = useMemo(() => generateWorkdays(0, 30), []);

  const [selectedDateIdx, setSelectedDateIdx] = useState(0);
  const [selectedHour, setSelectedHour] = useState(8);

  const dateItems = workdays.map((date, i) => {
    const { month, day, weekday } = formatDate(date);
    const isSelected = selectedDateIdx === i;
    return (
      <button
        key={i}
        onClick={() => setSelectedDateIdx(i)}
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
        onClick={() => setSelectedHour(h)}
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

  const selectedDate = workdays[selectedDateIdx];
  const { month, day, weekday } = formatDate(selectedDate);

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

      {/* CTA */}
      <button className="w-full py-3.5 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-semibold text-sm tracking-wide transition-colors shadow-sm">
        Request Showing
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
