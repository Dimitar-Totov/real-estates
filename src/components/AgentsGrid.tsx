"use client";

import { useState } from "react";
import AgentCard from "@/components/AgentCard";

interface Agent {
  id: string;
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

export default function AgentsGrid({ agents: initial, isAdmin }: { agents: Agent[]; isAdmin: boolean }) {
  const [agents, setAgents] = useState(initial);

  const handleDelete = (id: string) => {
    setAgents((prev) => prev.filter((a) => a.id !== id));
  };

  if (agents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-gray-100 shadow-sm text-center">
        <svg className="w-16 h-16 mb-4 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={0.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <p className="text-lg font-semibold text-gray-700 mb-1">No agents found</p>
        <p className="text-sm text-gray-400">All agents have been removed or no results match your filter.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
      {agents.map((agent) => (
        <AgentCard
          key={agent.id}
          agent={agent}
          isAdmin={isAdmin}
          onDelete={handleDelete}
        />
      ))}
    </div>
  );
}
