"use client";

import { useState, useRef, useEffect } from "react";
import { draggable, dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { attachClosestEdge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import type { Task } from "@clarity/types";

interface TaskItemProps {
  task: Task;
  onUpdate: () => void;
  draggable?: boolean;
}

export function TaskItem({ task, onUpdate, draggable: isDraggable }: TaskItemProps) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [doneDefinition, setDoneDefinition] = useState(task.doneDefinition);
  const [isDragging, setIsDragging] = useState(false);
  const [isOver, setIsOver] = useState(false);

  const dragRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLButtonElement>(null);

  const updateTask = trpc.task.update.useMutation({ onSuccess: () => { setEditing(false); onUpdate(); } });
  const completeTask = trpc.task.complete.useMutation({ onSuccess: onUpdate });
  const softDelete = trpc.task.softDelete.useMutation({
    onSuccess: (result) => {
      onUpdate();
      toast("Task deleted", {
        description: result.hadSubtasks ? `${result.subtaskCount} dependent task(s) also removed` : undefined,
        action: {
          label: "Undo",
          onClick: () => {
            undoDelete.mutate({ taskId: result.id });
          },
        },
        duration: 5000,
      });
    },
  });
  const undoDelete = trpc.task.undoDelete.useMutation({ onSuccess: onUpdate });

  // Setup drag source and drop target
  useEffect(() => {
    const el = dragRef.current;
    if (!el || !isDraggable) return;

    const cleanupDrag = draggable({
      element: el,
      dragHandle: handleRef.current ?? el,
      getInitialData: () => ({ taskId: task.id }),
      onDragStart: () => setIsDragging(true),
      onDrop: () => setIsDragging(false),
    });

    const cleanupDrop = dropTargetForElements({
      element: el,
      getData: ({ input, element }) => {
        return attachClosestEdge({ taskId: task.id }, { input, element, allowedEdges: ["top", "bottom"] });
      },
      onDragEnter: () => setIsOver(true),
      onDragLeave: () => setIsOver(false),
      onDrop: () => setIsOver(false),
    });

    return () => {
      cleanupDrag();
      cleanupDrop();
    };
  }, [isDraggable, task.id]);

  const statusColors: Record<string, string> = {
    pending: "border-[var(--border)]",
    in_progress: "border-[var(--accent)]",
    completed: "border-[var(--success)]",
    skipped: "border-[var(--muted)]",
  };

  const handleDelete = () => {
    softDelete.mutate({ taskId: task.id });
  };

  return (
    <div
      ref={dragRef}
      className={`rounded-lg border p-3 transition-all ${statusColors[task.status] ?? "border-[var(--border)]"} ${
        isDragging ? "opacity-50" : ""
      } ${isOver ? "ring-2 ring-[var(--accent)]" : ""}`}
    >
      <div className="flex items-start gap-3">
        {/* Drag handle */}
        {isDraggable && (
          <button
            ref={handleRef}
            className="mt-0.5 flex-shrink-0 cursor-grab text-[var(--muted)] hover:text-[var(--fg)] active:cursor-grabbing"
            title="Drag to reorder"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <circle cx="5" cy="3" r="1.5" />
              <circle cx="11" cy="3" r="1.5" />
              <circle cx="5" cy="8" r="1.5" />
              <circle cx="11" cy="8" r="1.5" />
              <circle cx="5" cy="13" r="1.5" />
              <circle cx="11" cy="13" r="1.5" />
            </svg>
          </button>
        )}

        {/* Checkbox */}
        <button
          onClick={() => {
            if (task.status === "pending" || task.status === "in_progress") {
              completeTask.mutate({ id: task.id });
            }
          }}
          disabled={task.status === "completed" || task.status === "skipped"}
          className={`mt-0.5 h-5 w-5 flex-shrink-0 rounded border ${
            task.status === "completed"
              ? "border-[var(--success)] bg-[var(--success)] text-white"
              : "border-[var(--border)] hover:border-[var(--accent)]"
          } flex items-center justify-center text-xs`}
        >
          {task.status === "completed" && "\u2713"}
        </button>

        {/* Content */}
        <div className="flex-1">
          {editing ? (
            <div className="space-y-2">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded border border-[var(--border)] bg-transparent px-2 py-1 text-sm"
              />
              <input
                value={doneDefinition}
                onChange={(e) => setDoneDefinition(e.target.value)}
                className="w-full rounded border border-[var(--border)] bg-transparent px-2 py-1 text-xs"
                placeholder="Done when..."
              />
              <div className="flex gap-2">
                <button
                  onClick={() => updateTask.mutate({ id: task.id, title, doneDefinition })}
                  className="rounded bg-[var(--accent)] px-2 py-1 text-xs text-white"
                >
                  Save
                </button>
                <button onClick={() => setEditing(false)} className="text-xs text-[var(--muted)]">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className={`text-sm ${task.status === "completed" ? "line-through text-[var(--muted)]" : ""}`}>
                {task.title}
              </p>
              <p className="text-xs text-[var(--muted)]">
                Done when: {task.doneDefinition} · ~{task.estimatedMinutes}min
              </p>
            </>
          )}
        </div>

        {/* Action buttons */}
        {task.status !== "completed" && !editing && (
          <div className="flex items-center gap-2">
            <button onClick={() => setEditing(true)} className="text-xs text-[var(--muted)] hover:text-[var(--fg)]">
              Edit
            </button>
            <button
              onClick={handleDelete}
              disabled={softDelete.isPending}
              className="text-xs text-[var(--muted)] hover:text-red-500"
              title="Delete task"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
