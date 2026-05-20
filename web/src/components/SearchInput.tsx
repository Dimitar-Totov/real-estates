"use client";

import { useRef, useState } from "react";
import { Search, X } from "lucide-react";

interface SearchInputProps {
  value?: string;
  onChange?: (v: string) => void;
  onSubmit?: () => void;
}

export default function SearchInput({ value: extVal, onChange: extOnChange, onSubmit }: SearchInputProps = {}) {
  const [internal, setInternal] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const isControlled = extVal !== undefined;
  const value = isControlled ? extVal : internal;

  const setValue = (v: string) => {
    if (isControlled) extOnChange?.(v);
    else setInternal(v);
  };

  const clear = () => {
    setValue("");
    inputRef.current?.focus();
  };

  return (
    <>
      <style>{`
        .si-root {
          position: relative;
          display: flex;
          align-items: center;
          width: 100%;
          border-radius: 0.75rem;
          border: 1.5px solid #e2e8f0;
          background: #ffffff;
          box-shadow: 0 1px 3px rgba(0,0,0,0.04);
          transition: border-color 0.18s ease, box-shadow 0.18s ease;
        }
        .si-root:hover { border-color: #94a3b8; }
        .si-root:focus-within {
          border-color: #0d9488;
          box-shadow: 0 0 0 3px rgba(13,148,136,0.13), 0 1px 3px rgba(0,0,0,0.04);
        }
        .si-root:focus-within .si-icon { color: #0d9488; }
      `}</style>

      <div className="si-root">
        <Search
          className="si-icon absolute left-3.5 w-4 h-4 shrink-0 text-gray-400"
          style={{ transition: "color 0.18s ease" }}
        />

        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSubmit?.()}
          placeholder="Search users…"
          className="w-full bg-transparent py-3 pl-10 pr-10 text-sm text-gray-800 placeholder-gray-400 rounded-xl outline-none"
          style={{ fontFamily: "var(--font-inter), Inter, sans-serif" }}
        />

        <button
          onClick={clear}
          aria-label="Clear search"
          tabIndex={value ? 0 : -1}
          className="absolute right-2.5 flex items-center justify-center w-6 h-6 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100"
          style={{
            opacity: value ? 1 : 0,
            transform: value ? "scale(1)" : "scale(0.65)",
            pointerEvents: value ? "auto" : "none",
            transition: "opacity 0.15s ease, transform 0.15s ease, background-color 0.15s ease, color 0.15s ease",
          }}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </>
  );
}
