"use client";

import { useState } from "react";
import PropertyCard from "@/components/PropertyCard";

interface FeedItem {
  id: string;
  type: "listing" | "agent_activity" | "review" | "market_update";
  timestamp: string;
  content: any;
}

// Hardcoded feed data
const FEED_ITEMS: FeedItem[] = [
  {
    id: "1",
    type: "listing",
    timestamp: "2 hours ago",
    content: {
      id: "prop-1",
      title: "Modern Luxury Penthouse in Manhattan",
      price: 4500000,
      location: "Upper East Side, Manhattan, NY",
      beds: 4,
      baths: 3.5,
      sqft: 4200,
      image: "https://images.unsplash.com/photo-1512917774080-9264f475eabf?w=600&h=400&fit=crop",
      agent: "Sarah Johnson",
      agentImage: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=50&h=50&fit=crop&crop=face",
    },
  },
  {
    id: "2",
    type: "agent_activity",
    timestamp: "4 hours ago",
    content: {
      agent: "Michael Chen",
      agentImage: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop&crop=face",
      action: "just sold",
      property: "Charming Victorian Home",
      price: "2.3M",
      location: "Los Angeles, CA",
    },
  },
  {
    id: "3",
    type: "review",
    timestamp: "6 hours ago",
    content: {
      reviewer: "John Smith",
      reviewerImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&fit=crop&crop=face",
      agent: "Emily Rodriguez",
      rating: 5,
      text: "Emily was absolutely amazing! Found us the perfect home in record time. Highly recommended!",
    },
  },
  {
    id: "4",
    type: "listing",
    timestamp: "8 hours ago",
    content: {
      id: "prop-2",
      title: "Waterfront Estate with Private Beach",
      price: 8900000,
      location: "Malibu, California",
      beds: 6,
      baths: 5,
      sqft: 8500,
      image: "https://images.unsplash.com/photo-1613490493976-6f3031224c94?w=600&h=400&fit=crop",
      agent: "David Thompson",
      agentImage: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=50&h=50&fit=crop&crop=face",
    },
  },
  {
    id: "5",
    type: "market_update",
    timestamp: "1 day ago",
    content: {
      title: "Housing Market Trends: Spring 2026",
      summary: "New data shows a 12% increase in property values across major metropolitan areas. Interest rates remain stable at 4.2%.",
      icon: "📊",
    },
  },
  {
    id: "6",
    type: "listing",
    timestamp: "1 day ago",
    content: {
      id: "prop-3",
      title: "Contemporary Ranch Home",
      price: 1250000,
      location: "Austin, Texas",
      beds: 5,
      baths: 3,
      sqft: 4000,
      image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600&h=400&fit=crop",
      agent: "Lisa Park",
      agentImage: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=50&h=50&fit=crop&crop=face",
    },
  },
  {
    id: "7",
    type: "agent_activity",
    timestamp: "1 day ago",
    content: {
      agent: "James Wilson",
      agentImage: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=50&h=50&fit=crop&crop=face",
      action: "listed",
      property: "Luxury Townhouse",
      price: "3.1M",
      location: "Philadelphia, PA",
    },
  },
  {
    id: "8",
    type: "review",
    timestamp: "2 days ago",
    content: {
      reviewer: "Maria Garcia",
      reviewerImage: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=50&h=50&fit=crop&crop=face",
      agent: "Sarah Johnson",
      rating: 5,
      text: "Professional, responsive, and truly cares about finding the right property. Sarah exceeded all my expectations!",
    },
  },
];

export default function FeedPage() {
  const [filterType, setFilterType] = useState<"all" | "listings" | "agents" | "reviews" | "updates">("all");

  const filteredItems = FEED_ITEMS.filter((item) => {
    if (filterType === "all") return true;
    if (filterType === "listings") return item.type === "listing";
    if (filterType === "agents") return item.type === "agent_activity";
    if (filterType === "reviews") return item.type === "review";
    if (filterType === "updates") return item.type === "market_update";
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
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

      {/* Main Content */}
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
                    {/* Image */}
                    <div className="sm:w-48 h-48 sm:h-auto flex-shrink-0 bg-gray-300 dark:bg-gray-700">
                      <img
                        src={item.content.image}
                        alt={item.content.title}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-4 sm:p-6 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs text-gray-500 dark:text-gray-400">{item.timestamp}</p>
                          <span className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded-full">
                            New Listing
                          </span>
                        </div>
                        <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-2">
                          {item.content.title}
                        </h3>
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                          ${item.content.price.toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 flex items-center gap-1">
                          <span>📍</span> {item.content.location}
                        </p>
                        <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400">
                          <span>🛏️ {item.content.beds} beds</span>
                          <span>🚿 {item.content.baths} baths</span>
                          <span>📐 {item.content.sqft.toLocaleString()} sqft</span>
                        </div>
                      </div>

                      {/* Agent Info */}
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <img
                            src={item.content.agentImage}
                            alt={item.content.agent}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {item.content.agent}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Agent</p>
                          </div>
                        </div>
                        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors">
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {item.type === "agent_activity" && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 sm:p-6 hover:shadow-lg transition-shadow duration-200">
                  <div className="flex items-start justify-between mb-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400">{item.timestamp}</p>
                    <span className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-2 py-1 rounded-full">
                      Agent Activity
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    <img
                      src={item.content.agentImage}
                      alt={item.content.agent}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">
                        <span className="font-bold">{item.content.agent}</span>
                        {" "}
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
                    <p className="text-xs text-gray-500 dark:text-gray-400">{item.timestamp}</p>
                    <span className="text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded-full">
                      Review
                    </span>
                  </div>

                  <div className="flex items-start gap-4">
                    <img
                      src={item.content.reviewerImage}
                      alt={item.content.reviewer}
                      className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {item.content.reviewer}
                        {" "}
                        <span className="text-gray-600 dark:text-gray-400">reviewed</span>
                        {" "}
                        <span className="font-bold">{item.content.agent}</span>
                      </p>

                      {/* Rating Stars */}
                      <div className="flex gap-1 my-2">
                        {Array.from({ length: 5 }).map((_, i) => (
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
                    <p className="text-xs text-gray-500 dark:text-gray-400">{item.timestamp}</p>
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
                      <p className="text-gray-700 dark:text-gray-300">
                        {item.content.summary}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredItems.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 text-lg">No items to display</p>
          </div>
        )}
      </div>
    </div>
  );
}
