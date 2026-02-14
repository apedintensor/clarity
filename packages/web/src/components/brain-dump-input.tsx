"use client";

import { useState } from "react";

interface BrainDumpInputProps {
  onSubmit: (text: string) => void;
  isLoading: boolean;
}

export function BrainDumpInput({ onSubmit, isLoading }: BrainDumpInputProps) {
  const [text, setText] = useState("");

  const handleSubmit = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    setText("");
  };

  return (
    <div className="space-y-3">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Dump everything on your mind here... goals, worries, ideas, half-formed plans. Don't filter, just write."
        className="w-full rounded-lg border border-[var(--border)] bg-transparent p-4 text-base placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none"
        rows={8}
        disabled={isLoading}
      />
      <div className="flex items-center justify-between">
        <p className="text-xs text-[var(--muted)]">
          {text.length > 0 ? `${text.split(/\s+/).filter(Boolean).length} words` : "Start typing to begin your brain dump"}
        </p>
        <button
          onClick={handleSubmit}
          disabled={!text.trim() || isLoading}
          className="rounded-lg bg-[var(--accent)] px-6 py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)] disabled:opacity-50"
        >
          {isLoading ? "Capturing..." : "Capture"}
        </button>
      </div>
    </div>
  );
}
