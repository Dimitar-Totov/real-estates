import AgentCard from "@/components/AgentCard";
import Link from "next/link";

export const dynamic = "force-dynamic";

const ALL_AGENTS = [
  { id: "1", name: "Sarah Johnson",    specialty: "Residential Sales",      city: "New York",       image: `https://picsum.photos/seed/agent-1/400/400`, rating: 4.9, reviews: 127, experience: 8,  phone: "(555) 123-4567", email: "sarah.johnson@realestate.com",   featured: true  },
  { id: "2", name: "Michael Chen",     specialty: "Commercial Real Estate",  city: "Los Angeles",    image: `https://picsum.photos/seed/agent-2/400/400`, rating: 4.8, reviews: 89,  experience: 12, phone: "(555) 234-5678", email: "michael.chen@realestate.com",    featured: true  },
  { id: "3", name: "Emily Rodriguez",  specialty: "Luxury Homes",            city: "Chicago",        image: `https://picsum.photos/seed/agent-3/400/400`, rating: 5.0, reviews: 156, experience: 10, phone: "(555) 345-6789", email: "emily.rodriguez@realestate.com", featured: true  },
  { id: "4", name: "David Thompson",   specialty: "Investment Properties",   city: "Houston",        image: `https://picsum.photos/seed/agent-4/400/400`, rating: 4.7, reviews: 94,  experience: 15, phone: "(555) 456-7890", email: "david.thompson@realestate.com",  featured: false },
  { id: "5", name: "Lisa Park",        specialty: "Rental Management",       city: "Phoenix",        image: `https://picsum.photos/seed/agent-5/400/400`, rating: 4.6, reviews: 78,  experience: 6,  phone: "(555) 567-8901", email: "lisa.park@realestate.com",       featured: false },
  { id: "6", name: "James Wilson",     specialty: "New Construction",        city: "Philadelphia",   image: `https://picsum.photos/seed/agent-6/400/400`, rating: 4.8, reviews: 112, experience: 9,  phone: "(555) 678-9012", email: "james.wilson@realestate.com",    featured: true  },
  { id: "7", name: "Maria Garcia",     specialty: "Residential Sales",       city: "San Antonio",    image: `https://picsum.photos/seed/agent-7/400/400`, rating: 4.9, reviews: 143, experience: 11, phone: "(555) 789-0123", email: "maria.garcia@realestate.com",    featured: false },
  { id: "8", name: "Robert Kim",       specialty: "Commercial Real Estate",  city: "San Diego",      image: `https://picsum.photos/seed/agent-8/400/400`, rating: 4.7, reviews: 67,  experience: 7,  phone: "(555) 890-1234", email: "robert.kim@realestate.com",      featured: false },
  { id: "9", name: "Amanda Foster",    specialty: "Luxury Homes",            city: "Miami",          image: `https://picsum.photos/seed/agent-9/400/400`, rating: 4.5, reviews: 54,  experience: 3,  phone: "(555) 901-2345", email: "amanda.foster@realestate.com",   featured: false },
  { id: "10", name: "Chris Nguyen",    specialty: "Investment Properties",   city: "Dallas",         image: `https://picsum.photos/seed/agent-10/400/400`, rating: 4.6, reviews: 41, experience: 2,  phone: "(555) 012-3456", email: "chris.nguyen@realestate.com",    featured: false },
  { id: "11", name: "Rachel Adams",    specialty: "New Construction",        city: "Seattle",        image: `https://picsum.photos/seed/agent-11/400/400`, rating: 4.8, reviews: 88, experience: 5,  phone: "(555) 111-2222", email: "rachel.adams@realestate.com",    featured: true  },
  { id: "12", name: "Tom Brennan",     specialty: "Rental Management",       city: "Boston",         image: `https://picsum.photos/seed/agent-12/400/400`, rating: 4.4, reviews: 33, experience: 1,  phone: "(555) 333-4444", email: "tom.brennan@realestate.com",     featured: false },
];

interface SearchParams { sort?: string; featured?: string }

const PAGE_META: Record<string, { title: string; subtitle: string }> = {
  rating:   { title: "Top-Rated Agents",    subtitle: "Our highest reviewed professionals, ranked by client satisfaction" },
  newest:   { title: "New Agents",          subtitle: "Fresh talent joining our network — energetic, driven, and ready to help" },
  featured: { title: "Featured Agents",     subtitle: "Editor's picks — exceptional agents recognised for outstanding service" },
  default:  { title: "All Agents",          subtitle: "Browse our full roster of real estate professionals" },
};

export default async function AgentsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const sort     = params.sort;
  const featured = params.featured === "true";

  let agents = [...ALL_AGENTS];

  if (featured) {
    agents = agents.filter((a) => a.featured);
  } else if (sort === "rating") {
    agents = agents.sort((a, b) => b.rating - a.rating);
  } else if (sort === "newest") {
    agents = agents.sort((a, b) => a.experience - b.experience);
  }

  const metaKey = featured ? "featured" : (sort ?? "default");
  const meta    = PAGE_META[metaKey] ?? PAGE_META.default;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      {/* ── Page header ── */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{meta.title}</h1>
        <p className="text-gray-400 mt-1.5 text-sm">{meta.subtitle}</p>
      </div>

      {/* ── Filter tabs ── */}
      <div className="flex flex-wrap items-center gap-2 mb-8">
        {[
          { label: "All Agents",      href: "/agents" },
          { label: "Top-Rated",       href: "/agents?sort=rating" },
          { label: "New Agents",      href: "/agents?sort=newest" },
          { label: "Featured",        href: "/agents?featured=true" },
        ].map(({ label, href }) => {
          const isActive =
            href === "/agents"
              ? !sort && !featured
              : href === `/agents?sort=${sort}`
              ? !!sort && !featured
              : href === "/agents?featured=true"
              ? featured
              : false;
          return (
            <Link
              key={href}
              href={href}
              className={[
                "text-xs font-semibold px-4 py-2 rounded-full border transition-colors",
                isActive
                  ? "bg-gray-900 text-white border-gray-900"
                  : "border-gray-200 text-gray-600 hover:border-gray-400 hover:text-gray-900",
              ].join(" ")}
            >
              {label}
            </Link>
          );
        })}

        <span className="ml-auto text-sm text-gray-500">
          <span className="font-semibold text-gray-900">{agents.length}</span>{" "}
          agent{agents.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* ── Grid ── */}
      {agents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-gray-100 shadow-sm text-center">
          <svg className="w-16 h-16 mb-4 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={0.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <p className="text-lg font-semibold text-gray-700 mb-1">No agents found</p>
          <p className="text-sm text-gray-400 mb-5">Try a different filter</p>
          <Link href="/agents" className="text-sm font-medium text-[#CC0000] hover:underline">
            View all agents
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {agents.map((agent) => (
            <AgentCard key={agent.id} agent={agent} />
          ))}
        </div>
      )}
    </div>
  );
}
