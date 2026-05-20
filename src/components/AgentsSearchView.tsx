"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import AgentCard from "@/components/AgentCard";
import AgentFilters from "@/components/AgentFilters";
import SendMessageModal, { type MessageSender } from "@/components/SendMessageModal";
import ApplyForAgentModal from "@/components/ApplyForAgentModal";

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

export default function AgentsSearchView({
  agents: initial,
  sortByRating = false,
}: {
  agents: AgentRow[];
  sortByRating?: boolean;
}) {
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

  const [messageTarget, setMessageTarget]   = useState<AgentRow | null>(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [sender, setSender]                 = useState<MessageSender | null>(null);
  const [isAdmin, setIsAdmin]               = useState(false);
  const [canRate, setCanRate]               = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [myRatings, setMyRatings]     = useState<Record<string, number | null>>({});
  const [myComments, setMyComments]   = useState<Record<string, string | null>>({});

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

  // Once we know the user can rate, fetch their existing ratings + comments for all agents
  useEffect(() => {
    if (!canRate || initial.length === 0) return;
    Promise.all(
      initial.map((a) =>
        fetch(`/api/agents/${a.id}/my-rating`)
          .then((r) => r.json())
          .then((d) => [a.id, d] as [string, { rating: number | null; comment: string | null }])
          .catch(() => [a.id, { rating: null, comment: null }] as [string, { rating: number | null; comment: string | null }])
      )
    ).then((pairs) => {
      setMyRatings(Object.fromEntries(pairs.map(([id, d]) => [id, d.rating])));
      setMyComments(Object.fromEntries(pairs.map(([id, d]) => [id, d.comment])));
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
          <div className="md:w-64 flex-shrink-0 space-y-4">
            <AgentFilters
              specialties={specialtyOptions}
              cities={cityOptions}
              onFiltersChange={setFilters}
            />

            {canRate && sender && (
              <button
                onClick={() => setShowApplyModal(true)}
                className="w-full flex items-center justify-center gap-2.5 px-5 py-4 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:brightness-110 active:scale-[0.97]"
                style={{
                  background: "linear-gradient(135deg, #7c3aed 0%, #4338ca 100%)",
                  boxShadow: "0 4px 18px rgba(124,58,237,0.35)",
                }}
              >
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Apply for Agent
              </button>
            )}
          </div>

          <div className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {filteredAgents.length} Agent
                {filteredAgents.length !== 1 ? "s" : ""} Found
              </h2>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500 dark:text-gray-400">Sort by:</span>
                <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden text-sm font-medium">
                  <Link
                    href="/agents"
                    className={`px-3 py-1.5 transition-colors ${!sortByRating ? "bg-blue-600 text-white" : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"}`}
                  >
                    Newest
                  </Link>
                  <Link
                    href="/agents?sort=rating"
                    className={`px-3 py-1.5 transition-colors ${sortByRating ? "bg-blue-600 text-white" : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"}`}
                  >
                    Top Rated
                  </Link>
                </div>
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
                    myComment={myComments[agent.id] ?? null}
                    onDelete={handleDelete}
                    onEmail={() => sender ? setMessageTarget(agent) : setShowLoginPrompt(true)}
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

      {showLoginPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 text-center">
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-blue-100 dark:bg-blue-900/30 mx-auto mb-5">
              <svg className="w-7 h-7 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Login Required</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              You need to be logged in to contact an agent.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLoginPrompt(false)}
                className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <Link
                href="/auth"
                className="flex-1 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-sm font-medium text-white transition-colors text-center"
              >
                Log In
              </Link>
            </div>
          </div>
        </div>
      )}

      {showApplyModal && sender && (
        <ApplyForAgentModal
          username={sender.name}
          onClose={() => setShowApplyModal(false)}
        />
      )}
    </div>
  );
}
