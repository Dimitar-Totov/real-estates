"use client";

import { usePathname } from "next/navigation";
import { useState, useRef } from "react";
import NavLink from "@/components/NavLink";

/* ── Icons ───────────────────────────────────────────────────── */
const ChevronIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
  </svg>
);

const icons = {
  grid:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  spark:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/></svg>,
  diamond:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4"><path d="M6 3h12l4 6-10 12L2 9z"/><path d="M2 9h20"/></svg>,
  tag:      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><circle cx="7" cy="7" r="1.5" fill="currentColor"/></svg>,
  house:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4"><path d="M3 12L12 3l9 9"/><path d="M9 21V12h6v9"/><path d="M3 12v9h18V12"/></svg>,
  building: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4"><rect x="3" y="3" width="18" height="18" rx="1"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/></svg>,
  tools:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3-3a6 6 0 01-7.9 7.9l-6.1 6.1a2 2 0 01-3-3l6.1-6.1a6 6 0 017.9-7.9l-3 3z"/></svg>,
  list:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M12 12v6M9 15h6"/></svg>,
  calendar: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>,
};

/* ── Data ────────────────────────────────────────────────────── */
type DropdownItem = { label: string; href: string; icon: React.ReactNode; description?: string };
type NavLinkDef =
  | { label: string; dropdown: false; href: string }
  | { label: string; dropdown: true; featured?: DropdownItem; items: DropdownItem[] };

const NAV_LINKS: NavLinkDef[] = [
  {
    label: "Buy",
    dropdown: true,
    featured: { label: "All Properties", href: "/listings", icon: icons.grid, description: "Browse every listing on the market" },
    items: [
      { label: "New Listings",       href: "/listings?sort=newest",      icon: icons.spark,    description: "Just hit the market" },
      { label: "Luxury Homes",       href: "/listings?type=luxury",      icon: icons.diamond,  description: "Premium & exclusive" },
      { label: "Affordable Homes",   href: "/listings?type=affordable",  icon: icons.tag,      description: "Best value picks" },
      { label: "Houses",             href: "/listings?type=house",       icon: icons.house,    description: "Single-family homes" },
      { label: "Apartments",         href: "/listings?type=apartment",   icon: icons.building, description: "Urban living" },
      { label: "New Developments",   href: "/listings?type=development", icon: icons.tools,    description: "Off-plan & pre-launch" },
    ],
  },
  {
    label: "Sell",
    dropdown: true,
    items: [
      { label: "List Your Property",       href: "/properties/new",    icon: icons.list,     description: "Get your home in front of buyers" },
      { label: "Schedule a Consultation",  href: "/sell/consultation", icon: icons.calendar, description: "Talk to an expert, no strings" },
    ],
  },
  { label: "Real Estate Agents", dropdown: false, href: "/agents" },
  { label: "Feed",               dropdown: false, href: "/feed" },
];

