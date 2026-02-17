"use client";

import { useState, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { ProgressBar } from "./progress-bar";
import { ContextMenu } from "./context-menu";
import type { ContextMenuItem } from "./context-menu";
import type { GoalWithCounts } from "@clarity/types";

interface GoalCardProps {
  goal: GoalWithCounts;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onOpenDetail: (id: string) => void;
  onUpdate: () => void;
  showDragHandle?: boolean;
}

export function GoalCard({ goal, isSelected, onSelect, onOpenDetail, onUpdate, showDragHandle }: GoalCardProps) {
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

  const softDeleteMut = trpc.goal.softDelete.useMutation({
    onSuccess: () => onUpdate(),
  });
  const undoDeleteMut = trpc.goal.undoDelete.useMutation({
    onSuccess: () => onUpdate(),
  });
  const permanentDeleteMut = trpc.goal.permanentDelete.useMutation({
    onSuccess: () => onUpdate(),
  });
  const archiveMut = trpc.goal.update.useMutation({
    onSuccess: () => onUpdate(),
  });

  const progress = goal.taskCount > 0
    ? Math.round((goal.completedTaskCount / goal.taskCount) * 100)
    : 0;

  const handleDelete = useCallback(() => {
    softDeleteMut.mutate({ id: goal.id }, {
      onSuccess: (data) => {
        const timeout = setTimeout(() => {
          permanentDeleteMut.mutate({ id: goal.id });
        }, 5000);

        toast("Goal deleted", {
          action: {
            label: "Undo",
            onClick: () => {
              clearTimeout(timeout);
              undoDeleteMut.mutate({
                id: goal.id,
                cascadeDeletedTaskIds: data.cascadeDeletedTaskIds,
              });
            },
          },
          duration: 5000,
        });
      },
    });
  }, [goal.id, softDeleteMut, undoDeleteMut, permanentDeleteMut]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(goal.id);
  };

  const handleDoubleClick = () => {
    onOpenDetail(goal.id);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const contextMenuItems: ContextMenuItem[] = [
    { label: "Open", onClick: () => onOpenDetail(goal.id) },
    { label: "Archive", onClick: () => archiveMut.mutate({ id: goal.id, status: "archived" }) },
    { label: "Delete", onClick: handleDelete, variant: "danger" },
  ];

  return (
    <>
      <div
        data-card-id={goal.id}
        data-goal-id={goal.id}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleContextMenu}
        className={`group relative rounded-lg border p-4 cursor-pointer transition-colors ${
          isSelected
            ? "border-[var(--accent)] bg-[var(--accent)]/5"
            : "border-[var(--border)] hover:border-[var(--accent)]"
        }`}
      >
        <div className="flex items-start gap-3">
          {/* Drag handle */}
          {showDragHandle && (
            <div className="mt-1 cursor-grab text-[var(--muted)] hover:text-[var(--fg)]" data-drag-handle>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="9" cy="6" r="1.5" /><circle cx="15" cy="6" r="1.5" />
                <circle cx="9" cy="12" r="1.5" /><circle cx="15" cy="12" r="1.5" />
                <circle cx="9" cy="18" r="1.5" /><circle cx="15" cy="18" r="1.5" />
              </svg>
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold">{goal.title}</h3>
                <p className="mt-1 text-sm text-[var(--muted)]">{goal.purpose}</p>
              </div>
            </div>
            <div className="mt-3">
              <ProgressBar progress={progress} />
              <p className="mt-1 text-xs text-[var(--muted)]">
                {goal.completedTaskCount}/{goal.taskCount} tasks · {progress}%
              </p>
            </div>
          </div>

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
      </div>

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={contextMenuItems}
          onClose={() => setContextMenu(null)}
        />
      )}
    </>
  );
}
