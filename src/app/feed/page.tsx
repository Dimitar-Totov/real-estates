import { db } from "@/db";
import { feedItems } from "@/db/schema";
import { desc } from "drizzle-orm";
import FeedView from "@/components/FeedView";

export const dynamic = "force-dynamic";

export default async function FeedPage() {
  const rows = await db
    .select()
    .from(feedItems)
    .orderBy(desc(feedItems.createdAt));

  const items = rows.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
  }));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Real Estate Feed
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Stay updated with the latest listings, agent activity, and market insights
            </p>
          </div>
        </div>
      </div>

      <FeedView items={items} />
    </div>
  );
}
