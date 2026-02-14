"use client";

import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { BrainDumpInput } from "@/components/brain-dump-input";

export default function DumpPage() {
  const router = useRouter();
  const utils = trpc.useUtils();

  const createDump = trpc.braindump.create.useMutation({
    onSuccess: (data) => {
      utils.braindump.list.invalidate();
      router.push(`/dump/${data.id}`);
    },
  });

  const { data: dumps } = trpc.braindump.list.useQuery({});

  // Ensure user exists
  trpc.user.getOrCreate.useQuery();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Brain Dump</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Get everything out of your head. Don&apos;t worry about structure — just dump.
        </p>
      </div>

      <BrainDumpInput
        onSubmit={(text) => createDump.mutate({ rawText: text })}
        isLoading={createDump.isPending}
      />

      {/* Previous dumps */}
      {dumps && dumps.items.length > 0 && (
        <div>
          <h2 className="mb-4 text-lg font-semibold">Previous Dumps</h2>
          <div className="space-y-2">
            {dumps.items.map((dump) => (
              <button
                key={dump.id}
                onClick={() => router.push(`/dump/${dump.id}`)}
                className="block w-full rounded-lg border border-[var(--border)] p-4 text-left hover:border-[var(--accent)]"
              >
                <div className="flex items-center justify-between">
                  <p className="truncate text-sm">{dump.rawText.slice(0, 100)}...</p>
                  <span className={`ml-2 rounded px-2 py-0.5 text-xs ${
                    dump.status === "organized"
                      ? "bg-[var(--success)]/20 text-[var(--success)]"
                      : dump.status === "error"
                        ? "bg-red-500/20 text-red-500"
                        : "bg-[var(--border)] text-[var(--muted)]"
                  }`}>
                    {dump.status}
                  </span>
                </div>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  {new Date(dump.createdAt).toLocaleString()}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
