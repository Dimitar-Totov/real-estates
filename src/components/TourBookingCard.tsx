"use client";

import { useState } from "react";

const DATES = [
  { month: "MAR", day: "14", weekday: "THU" },
  { month: "MAR", day: "15", weekday: "FRI" },
  { month: "MAR", day: "16", weekday: "SAT" },
];

type TourType = "in_person" | "video_chat";

export default function TourBookingCard() {
  const [selectedDate, setSelectedDate] = useState(0);
  const [tourType, setTourType]         = useState<TourType>("in_person");

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6 space-y-5">
      <h3 className="text-lg font-bold text-gray-900">Thinking of buying?</h3>

      {/* ── Date picker ── */}
      <div className="flex items-center gap-2">
        <div className="flex gap-2 flex-1 overflow-x-auto pb-1 scrollbar-none">
          {DATES.map((d, i) => (
            <button
              key={i}
              onClick={() => setSelectedDate(i)}
              className={[
                "flex flex-col items-center justify-center min-w-[64px] py-2.5 px-1 rounded-xl border-2 transition-all duration-150 shrink-0",
                selectedDate === i
                  ? "border-gray-900 bg-gray-900 text-white"
                  : "border-gray-200 text-gray-700 hover:border-gray-400",
              ].join(" ")}
            >
              <span className="text-[10px] font-semibold tracking-widest uppercase opacity-70">{d.month}</span>
              <span className="text-xl font-bold leading-tight">{d.day}</span>
              <span className="text-[10px] font-medium tracking-wider uppercase opacity-70">{d.weekday}</span>
            </button>
          ))}
        </div>

        {/* More dates chevron */}
        <button className="shrink-0 w-9 h-9 flex items-center justify-center rounded-xl border-2 border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-all">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* ── Tour type toggle ── */}
      <div className="grid grid-cols-2 gap-2">
        {(["in_person", "video_chat"] as TourType[]).map((type) => (
          <button
            key={type}
            onClick={() => setTourType(type)}
            className={[
              "py-2.5 px-3 rounded-xl border-2 text-xs font-semibold tracking-wider uppercase transition-all duration-150",
              tourType === type
                ? "border-gray-900 bg-gray-900 text-white"
                : "border-gray-200 text-gray-600 hover:border-gray-400",
            ].join(" ")}
          >
            {type === "in_person" ? "Tour In Person" : "Tour Via Video"}
          </button>
        ))}
      </div>

      {/* ── CTA ── */}
      <button className="w-full py-3.5 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-semibold text-sm tracking-wide transition-colors shadow-sm">
        Request Showing
      </button>

      <p className="text-center text-xs text-gray-400">
        Next available:{" "}
        <span className="font-medium text-gray-600">Today at 10:00 AM</span>
      </p>
    </div>
  );
}
