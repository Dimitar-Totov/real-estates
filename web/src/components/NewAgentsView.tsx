"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import AgentCard from "@/components/AgentCard";
import SendMessageModal, { type MessageSender } from "@/components/SendMessageModal";
import type { AgentRow } from "@/components/AgentsSearchView";

interface NewAgentRow extends AgentRow {
  createdAt: string;
}

export default function NewAgentsView({ agents: initial }: { agents: NewAgentRow[] }) {
  const [agents, setAgents]             = useState(initial);
  const [messageTarget, setMessageTarget] = useState<NewAgentRow | null>(null);
  const [sender, setSender]             = useState<MessageSender | null>(null);
  const [isAdmin, setIsAdmin]           = useState(false);

  useEffect(() => {
    fetch("/api/user/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.id) {
          setSender({ id: data.id, name: data.username, email: data.email });
          setIsAdmin(data.role === "admin");
        }
      })
      .catch(() => {});
  }, []);

  const handleDelete = async (id: string) => {
    await fetch(`/api/admin/agents/${id}`, { method: "DELETE" });
    setAgents((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-medium px-3 py-1.5 rounded-full mb-4">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                <circle cx="10" cy="7" r="4"/>
                <path d="M2 21v-2a4 4 0 014-4h8a4 4 0 014 4v2"/>
                <path d="M19 8v6M22 11h-6"/>
              </svg>
              Recently Joined
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              New Agents
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Meet the latest professionals to join our network. Fresh talent, new perspectives.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {agents.length === 0 ? (
          <div className="text-center py-20">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No agents yet</h3>
            <p className="text-gray-500 dark:text-gray-400">Check back soon — new agents are joining every day.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {agents.length} New Agent{agents.length !== 1 ? "s" : ""}
              </h2>
              <Link
                href="/agents/search"
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
              >
                Browse all agents →
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {agents.map((agent) => (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  isAdmin={isAdmin}
                  isOwnCard={agent.userId === sender?.id}
                  onDelete={handleDelete}
                  onEmail={() => setMessageTarget(agent)}
                />
              ))}
            </div>
          </>
        )}
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
