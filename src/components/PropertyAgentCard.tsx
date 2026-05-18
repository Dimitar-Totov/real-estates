"use client";

import { useState, useEffect } from "react";
import { Mail, Trash2, AlertTriangle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import SendMessageModal, { type MessageSender } from "@/components/SendMessageModal";

interface Props {
  agentName: string;
  agentUserId: number | null;
  agentImage: string | null;
  propertyTitle: string;
  propertyId: number;
  isOwnListing?: boolean;
}

export default function PropertyAgentCard({ agentName, agentUserId, agentImage, propertyTitle, propertyId, isOwnListing = false }: Props) {
  const router = useRouter();
  const [sender, setSender] = useState<MessageSender | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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

  const handleDelete = async () => {
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/properties/${propertyId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to delete listing.");
      }
      router.push("/profile");
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Failed to delete listing.");
      setDeleting(false);
    }
  };

  return (
    <>
      {/* ── Agent card ── */}
      <div className="mt-4 bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex items-center gap-4">
        {agentImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={agentImage}
            alt={agentName}
            className="w-14 h-14 rounded-full object-cover border-2 border-gray-100 shrink-0"
          />
        ) : (
          <div className="w-14 h-14 rounded-full bg-gray-200 border-2 border-gray-100 shrink-0 flex items-center justify-center text-gray-400">
            <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            </svg>
          </div>
        )}
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

      {/* ── Delete listing (own listings only) ── */}
      {isOwnListing && (
        <div className="mt-3">
          {!confirming ? (
            <button
              onClick={() => setConfirming(true)}
              className="group w-full flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 hover:border-red-300 active:bg-red-200 text-red-600 hover:text-red-700 font-medium text-sm transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-red-100 group-hover:bg-red-200 transition-colors duration-200">
                <Trash2 className="w-3.5 h-3.5 transition-transform duration-200 group-hover:scale-110" />
              </span>
              Delete this listing
            </button>
          ) : (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
              <div className="flex items-start gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-red-100 shrink-0 mt-0.5">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-red-800">Delete this listing?</p>
                  <p className="text-xs text-red-500 mt-0.5">This action cannot be undone. The listing will be permanently removed.</p>
                </div>
              </div>

              {deleteError && (
                <p className="text-xs text-red-600 bg-red-100 rounded-lg px-3 py-2">{deleteError}</p>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-sm font-semibold shadow-sm transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {deleting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  {deleting ? "Deleting…" : "Yes, delete"}
                </button>
                <button
                  onClick={() => { setConfirming(false); setDeleteError(null); }}
                  disabled={deleting}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-white hover:bg-gray-50 active:bg-gray-100 text-gray-700 text-sm font-semibold border border-gray-200 shadow-sm transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

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
