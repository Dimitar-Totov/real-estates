import HeroSearch from "@/components/HeroSearch";

const FEATURES = [
  {
    icon: (
      <svg
        className="w-8 h-8"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
        />
      </svg>
    ),
    title: "Biggest Selection",
    description:
      "We show all the listings other sites hide — even new listings hitting the market today.",
  },
  {
    icon: (
      <svg
        className="w-8 h-8"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
    title: "Best Price",
    description:
      "Our agents charge half the typical fee — so you save thousands on every transaction.",
  },
  {
    icon: (
      <svg
        className="w-8 h-8"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
        />
      </svg>
    ),
    title: "Top-Rated Agents",
    description:
      "Work with the best agents in your area, backed by thousands of verified reviews.",
  },
];

export default function HomePage() {
  return (
    <>
      {/* ─────────────────────────── HERO ─────────────────────────── */}
      {/*
        The Navbar is now fixed at the top with modern styling.
        pt-16 pushes the content down to clear the navbar.
      */}
      <section className="relative h-[520px] sm:h-[620px] lg:h-[720px] xl:h-[760px] flex items-center overflow-hidden max-w-full mx-auto">

        {/* ── Photo background ── */}
        <div
          className="absolute inset-0 bg-cover bg-center max-w-[1920px] mx-auto "
          style={{ backgroundImage: "url('/hero.webp')" }}
        />

        {/* ── Hero content — padded top to clear the 56px navbar ── */}
        <div className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 pt-14">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-8 tracking-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)] max-w-3xl">
              Find the right home
              <br />
              at the right price
            </h1>
            <HeroSearch />
        </div>
      </section>

      {/* ─────────────── TOURING SECTION ─────────────── */}
      <section className="grid grid-cols-1 lg:grid-cols-2 min-h-[520px] mt-16 px-4 sm:px-6 lg:px-10 max-w-[1920px] mx-auto">
        <div className="flex flex-col justify-center px-4 sm:px-6 lg:px-10 py-16 max-w-xl">
          <h2 className="text-3xl sm:text-[2.2rem] font-bold text-gray-900 leading-snug mb-4">
            Start touring homes, no
            <br />
            strings attached
          </h2>
          <p className="text-gray-500 text-base leading-relaxed mb-8 max-w-sm">
            Unlike many other agents, our agents won&apos;t ask you to sign an
            exclusive commitment before they&apos;ll take you on a first tour.
          </p>
          <a
            href="/listings"
            className="bg-[#CC0000] hover:bg-[#aa0000] text-white font-semibold px-8 py-3 w-fit transition-colors text-sm"
          >
            Search for homes
          </a>
        </div>

        <div
          className="relative overflow-hidden min-h-[320px] lg:min-h-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/skyview-apartment.jpg')" }}
        >
          <div
            className="absolute inset-0"
            style={{ background: "rgba(0,0,0,0.08)" }}
          />
        </div>
      </section>

      {/* ─────────────── WHY US ─────────────── */}
      <section className="bg-gray-50 py-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-12 text-center">
            Why buyers and sellers choose us
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {FEATURES.map((f) => (
              <div key={f.title} className="flex flex-col items-start gap-4">
                <div className="text-[#CC0000]">{f.icon}</div>
                <h3 className="font-bold text-lg text-gray-900">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  {f.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────── FOOTER ─────────────── */}
      <footer className="border-t border-gray-200 text-center text-sm text-gray-400 py-8 px-4 sm:px-6">
        &copy; {new Date().getFullYear()} RealEstate &mdash; All rights
        reserved
      </footer>
    </>
  );
}
