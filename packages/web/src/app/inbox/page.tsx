"use client";

import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { InboxCapture } from "@/components/inbox-capture";
import { SortableInboxList } from "@/components/sortable-inbox-list";
import { useCardSelection } from "@/hooks/use-card-selection";

export default function InboxPage() {
  const { data: user } = trpc.user.getOrCreate.useQuery();
  const utils = trpc.useUtils();

  const userId = user?.id ?? "";
  const { data: items, isLoading } = trpc.inbox.list.useQuery(
    { userId, status: "unprocessed" },
    { enabled: !!userId },
  );

  const softDeleteMut = trpc.inbox.softDelete.useMutation({
    onSuccess: () => handleUpdate(),
  });
  const undoDeleteMut = trpc.inbox.undoDelete.useMutation({
    onSuccess: () => handleUpdate(),
  });

  const { selectedId, select } = useCardSelection({
    onDelete: (id) => {
      softDeleteMut.mutate({ id });
      toast("Item deleted", {
        action: {
          label: "Undo",
          onClick: () => undoDeleteMut.mutate({ id }),
        },
        duration: 5000,
      });
    },
  });

  const handleUpdate = () => {
    utils.inbox.list.invalidate({ userId });
    utils.inbox.count.invalidate({ userId });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Inbox</h1>

      {userId && <InboxCapture userId={userId} onCapture={handleUpdate} />}

      {isLoading && <div className="text-[var(--muted)]">Loading...</div>}

      {items && items.length === 0 && (
        <div className="rounded-lg border border-dashed border-[var(--border)] p-8 text-center">
          <p className="text-[var(--muted)]">All clear! Nothing in your inbox.</p>
          <p className="mt-1 text-xs text-[var(--muted)]">Use the input above to quickly capture thoughts.</p>
        </div>
      )}

      {items && items.length > 0 && (
        <SortableInboxList
          items={items}
          selectedId={selectedId}
          onSelect={select}
          onUpdate={handleUpdate}
        />
      )}
    </div>
  );
}
