"use client";

import { useState } from "react";

interface FeedItemRow {
  id: number;
  type: "listing" | "agent_activity" | "review" | "market_update";
  content: any;
  createdAt: string;
}

export default function FeedView({ items }: { items: FeedItemRow[] }) {
  const [filterType, setFilterType] = useState<"all" | "listings" | "agents" | "reviews" | "updates">("all");

  const filteredItems = items.filter((item) => {
    if (filterType === "all") return true;
    if (filterType === "listings") return item.type === "listing";
    if (filterType === "agents") return item.type === "agent_activity";
    if (filterType === "reviews") return item.type === "review";
    if (filterType === "updates") return item.type === "market_update";
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Filter Tabs */}
      <div className="mb-8 flex flex-wrap gap-2">
        {[
          { id: "all", label: "All Activity" },
          { id: "listings", label: "New Listings" },
          { id: "agents", label: "Agent Activity" },
          { id: "reviews", label: "Reviews" },
          { id: "updates", label: "Market Updates" },
        ].map((filter) => (
          <button
            key={filter.id}
            onClick={() => setFilterType(filter.id as any)}
            className={[
              "px-4 py-2 rounded-full font-medium transition-all duration-200 text-sm sm:text-base",
              filterType === filter.id
                ? "bg-blue-600 text-white shadow-md"
                : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600",
            ].join(" ")}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Feed Items */}
      <div className="space-y-6">
        {filteredItems.map((item) => (
          <div key={item.id}>
            {item.type === "listing" && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200">
                <div className="flex flex-col sm:flex-row">
                  <div className="sm:w-48 h-48 sm:h-auto flex-shrink-0 bg-gray-300 dark:bg-gray-700">
                    <img
                      src={item.content.image}
                      alt={item.content.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 p-4 sm:p-6 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </p>
                        <span className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded-full">
                          New Listing
                        </span>
                      </div>
                      <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-2">
                        {item.content.title}
                      </h3>
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                        ${Number(item.content.price).toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 flex items-center gap-1">
                        <span>📍</span> {item.content.location}
                      </p>
                      <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <span>🛏️ {item.content.beds} beds</span>
                        <span>🚿 {item.content.baths} baths</span>
                        <span>📐 {Number(item.content.sqft).toLocaleString()} sqft</span>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {item.content.agentImage && (
                          <img
                            src={item.content.agentImage}
                            alt={item.content.agent}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        )}
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {item.content.agent}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Agent</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {item.type === "agent_activity" && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 sm:p-6 hover:shadow-lg transition-shadow duration-200">
                <div className="flex items-start justify-between mb-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </p>
                  <span className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-2 py-1 rounded-full">
                    Agent Activity
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  {item.content.agentImage && (
                    <img
                      src={item.content.agentImage}
                      alt={item.content.agent}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">
                      <span className="font-bold">{item.content.agent}</span>{" "}
                      <span className="text-gray-600 dark:text-gray-400">{item.content.action}</span>
                    </p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">
                      {item.content.property}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {item.content.price} • {item.content.location}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {item.type === "review" && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 sm:p-6 hover:shadow-lg transition-shadow duration-200">
                <div className="flex items-start justify-between mb-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </p>
                  <span className="text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded-full">
                    Review
                  </span>
                </div>
                <div className="flex items-start gap-4">
                  {item.content.reviewerImage && (
                    <img
                      src={item.content.reviewerImage}
                      alt={item.content.reviewer}
                      className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                    />
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {item.content.reviewer}{" "}
                      <span className="text-gray-600 dark:text-gray-400">reviewed</span>{" "}
                      <span className="font-bold">{item.content.agent}</span>
                    </p>
                    <div className="flex gap-1 my-2">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <span key={i} className={i < item.content.rating ? "text-yellow-400" : "text-gray-300"}>
                          ⭐
                        </span>
                      ))}
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 italic">"{item.content.text}"</p>
                  </div>
                </div>
              </div>
            )}

            {item.type === "market_update" && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-xl shadow-md p-4 sm:p-6 hover:shadow-lg transition-shadow duration-200">
                <div className="flex items-start justify-between mb-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </p>
                  <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full">
                    Market Update
                  </span>
                </div>
                <div className="flex items-start gap-4">
                  <span className="text-3xl">{item.content.icon}</span>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                      {item.content.title}
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300">{item.content.summary}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400 text-lg">No items to display</p>
        </div>
      )}
    </div>
  );
}
