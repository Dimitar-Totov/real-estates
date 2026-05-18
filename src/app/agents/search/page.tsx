import { db } from "@/db";
import { agents, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import AgentsSearchView from "@/components/AgentsSearchView";
import { cdnUrl } from "@/services/userImagesService";

export const dynamic = "force-dynamic";

export default async function AgentsSearchPage() {
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
      reviews:    agents.reviews,
      experience: agents.experience,
      phone:      agents.phone,
      email:      agents.email,
    })
    .from(agents)
    .leftJoin(users, eq(agents.userId, users.id))
    .orderBy(agents.createdAt);

  const agentList = rows.map((a) => ({
    ...a,
    id:     String(a.id),
    userId: a.userId ?? null,
    rating: Number(a.rating),
    image:  a.avatarKey ? cdnUrl(a.avatarKey) : a.image,
  }));

  return <AgentsSearchView agents={agentList} />;
}