/* ── Component ───────────────────────────────────────────────── */
export default function Navbar() {
  // usePathname is used here only to drive the header background style
  const pathname = usePathname();
  const isHome = pathname === "/";

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown]         = useState<string | null>(null);
  const [mobileExpanded, setMobileExpanded]     = useState<string | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onEnter = (label: string) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpenDropdown(label);
  };
  const onLeave = () => {
    closeTimer.current = setTimeout(() => setOpenDropdown(null), 140);
  };

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

          <NavLink
            href="/"
            exact
            className="text-white font-bold text-lg tracking-[0.2em] uppercase hover:opacity-80 transition-opacity shrink-0"
          >
            RealEstate
          </NavLink>

          {/* ── Desktop nav ── */}
          <nav className="hidden md:flex items-center gap-1 flex-1 justify-center">
            {NAV_LINKS.map((link) =>
              link.dropdown ? (
                <div key={link.label} className="relative" onMouseEnter={() => onEnter(link.label)} onMouseLeave={onLeave}>
                  <button className={[
                    "flex items-center gap-1 text-sm px-3 py-2 rounded-lg transition-all duration-150 whitespace-nowrap",
                    openDropdown === link.label
                      ? "text-white bg-white/15"
                      : "text-white/90 hover:text-white hover:bg-white/10",
                  ].join(" ")}>
                    {link.label}
                    <ChevronIcon className={[
                      "w-3 h-3 opacity-60 shrink-0 transition-transform duration-200",
                      openDropdown === link.label ? "rotate-180 opacity-100" : "",
                    ].join(" ")} />
                  </button>

                  {/* ── Dropdown panel ── */}
                  <div className={[
                    "absolute top-[calc(100%+8px)] left-0 rounded-2xl overflow-hidden",
                    "bg-[#111]/90 backdrop-blur-xl border border-white/[0.08]",
                    "shadow-[0_24px_60px_rgba(0,0,0,0.55)]",
                    "transition-all duration-200 origin-top",
                    link.label === "Buy" ? "w-[480px]" : "w-[300px]",
                    openDropdown === link.label
                      ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
                      : "opacity-0 scale-95 -translate-y-2 pointer-events-none",
                  ].join(" ")}>

                    <div className="absolute -top-[5px] left-6 w-3 h-3 rotate-45 bg-[#111]/90 border-l border-t border-white/[0.08] rounded-tl-[2px]" />

                    <div className="relative p-3">
                      {/* Featured row — Buy only */}
                      {"featured" in link && link.featured && (
                        <NavLink
                          href={link.featured.href}
                          exact
                          className="flex items-center gap-3 px-3 py-3 mb-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] transition-colors group"
                          activeClassName="bg-white/[0.14]"
                          onClick={() => setOpenDropdown(null)}
                        >
                          <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-white/10 text-white/70 group-hover:text-white group-hover:bg-white/15 transition-colors shrink-0">
                            {link.featured.icon}
                          </span>
                          <div>
                            <div className="text-sm font-semibold text-white">{link.featured.label}</div>
                            <div className="text-xs text-white/50 mt-0.5">{link.featured.description}</div>
                          </div>
                          <svg className="w-4 h-4 text-white/30 group-hover:text-white/60 ml-auto transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M9 18l6-6-6-6"/></svg>
                        </NavLink>
                      )}

                      {/* Item grid */}
                      <div className={link.label === "Buy" ? "grid grid-cols-2 gap-1" : "flex flex-col gap-1"}>
                        {link.items.map((item) => (
                          <NavLink
                            key={item.label}
                            href={item.href}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.07] transition-colors group"
                            activeClassName="bg-white/[0.07]"
                            onClick={() => setOpenDropdown(null)}
                          >
                            <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-white/[0.06] text-white/50 group-hover:text-white/90 group-hover:bg-white/[0.12] transition-colors shrink-0">
                              {item.icon}
                            </span>
                            <div className="min-w-0">
                              <div className="text-sm text-white/80 group-hover:text-white transition-colors font-medium leading-tight truncate">{item.label}</div>
                              {item.description && (
                                <div className="text-[11px] text-white/35 group-hover:text-white/55 transition-colors mt-0.5 truncate">{item.description}</div>
                              )}
                            </div>
                          </NavLink>
                        ))}
                      </div>

                      {/* Footer strip — Sell only */}
                      {link.label === "Sell" && (
                        <div className="mt-3 pt-3 border-t border-white/[0.07] px-1">
                          <p className="text-[11px] text-white/35 leading-relaxed">
                            Our agents charge half the typical fee — save thousands on every transaction.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <NavLink
                  key={link.label}
                  href={link.href}
                  exact
                  className="flex items-center text-white/90 hover:text-white text-sm px-3 py-2 rounded-lg hover:bg-white/10 transition-colors whitespace-nowrap"
                  activeClassName="!text-white bg-white/10"
                >
                  {link.label}
                </NavLink>
              )
            )}
          </nav>

          {/* ── Desktop auth ── */}
          <div className="hidden md:block">
            <NavLink
              href="/auth"
              exact
              className="text-sm px-6 py-2 rounded-lg font-medium transition-colors border border-white/70 text-white hover:bg-white hover:text-[#1a1a1a]"
              activeClassName="!bg-white !text-[#1a1a1a] !border-white"
            >
              Join / Sign In
            </NavLink>
          </div>

          {/* ── Mobile burger ── */}
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden text-white p-2 rounded-lg hover:bg-white/10 transition-colors" aria-label="Toggle menu">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {isMobileMenuOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
        </div>

        {/* ── Mobile menu ── */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-white/10 bg-black/30 backdrop-blur-md">
            <nav className="px-4 py-4 space-y-1">
              {NAV_LINKS.map((link) =>
                link.dropdown ? (
                  <div key={link.label}>
                    <button
                      className="w-full flex items-center justify-between text-white text-sm px-3 py-3 rounded-lg hover:bg-white/10 transition-colors"
                      onClick={() => setMobileExpanded((v) => (v === link.label ? null : link.label))}
                    >
                      {link.label}
                      <ChevronIcon className={["w-3 h-3 opacity-70 transition-transform duration-200", mobileExpanded === link.label ? "rotate-180" : ""].join(" ")} />
                    </button>
                    {mobileExpanded === link.label && (
                      <div className="ml-3 mt-1 space-y-1 border-l border-white/20 pl-3">
                        {"featured" in link && link.featured && (
                          <NavLink
                            href={link.featured.href}
                            exact
                            className="block text-white/80 text-sm px-3 py-2 rounded-lg hover:bg-white/10 hover:text-white transition-colors"
                            activeClassName="!text-white bg-white/10"
                            onClick={() => { setIsMobileMenuOpen(false); setMobileExpanded(null); }}
                          >
                            {link.featured.label}
                          </NavLink>
                        )}
                        {link.items.map((item) => (
                          <NavLink
                            key={item.label}
                            href={item.href}
                            className="block text-white/80 text-sm px-3 py-2 rounded-lg hover:bg-white/10 hover:text-white transition-colors"
                            activeClassName="!text-white bg-white/10"
                            onClick={() => { setIsMobileMenuOpen(false); setMobileExpanded(null); }}
                          >
                            {item.label}
                          </NavLink>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <NavLink
                    key={link.label}
                    href={link.href}
                    exact
                    className="flex items-center text-white text-sm px-3 py-3 rounded-lg hover:bg-white/10 transition-colors"
                    activeClassName="bg-white/10"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {link.label}
                  </NavLink>
                )
              )}
              <NavLink
                href="/auth"
                exact
                className="block text-sm px-3 py-3 rounded-lg font-medium text-center mt-2 transition-colors border border-white/70 text-white hover:bg-white hover:text-[#1a1a1a]"
                activeClassName="!bg-white !text-[#1a1a1a] !border-white"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Join / Sign In
              </NavLink>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
