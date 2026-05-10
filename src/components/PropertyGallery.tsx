"use client";

import { useState } from "react";
import Lightbox from "./Lightbox";

interface PropertyGalleryProps {
  images: string[];
  title: string;
}

export default function PropertyGallery({ images, title }: PropertyGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-72 sm:h-80 mb-8 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 gap-4">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gray-100">
          <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v13.5A1.5 1.5 0 003.75 21zm10.5-10.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
          </svg>
        </div>
        <div className="text-center">
          <p className="text-base font-semibold text-gray-500">No photos yet</p>
          <p className="text-sm text-gray-400 mt-1">Photos will appear here once uploaded by the listing agent.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col lg:flex-row gap-3 lg:h-[500px] mb-8">

        {/* Hero image */}
        <button
          className="h-64 sm:h-80 lg:h-full lg:w-[65%] lg:shrink-0 overflow-hidden rounded-2xl cursor-zoom-in"
          onClick={() => setLightboxIndex(0)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={images[0]}
            alt={title}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
          />
        </button>

        {/* Side images */}
        {images.length >= 2 && (
          <div className="flex flex-row lg:flex-col gap-3 h-44 sm:h-56 lg:h-full lg:flex-1">
            <button
              className="flex-1 overflow-hidden rounded-2xl cursor-zoom-in"
              onClick={() => setLightboxIndex(1)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={images[1]}
                alt=""
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
              />
            </button>

            {images.length >= 3 && (
              <button
                className="flex-1 overflow-hidden rounded-2xl relative cursor-zoom-in"
                onClick={() => setLightboxIndex(2)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={images[2]}
                  alt=""
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                />
                <span className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm text-white text-xs font-semibold px-3.5 py-2 rounded-full pointer-events-none">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
                    <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
                  </svg>
                  {images.length} photos
                </span>
              </button>
            )}
          </div>
        )}
      </div>

      {lightboxIndex !== null && (
        <Lightbox
          images={images}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      )}
    </>
  );
}
