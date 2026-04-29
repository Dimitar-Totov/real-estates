"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useState } from "react";

const NAV_LINKS = [
  { label: "Buy", dropdown: true },
  { label: "Sell", dropdown: true },
  { label: "Real Estate Agents", dropdown: true },
  { label: "Feed", dropdown: false },
];

export default function Navbar() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header
      className={[
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isHome
          ? "bg-gradient-to-b from-black/50 to-transparent backdrop-blur-sm"
          : "bg-[#1a1a1a]/95 backdrop-blur-md shadow-lg border-b border-white/10",
      ].join(" ")}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="flex items-center justify-between h-16">
          <Link
            href="/"
            className="text-white font-bold text-lg tracking-[0.2em] uppercase hover:opacity-80 transition-opacity shrink-0"
          >
            RealEstate
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6 flex-1 justify-center">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href="#"
                className="flex items-center gap-1 text-white text-base px-3 py-2 rounded-lg hover:bg-white/10 transition-colors whitespace-nowrap"
              >
                {link.label}
                {link.dropdown && (
                  <svg
                    className="w-3 h-3 opacity-70 shrink-0"
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

          {/* Desktop Auth Button */}
          <div className="hidden md:block">
            <Link
              href="/auth"
              className={[
                "text-sm px-6 py-2 rounded-lg font-medium transition-colors",
                pathname === "/auth"
                  ? "bg-white text-[#1a1a1a]"
                  : "border border-white/70 text-white hover:bg-white hover:text-[#1a1a1a]",
              ].join(" ")}
            >
              Join / Sign in
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Toggle menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {isMobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-white/10 bg-black/20 backdrop-blur-md">
            <nav className="px-4 py-4 space-y-2">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.label}
                  href="#"
                  className="flex items-center gap-2 text-white text-sm px-3 py-3 rounded-lg hover:bg-white/10 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.label}
                  {link.dropdown && (
                    <svg
                      className="w-3 h-3 opacity-70 shrink-0"
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
              <Link
                href="/auth"
                className={[
                  "block text-sm px-3 py-3 rounded-lg font-medium text-center mt-4 transition-colors",
                  pathname === "/auth"
                    ? "bg-white text-[#1a1a1a]"
                    : "border border-white/70 text-white hover:bg-white hover:text-[#1a1a1a]",
                ].join(" ")}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Join / Sign in
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
