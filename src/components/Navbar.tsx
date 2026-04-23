"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

const NAV_LINKS = [
  { label: "Buy", dropdown: true },
  { label: "Rent", dropdown: true },
  { label: "Sell", dropdown: true },
  { label: "Premier", dropdown: false },
  { label: "Mortgage", dropdown: true },
  { label: "Real Estate Agents", dropdown: true },
  { label: "Feed", dropdown: false },
];

export default function Navbar() {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <header
      className={[
        "h-14 flex items-center px-6 z-50 transition-colors",
        isHome
          ? "absolute top-0 left-0 right-0 bg-transparent"
          : "relative bg-[#1a1a1a]",
      ].join(" ")}
    >
      <Link
        href="/"
        className="text-white font-bold text-lg tracking-[0.2em] uppercase mr-10 hover:opacity-80 transition-opacity shrink-0"
      >
        RealEstate
      </Link>

      <nav className="flex items-center gap-1 flex-1 overflow-x-auto">
        {NAV_LINKS.map((link) => (
          <a
            key={link.label}
            href="#"
            className="flex items-center gap-0.5 text-white text-sm px-3 py-1.5 rounded hover:bg-white/15 transition-colors whitespace-nowrap"
          >
            {link.label}
            {link.dropdown && (
              <svg
                className="w-3 h-3 ml-0.5 opacity-70 shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </a>
        ))}
      </nav>

      <a
        href="#"
        className="border border-white/70 text-white text-sm px-5 py-1.5 rounded hover:bg-white hover:text-[#1a1a1a] transition-colors font-medium whitespace-nowrap shrink-0"
      >
        Join / Sign in
      </a>
    </header>
  );
}
