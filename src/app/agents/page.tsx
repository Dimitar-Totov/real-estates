import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import { db } from "@/db";
import { agents } from "@/db/schema";
import { desc, asc } from "drizzle-orm";
import AgentsClientView from "@/components/AgentsClientView";

export const dynamic = "force-dynamic";

interface SearchParams { sort?: string; featured?: string }

const PAGE_META: Record<string, { title: string; subtitle: string }> = {
  rating:   { title: "Top-Rated Agents", subtitle: "Our highest reviewed professionals, ranked by client satisfaction" },
  newest:   { title: "New Agents",       subtitle: "Fresh talent joining our network — energetic, driven, and ready to help" },
  featured: { title: "Featured Agents",  subtitle: "Editor's picks — exceptional agents recognised for outstanding service" },
  default:  { title: "All Agents",       subtitle: "Browse our full roster of real estate professionals" },
};

export default async function AgentsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params  = await searchParams;
  const sort    = params.sort;
  const featured = params.featured === "true";

  let rows = await db
    .select()
    .from(agents)
    .orderBy(
      sort === "rating" ? desc(agents.rating) :
      sort === "newest" ? desc(agents.createdAt) :
      asc(agents.id)
    );

  if (featured) rows = rows.filter((a) => a.featured);

  const agentList = rows.map((a) => ({
    id:         String(a.id),
    name:       a.name,
    specialty:  a.specialty,
    city:       a.city,
    image:      a.image,
    rating:     Number(a.rating),
    reviews:    a.reviews,
    experience: Math.floor((Date.now() - new Date(a.createdAt).getTime()) / (365.25 * 24 * 60 * 60 * 1000)),
    phone:      a.phone,
    email:      a.email,
  }));

  const metaKey = featured ? "featured" : (sort ?? "default");
  const meta    = PAGE_META[metaKey] ?? PAGE_META.default;

  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  let isAdmin = false;
  if (token) {
    try { isAdmin = verifyToken(token).role === "admin"; } catch { /* invalid */ }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{meta.title}</h1>
        <p className="text-gray-400 mt-1.5 text-sm">{meta.subtitle}</p>
      </div>

      <AgentsClientView
        agents={agentList}
        isAdmin={isAdmin}
        sort={sort}
        featured={featured}
      />
    </div>
  );
}
