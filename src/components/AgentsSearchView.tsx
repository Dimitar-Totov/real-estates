"use client";

import { useState, useMemo, useEffect } from "react";
import AgentCard from "@/components/AgentCard";
import AgentFilters from "@/components/AgentFilters";
import SendMessageModal, { type MessageSender } from "@/components/SendMessageModal";

export interface AgentRow {
  id: string;
  userId: number | null;
  name: string;
  specialty: string;
  city: string;
  image: string;
  rating: number;
  reviews: number;
  experience: number;
  phone: string;
  email: string;
}

export default function AgentsSearchView({ agents: initial }: { agents: AgentRow[] }) {
  const [agents, setAgents] = useState(initial);
  const [filters, setFilters] = useState({
    specialties: [] as string[],
    cities: [] as string[],
    searchName: "",
  });

  const specialtyOptions = useMemo(
    () => [...new Set(initial.map((a) => a.specialty))].sort(),
    [initial]
  );
  const cityOptions = useMemo(
    () => [...new Set(initial.map((a) => a.city))].sort(),
    [initial]
  );

  const [messageTarget, setMessageTarget] = useState<AgentRow | null>(null);
  const [sender, setSender]               = useState<MessageSender | null>(null);
  const [isAdmin, setIsAdmin]             = useState(false);
  const [canRate, setCanRate]             = useState(false);
  const [myRatings, setMyRatings]         = useState<Record<string, number | null>>({});

  useEffect(() => {
    fetch("/api/user/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.id) {
          setSender({ id: data.id, name: data.username, email: data.email });
          setIsAdmin(data.role === "admin");
          // Only regular "user" role can rate — not admin, not the agent themselves
          setCanRate(data.role === "user");
        }
      })
      .catch(() => {});
  }, []);

  // Once we know the user can rate, fetch their existing ratings for all agents
  useEffect(() => {
    if (!canRate || initial.length === 0) return;
    Promise.all(
      initial.map((a) =>
        fetch(`/api/agents/${a.id}/my-rating`)
          .then((r) => r.json())
          .then((d) => [a.id, d.rating ?? null] as [string, number | null])
          .catch(() => [a.id, null] as [string, number | null])
      )
    ).then((pairs) => {
      setMyRatings(Object.fromEntries(pairs));
    });
  }, [canRate, initial]);

  const handleDelete = async (id: string) => {
    await fetch(`/api/admin/agents/${id}`, { method: "DELETE" });
    setAgents((prev) => prev.filter((a) => a.id !== id));
  };

  const filteredAgents = useMemo(() => {
    return agents.filter((agent: AgentRow) => {
      if (
        filters.searchName &&
        !agent.name.toLowerCase().includes(filters.searchName.toLowerCase())
      ) {
        return false;
      }

      if (filters.specialties.length > 0 && !filters.specialties.includes(agent.specialty)) {
        return false;
      }

      if (filters.cities.length > 0 && !filters.cities.includes(agent.city)) {
        return false;
      }

      return true;
    });
  }, [agents, filters]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Find Your Perfect Real Estate Agent
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Connect with top-rated real estate professionals in your area.
              Browse agents by specialty, location, and experience.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="md:w-64 flex-shrink-0">
            <AgentFilters
              specialties={specialtyOptions}
              cities={cityOptions}
              onFiltersChange={setFilters}
            />
          </div>

          <div className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {filteredAgents.length} Agent
                {filteredAgents.length !== 1 ? "s" : ""} Found
              </h2>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Showing {filteredAgents.length} of {agents.length} agents
              </div>
            </div>

            {filteredAgents.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No agents found</h3>
                <p className="text-gray-500 dark:text-gray-400">Try adjusting your filters to see more results.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredAgents.map((agent) => (
                  <AgentCard
                    key={agent.id}
                    agent={agent}
                    isAdmin={isAdmin}
                    isOwnCard={agent.userId === sender?.id}
                    canRate={canRate && agent.userId !== sender?.id}
                    myRating={myRatings[agent.id] ?? null}
                    onDelete={handleDelete}
                    onEmail={() => setMessageTarget(agent)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {messageTarget && sender && (
        <SendMessageModal
          sender={sender}
          receiver={{ id: messageTarget.userId!, name: messageTarget.name }}
          onClose={() => setMessageTarget(null)}
        />
      )}
    </div>
  );
}
