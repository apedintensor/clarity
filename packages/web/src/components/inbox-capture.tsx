"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";

interface InboxCaptureProps {
  userId: string;
  onCapture?: () => void;
}

export function InboxCapture({ userId, onCapture }: InboxCaptureProps) {
  const [title, setTitle] = useState("");
  const utils = trpc.useUtils();

  const createItem = trpc.inbox.create.useMutation({
    onSuccess: () => {
      setTitle("");
      utils.inbox.count.invalidate({ userId });
      utils.inbox.list.invalidate({ userId });
      onCapture?.();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    createItem.mutate({ userId, title: trimmed });
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Quick capture — type and press Enter"
        className="flex-1 rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none"
        autoFocus
      />
      <button
        type="submit"
        disabled={!title.trim() || createItem.isPending}
        className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)] disabled:opacity-50"
      >
        Add
      </button>
    </form>
  );
}
