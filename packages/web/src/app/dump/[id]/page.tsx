"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { ClarificationChat } from "@/components/clarification-chat";

export default function DumpDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const utils = trpc.useUtils();

  const { data: dump, isLoading } = trpc.braindump.get.useQuery({ id });

  const processDump = trpc.braindump.process.useMutation({
    onSuccess: () => {
      utils.braindump.get.invalidate({ id });
    },
  });

  const [editingSummary, setEditingSummary] = useState(false);
  const [summaryText, setSummaryText] = useState("");

  const updateDump = trpc.braindump.update.useMutation({
    onSuccess: () => {
      setEditingSummary(false);
      utils.braindump.get.invalidate({ id });
    },
  });

  if (isLoading) return <div className="text-[var(--muted)]">Loading...</div>;
  if (!dump) return <div className="text-red-500">Brain dump not found</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Brain Dump</h1>
        <p className="text-xs text-[var(--muted)]">{new Date(dump.createdAt).toLocaleString()}</p>
      </div>

      {/* Raw dump content */}
      <div className="rounded-lg border border-[var(--border)] p-4">
        <h2 className="mb-2 text-sm font-semibold text-[var(--muted)]">Raw Thoughts</h2>
        <p className="whitespace-pre-wrap text-sm">{dump.rawText}</p>
      </div>

      {/* Process button */}
      {dump.status === "raw" && (
        <button
          onClick={() => processDump.mutate({ id })}
          disabled={processDump.isPending}
          className="w-full rounded-lg bg-[var(--accent)] py-3 text-sm font-medium text-white hover:bg-[var(--accent-hover)] disabled:opacity-50"
        >
          {processDump.isPending ? "Processing with AI..." : "Process with AI"}
        </button>
      )}

      {dump.status === "processing" && (
        <div className="rounded-lg border border-[var(--warning)] bg-[var(--warning)]/10 p-4 text-center text-sm">
          Processing your brain dump...
        </div>
      )}

      {dump.status === "error" && (
        <div className="space-y-2">
          <div className="rounded-lg border border-red-500 bg-red-500/10 p-4 text-center text-sm text-red-500">
            Processing failed. Please try again.
          </div>
          <button
            onClick={() => processDump.mutate({ id })}
            disabled={processDump.isPending}
            className="w-full rounded-lg bg-[var(--accent)] py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)]"
          >
            Retry
          </button>
        </div>
      )}

      {/* Clarification questions */}
      {dump.clarifications.length > 0 && (
        <ClarificationChat
          clarifications={dump.clarifications}
          onComplete={() => utils.braindump.get.invalidate({ id })}
        />
      )}

      {/* AI Summary */}
      {dump.aiSummary && (
        <div className="rounded-lg border border-[var(--border)] p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[var(--muted)]">Organized Summary</h2>
            <button
              onClick={() => { setEditingSummary(true); setSummaryText(dump.aiSummary ?? ""); }}
              className="text-xs text-[var(--accent)] hover:underline"
            >
              Edit
            </button>
          </div>
          {editingSummary ? (
            <div className="mt-2 space-y-2">
              <textarea
                value={summaryText}
                onChange={(e) => setSummaryText(e.target.value)}
                className="w-full rounded border border-[var(--border)] bg-transparent p-2 text-sm"
                rows={6}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => updateDump.mutate({ id, aiSummary: summaryText })}
                  className="rounded bg-[var(--accent)] px-3 py-1 text-xs text-white"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingSummary(false)}
                  className="rounded border border-[var(--border)] px-3 py-1 text-xs"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p className="mt-2 whitespace-pre-wrap text-sm">{dump.aiSummary}</p>
          )}
        </div>
      )}

      {/* Themes */}
      {dump.themes && dump.themes.length > 0 && (
        <div>
          <h2 className="mb-2 text-sm font-semibold text-[var(--muted)]">Themes</h2>
          <div className="flex flex-wrap gap-2">
            {dump.themes.map((theme, i) => (
              <span key={i} className="rounded-full border border-[var(--border)] px-3 py-1 text-xs">
                {theme}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Goals */}
      {dump.goals.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold text-[var(--muted)]">Goals</h2>
          <div className="space-y-3">
            {dump.goals.map((goal) => (
              <button
                key={goal.id}
                onClick={() => router.push(`/goal/${goal.id}`)}
                className="block w-full rounded-lg border border-[var(--border)] p-4 text-left hover:border-[var(--accent)]"
              >
                <h3 className="font-semibold">{goal.title}</h3>
                <p className="mt-1 text-sm text-[var(--muted)]">{goal.purpose}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
