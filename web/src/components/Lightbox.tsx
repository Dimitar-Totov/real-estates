"use client";

import { useEffect } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface LightboxProps {
  images: string[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

export default function Lightbox({ images, currentIndex, onClose, onNavigate }: LightboxProps) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" && currentIndex > 0) onNavigate(currentIndex - 1);
      else if (e.key === "ArrowRight" && currentIndex < images.length - 1) onNavigate(currentIndex + 1);
      else if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [currentIndex, images.length, onClose, onNavigate]);

  const btnClass =
    "flex items-center justify-center w-11 h-11 rounded-full border border-white/20 bg-white/10 hover:bg-white/25 text-white transition-colors backdrop-blur-sm";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
    >
      {/* Top bar */}
      <div className="absolute top-4 inset-x-4 flex items-center justify-between pointer-events-none">
        <span className="text-white/60 text-sm font-medium tabular-nums pointer-events-none">
          {currentIndex + 1} / {images.length}
        </span>
        <button className={btnClass} onClick={onClose} style={{ pointerEvents: "auto" }}>
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Left arrow */}
      {currentIndex > 0 && (
        <button
          className={`${btnClass} absolute left-4 top-1/2 -translate-y-1/2`}
          onClick={() => onNavigate(currentIndex - 1)}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}

      {/* Right arrow */}
      {currentIndex < images.length - 1 && (
        <button
          className={`${btnClass} absolute right-4 top-1/2 -translate-y-1/2`}
          onClick={() => onNavigate(currentIndex + 1)}
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      )}

      {/* Image */}
      <div
        className="max-w-[90vw] max-h-[85vh] flex items-center justify-center px-16"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={currentIndex}
          src={images[currentIndex]}
          alt={`Photo ${currentIndex + 1}`}
          className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl animate-fade-in"
        />
      </div>
    </div>
  );
}
