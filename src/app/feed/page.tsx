import { db } from "@/db";
import { agents, agentRatings, properties, users } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import FeedView from "@/components/FeedView";

export const dynamic = "force-dynamic";

export default async function FeedPage() {
  const [recentProperties, recentReviews, recentAgents] = await Promise.all([
    db
      .select({
        id: properties.id,
        title: properties.title,
        price: properties.price,
        city: properties.city,
        state: properties.state,
        type: properties.type,
        status: properties.status,
        bedrooms: properties.bedrooms,
        bathrooms: properties.bathrooms,
        squareFeet: properties.squareFeet,
        images: properties.images,
        createdAt: properties.createdAt,
        agentId: properties.listedByAgentId,
        agentName: agents.name,
        agentImage: agents.image,
      })
      .from(properties)
      .leftJoin(agents, eq(properties.listedByAgentId, agents.id))
      .orderBy(desc(properties.createdAt))
      .limit(10),

    db
      .select({
        id: agentRatings.id,
        rating: agentRatings.rating,
        comment: agentRatings.comment,
        createdAt: agentRatings.createdAt,
        agentId: agentRatings.agentId,
        agentName: agents.name,
        agentImage: agents.image,
        reviewerName: users.username,
        reviewerImage: users.avatarKey,
      })
      .from(agentRatings)
      .innerJoin(agents, eq(agentRatings.agentId, agents.id))
      .innerJoin(users, eq(agentRatings.userId, users.id))
      .where(
        // only reviews that have a comment
        eq(agentRatings.comment, agentRatings.comment)
      )
      .orderBy(desc(agentRatings.createdAt))
      .limit(10),

    db
      .select({
        id: agents.id,
        name: agents.name,
        image: agents.image,
        specialty: agents.specialty,
        city: agents.city,
        createdAt: agents.createdAt,
      })
      .from(agents)
      .orderBy(desc(agents.createdAt))
      .limit(5),
  ]);

  type FeedItemRow = {
    id: number;
    type: "listing" | "agent_activity" | "review";
    content: Record<string, unknown>;
    createdAt: string;
  };

  const items: FeedItemRow[] = [];

  for (const p of recentProperties) {
    if (p.status === "for_sale" || p.status === "for_rent") {
      items.push({
        id: p.id,
        type: "listing",
        content: {
          title: p.title,
          price: p.price,
          location: `${p.city}, ${p.state}`,
          beds: p.bedrooms,
          baths: p.bathrooms,
          sqft: p.squareFeet,
          image: p.images?.[0] ?? null,
          propertyType: p.type,
          status: p.status,
          agent: p.agentName ?? null,
          agentImage: p.agentImage ?? null,
        },
        createdAt: p.createdAt.toISOString(),
      });
    } else {
      items.push({
        id: p.id * 10000,
        type: "agent_activity",
        content: {
          agent: p.agentName ?? "Unknown Agent",
          agentImage: p.agentImage ?? null,
          action: p.status === "sold" ? "sold" : "rented out",
          property: p.title,
          price: `$${Number(p.price).toLocaleString()}`,
          location: `${p.city}, ${p.state}`,
        },
        createdAt: p.createdAt.toISOString(),
      });
    }
  }

  for (const r of recentReviews) {
    if (!r.comment) continue;
    items.push({
      id: r.id + 100000,
      type: "review",
      content: {
        reviewer: r.reviewerName,
        reviewerImage: r.reviewerImage ?? null,
        agent: r.agentName,
        agentImage: r.agentImage,
        rating: r.rating,
        text: r.comment,
      },
      createdAt: r.createdAt.toISOString(),
    });
  }

  for (const a of recentAgents) {
    items.push({
      id: a.id + 200000,
      type: "agent_activity",
      content: {
        agent: a.name,
        agentImage: a.image,
        action: "joined as a new agent specializing in",
        property: a.specialty,
        price: null,
        location: a.city,
        isNewAgent: true,
      },
      createdAt: a.createdAt.toISOString(),
    });
  }

  items.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Real Estate Feed
            </h1>
            <p className="text-base text-gray-500 dark:text-gray-400">
              Latest listings, agent activity, and community reviews
            </p>
          </div>
        </div>
      </div>
      <FeedView items={items} />
    </div>
  );
}
