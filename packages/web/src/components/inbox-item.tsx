"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { ContextMenu } from "./context-menu";
import type { ContextMenuItem } from "./context-menu";
import { InboxChatModal } from "./inbox-chat-modal";
import type { InboxItem } from "@clarity/types";

interface InboxItemRowProps {
  item: InboxItem;
  onUpdate: () => void;
  isSelected: boolean;
  onSelect: (id: string) => void;
  draggable?: boolean;
  showDragHandle?: boolean;
}

export function InboxItemRow({ item, onUpdate, isSelected, onSelect, draggable, showDragHandle }: InboxItemRowProps) {
  const router = useRouter();
  const [showGoalPicker, setShowGoalPicker] = useState<"assign" | "task" | "subtask" | null>(null);
  const [showTaskPicker, setShowTaskPicker] = useState<string | null>(null); // goalId for task picker
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const { data: user } = trpc.user.getOrCreate.useQuery();
  const { data: goalsData } = trpc.goal.list.useQuery(
    { userId: user?.id ?? "", status: "active" },
    { enabled: !!showGoalPicker && !!user?.id },
  );

  const assignToGoal = trpc.inbox.assignToGoal.useMutation({
    onSuccess: () => {
      setShowGoalPicker(null);
      onUpdate();
    },
  });

  const processItem = trpc.inbox.process.useMutation({
    onSuccess: (data) => {
      onUpdate();
      router.push(`/dump/${data.brainDumpId}`);
    },
  });

  const convertToGoal = trpc.inbox.convertToGoal.useMutation({
    onSuccess: () => {
      toast("Converted to goal");
      onUpdate();
    },
  });

  const convertToTask = trpc.inbox.convertToTask.useMutation({
    onSuccess: () => {
      setShowGoalPicker(null);
      toast("Converted to task");
      onUpdate();
    },
  });

  const convertToSubtask = trpc.inbox.convertToSubtask.useMutation({
    onSuccess: () => {
      setShowGoalPicker(null);
      setShowTaskPicker(null);
      toast("Converted to subtask");
      onUpdate();
    },
  });

  const softDeleteMut = trpc.inbox.softDelete.useMutation({
    onSuccess: () => onUpdate(),
  });

  const undoDeleteMut = trpc.inbox.undoDelete.useMutation({
    onSuccess: () => onUpdate(),
  });

  const handleDelete = useCallback(() => {
    softDeleteMut.mutate({ id: item.id });
    const timeout = setTimeout(() => {
      // Permanent delete not needed for inbox items — soft delete is sufficient
    }, 5000);
    toast("Item deleted", {
      action: {
        label: "Undo",
        onClick: () => {
          clearTimeout(timeout);
          undoDeleteMut.mutate({ id: item.id });
        },
      },
      duration: 5000,
    });
  }, [item.id, softDeleteMut, undoDeleteMut]);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(item.id);
  };

  const handleDoubleClick = () => {
    setShowDetailModal(true);
  };

  const handleGoalPickerChange = (goalId: string) => {
    if (!goalId) return;
    if (showGoalPicker === "assign") {
      assignToGoal.mutate({ inboxItemId: item.id, goalId });
    } else if (showGoalPicker === "task") {
      convertToTask.mutate({ inboxItemId: item.id, goalId });
    } else if (showGoalPicker === "subtask") {
      // Need to pick a task next
      setShowTaskPicker(goalId);
    }
  };

  const contextMenuItems: ContextMenuItem[] = [
    { label: "Process", onClick: () => processItem.mutate({ inboxItemId: item.id }) },
    { label: "Assign to Goal", onClick: () => setShowGoalPicker("assign") },
    { label: "Convert to Goal", onClick: () => convertToGoal.mutate({ inboxItemId: item.id }) },
    { label: "Convert to Task", onClick: () => setShowGoalPicker("task") },
    { label: "Convert to Subtask", onClick: () => setShowGoalPicker("subtask") },
    { label: "Delete", onClick: handleDelete, variant: "danger" },
  ];

  // Find tasks for task picker
  const selectedGoalForSubtask = goalsData?.items.find((g) => g.id === showTaskPicker);

  return (
    <>
      <div
        ref={cardRef}
        data-card-id={item.id}
        data-item-id={item.id}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleContextMenu}
        className={`group relative flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
          isSelected
            ? "border-[var(--accent)] bg-[var(--accent)]/5"
            : "border-[var(--border)] hover:border-[var(--accent)]"
        }`}
      >
        {/* Drag handle */}
        {draggable && showDragHandle && (
          <div className="cursor-grab text-[var(--muted)] hover:text-[var(--fg)]" data-drag-handle>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="9" cy="6" r="1.5" /><circle cx="15" cy="6" r="1.5" />
              <circle cx="9" cy="12" r="1.5" /><circle cx="15" cy="12" r="1.5" />
              <circle cx="9" cy="18" r="1.5" /><circle cx="15" cy="18" r="1.5" />
            </svg>
          </div>
        )}

        <div className="flex-1 min-w-0">
          <p className="text-sm truncate">{item.title}</p>
          {item.description && <p className="text-xs text-[var(--muted)] truncate">{item.description}</p>}
          <p className="text-xs text-[var(--muted)]">
            {new Date(item.createdAt).toLocaleDateString()}
          </p>
        </div>

        {/* Goal picker inline */}
        {showGoalPicker && !showTaskPicker && (
          <select
            onChange={(e) => handleGoalPickerChange(e.target.value)}
            className="rounded border border-[var(--border)] bg-transparent px-2 py-1 text-xs"
            defaultValue=""
            autoFocus
            onBlur={() => setShowGoalPicker(null)}
          >
            <option value="" disabled>Select goal...</option>
            {goalsData?.items.map((g) => (
              <option key={g.id} value={g.id}>{g.title}</option>
            ))}
            {goalsData?.items.length === 0 && (
              <option value="" disabled>No goals — create one first</option>
            )}
          </select>
        )}

        {/* Task picker for subtask conversion */}
        {showTaskPicker && selectedGoalForSubtask && (
          <select
            onChange={(e) => {
              if (e.target.value) {
                convertToSubtask.mutate({ inboxItemId: item.id, taskId: e.target.value });
              }
            }}
            className="rounded border border-[var(--border)] bg-transparent px-2 py-1 text-xs"
            defaultValue=""
            autoFocus
            onBlur={() => { setShowTaskPicker(null); setShowGoalPicker(null); }}
          >
            <option value="" disabled>Select parent task...</option>
            {selectedGoalForSubtask.tasks
              .filter((t) => !t.deletedAt)
              .map((t) => (
                <option key={t.id} value={t.id}>{t.title}</option>
              ))}
          </select>
        )}

        {/* X button */}
        <button
          onClick={(e) => { e.stopPropagation(); handleDelete(); }}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-[var(--muted)] hover:text-red-500"
          title="Delete"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={contextMenuItems}
          onClose={() => setContextMenu(null)}
        />
      )}

      {showDetailModal && (
        <InboxChatModal item={item} onClose={() => setShowDetailModal(false)} onUpdate={onUpdate} />
      )}
    </>
  );
}
