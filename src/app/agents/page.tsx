import { db } from "@/db";
import { agents, users, agentRatings } from "@/db/schema";
import { eq, sql, desc } from "drizzle-orm";
import AgentsSearchView from "@/components/AgentsSearchView";
import { cdnUrl } from "@/services/userImagesService";

export const dynamic = "force-dynamic";

export default async function AgentsPage(props: PageProps<"/agents">) {
  const { sort } = await props.searchParams;
  const sortByRating = sort === "rating";

  const rows = await db
    .select({
      id:         agents.id,
      userId:     agents.userId,
      name:       agents.name,
      specialty:  agents.specialty,
      city:       agents.city,
      image:      agents.image,
      avatarKey:  users.avatarKey,
      rating:     agents.rating,
      reviews:    sql<number>`(
        SELECT COUNT(*) FROM ${agentRatings}
        WHERE ${agentRatings.agentId} = ${agents.id}
        AND ${agentRatings.comment} IS NOT NULL
      )`.as("reviews"),
      experience: agents.experience,
      phone:      agents.phone,
      email:      agents.email,
    })
    .from(agents)
    .leftJoin(users, eq(agents.userId, users.id))
    .orderBy(sortByRating ? desc(agents.rating) : agents.createdAt);

  const agentList = rows.map((a) => ({
    ...a,
    id:      String(a.id),
    userId:  a.userId ?? null,
    rating:  Number(a.rating),
    reviews: Number(a.reviews),
    image:   a.avatarKey ? cdnUrl(a.avatarKey) : a.image,
  }));

  return <AgentsSearchView agents={agentList} sortByRating={sortByRating} />;
}
