"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { X, MessageSquarePlus, CheckCircle2, AlertCircle } from "lucide-react";

interface CommentModalProps {
  agentId: string;
  agentName: string;
  hasRated: boolean;
  existingComment: string | null;
  onClose: () => void;
  onSaved: (comment: string) => void;
}

const MAX_CHARS = 500;

export default function CommentModal({
  agentId,
  agentName,
  hasRated,
  existingComment,
  onClose,
  onSaved,
}: CommentModalProps) {
  const [text, setText]     = useState(existingComment ?? "");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errMsg, setErrMsg] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);


  const submit = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;

    setStatus("loading");
    setErrMsg("");

    try {
      const res = await fetch(`/api/agents/${agentId}/comment`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment: trimmed }),
      });

      if (res.ok) {
        toast.success("Comment submitted successfully!");
        onSaved(trimmed);
        onClose();
      } else {
        const data = await res.json();
        setErrMsg(data.error ?? "Something went wrong");
        setStatus("error");
      }
    } catch {
      setErrMsg("Network error. Please try again.");
      setStatus("error");
    }
  };

  const alreadyCommented = existingComment !== null;
  const remaining        = MAX_CHARS - text.length;
  const isOverLimit      = remaining < 0;
  const isEmpty          = text.trim().length === 0;
  const canSubmit        = !isEmpty && !isOverLimit && hasRated && !alreadyCommented && status !== "loading";

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
    >
      <div
        className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden"
        style={{ animation: "modalIn 0.22s cubic-bezier(0.34,1.56,0.64,1) both" }}
      >
        {/* Gradient top bar */}
        <div className="h-1 w-full bg-gradient-to-r from-blue-500 via-violet-500 to-purple-500" />

        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-5 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 shadow-lg shadow-blue-500/30">
              <MessageSquarePlus className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
                Leave a Comment
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                About <span className="font-medium text-blue-600 dark:text-blue-400">{agentName}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 pb-6 space-y-4">
          {!hasRated && (
            <div className="flex items-center gap-2.5 text-sm text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3">
              <AlertCircle className="w-4 h-4 shrink-0" />
              You need to rate this agent first before leaving a comment.
            </div>
          )}

          {alreadyCommented && (
            <div className="flex items-center gap-2.5 text-sm text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl px-4 py-3">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              You have already left a comment for this agent.
            </div>
          )}

          <div className="relative">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                if (status === "error") setStatus("idle");
              }}
              disabled={!hasRated || alreadyCommented || status === "loading"}
              placeholder={
                hasRated
                  ? "Share your experience working with this agent…"
                  : "Rate the agent first to unlock comments"
              }
              rows={5}
              className={[
                "w-full resize-none rounded-xl border px-4 py-3 text-sm leading-relaxed",
                "bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white",
                "placeholder:text-gray-400 dark:placeholder:text-gray-500",
                "focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent",
                "transition-all duration-150",
                isOverLimit
                  ? "border-red-400 dark:border-red-500"
                  : "border-gray-200 dark:border-gray-700",
                !hasRated || alreadyCommented ? "opacity-60 cursor-not-allowed" : "",
              ].join(" ")}
            />
            <span
              className={[
                "absolute bottom-3 right-3 text-xs font-medium tabular-nums",
                isOverLimit
                  ? "text-red-500"
                  : remaining <= 50
                  ? "text-amber-500"
                  : "text-gray-400 dark:text-gray-500",
              ].join(" ")}
            >
              {remaining}
            </span>
          </div>

          {status === "error" && errMsg && (
            <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {errMsg}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>

            <button
              onClick={submit}
              disabled={!canSubmit}
              className={[
                "flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200",
                "flex items-center justify-center gap-2",
                canSubmit
                  ? "bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98]"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed",
              ].join(" ")}
            >
              {status === "loading" ? (
                <>
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  Sending...
                </>
              ) : (
                <>
                  <MessageSquarePlus className="w-4 h-4" />
                  {existingComment ? "Update Comment" : "Submit Comment"}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
