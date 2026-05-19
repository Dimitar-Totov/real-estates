import { db } from "@/db";
import { agents, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { cdnUrl } from "@/services/userImagesService";
import NewAgentsView from "@/components/NewAgentsView";

export const dynamic = "force-dynamic";

export default async function NewAgentsPage() {
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
      createdAt:  agents.createdAt,
    })
    .from(agents)
    .leftJoin(users, eq(agents.userId, users.id))
    .orderBy(desc(agents.createdAt))
    .limit(5);

  const agentList = rows.map((a) => ({
    ...a,
    id:        String(a.id),
    userId:    a.userId ?? null,
    rating:    Number(a.rating),
    image:     a.avatarKey ? cdnUrl(a.avatarKey) : a.image,
    createdAt: a.createdAt.toISOString(),
  }));

  return <NewAgentsView agents={agentList} />;
}
