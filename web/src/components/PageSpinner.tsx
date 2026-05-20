"use client";

import { PuffLoader } from "react-spinners";

interface PageSpinnerProps {
  label?: string;
}

export default function PageSpinner({ label = "Loading..." }: PageSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-5">
      <PuffLoader color="#CC0000" size={72} speedMultiplier={0.9} />
      <p className="text-sm font-medium text-gray-400 tracking-wide animate-pulse">
        {label}
      </p>
    </div>
  );
}
