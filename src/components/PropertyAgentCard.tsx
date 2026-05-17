"use client";

import { useState, useEffect } from "react";
import { Mail } from "lucide-react";
import SendMessageModal, { type MessageSender } from "@/components/SendMessageModal";

interface Props {
  seed: number;
  agentName: string;
  agentUserId: number | null;
  propertyTitle: string;
}

export default function PropertyAgentCard({ seed, agentName, agentUserId, propertyTitle }: Props) {
  const [sender, setSender] = useState<MessageSender | null>(null);
  const [showModal, setShowModal] = useState(false);

  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/user/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.id) {
          setSender({ id: data.id, name: data.username, email: data.email });
          setCurrentUserId(data.id);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <>
      <div className="mt-4 bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex items-center gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`https://picsum.photos/seed/agent-${seed}/80/80`}
          alt="Agent"
          className="w-14 h-14 rounded-full object-cover border-2 border-gray-100 shrink-0"
        />
        <div className="min-w-0">
          <p className="font-semibold text-gray-900 text-sm">Listed by</p>
          <p className="text-gray-700 font-medium truncate">{agentName}</p>
          <p className="text-xs text-gray-400">RealEstate · Top Agent</p>
        </div>
        {currentUserId !== agentUserId && (
          <button
            onClick={() => setShowModal(true)}
            disabled={!agentUserId || !sender}
            title={!agentUserId ? "Agent has no linked account" : !sender ? "Sign in to send a message" : `Email ${agentName}`}
            className="ml-auto shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Mail className="w-4 h-4" />
          </button>
        )}
      </div>

      {showModal && sender && agentUserId && (
        <SendMessageModal
          sender={sender}
          receiver={{ id: agentUserId, name: agentName }}
          initialSubject={`Inquiry about: ${propertyTitle}`}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
