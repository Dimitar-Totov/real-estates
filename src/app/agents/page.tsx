import Link from "next/link";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import { db } from "@/db";
import { agents } from "@/db/schema";
import { desc, asc } from "drizzle-orm";
import AgentsGrid from "@/components/AgentsGrid";

export const dynamic = "force-dynamic";

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
  const params   = await searchParams;
  const sort     = params.sort;
  const featured = params.featured === "true";

  // Build query
  let rows = await db
    .select()
    .from(agents)
    .orderBy(
      sort === "rating" ? desc(agents.rating) :
      sort === "newest" ? asc(agents.experience) :
      asc(agents.id)
    );

  if (featured) rows = rows.filter((a) => a.featured);

  // Map DB row to the shape AgentCard expects (id as string, rating as number)
  const agentList = rows.map((a) => ({
    id:         String(a.id),
    name:       a.name,
    specialty:  a.specialty,
    city:       a.city,
    image:      a.image,
    rating:     Number(a.rating),
    reviews:    a.reviews,
    experience: a.experience,
    phone:      a.phone,
    email:      a.email,
  }));

  const metaKey = featured ? "featured" : (sort ?? "default");
  const meta    = PAGE_META[metaKey] ?? PAGE_META.default;

  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  let isAdmin = false;
  if (token) {
    try { isAdmin = verifyToken(token).role === "admin"; } catch { /* invalid token */ }
  }

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
          { label: "All Agents",  href: "/agents" },
          { label: "Top-Rated",   href: "/agents?sort=rating" },
          { label: "New Agents",  href: "/agents?sort=newest" },
          { label: "Featured",    href: "/agents?featured=true" },
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
          <span className="font-semibold text-gray-900">{agentList.length}</span>{" "}
          agent{agentList.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* ── Grid ── */}
      <AgentsGrid agents={agentList} isAdmin={isAdmin} />
    </div>
  );
}
