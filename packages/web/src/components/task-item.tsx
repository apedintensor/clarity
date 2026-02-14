"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import type { Task } from "@clarity/types";

interface TaskItemProps {
  task: Task;
  onUpdate: () => void;
}

export function TaskItem({ task, onUpdate }: TaskItemProps) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [doneDefinition, setDoneDefinition] = useState(task.doneDefinition);

  const updateTask = trpc.task.update.useMutation({ onSuccess: () => { setEditing(false); onUpdate(); } });
  const completeTask = trpc.task.complete.useMutation({ onSuccess: onUpdate });

  const statusColors: Record<string, string> = {
    pending: "border-[var(--border)]",
    in_progress: "border-[var(--accent)]",
    completed: "border-[var(--success)]",
    skipped: "border-[var(--muted)]",
  };

  return (
    <div className={`rounded-lg border p-3 ${statusColors[task.status] ?? "border-[var(--border)]"}`}>
      <div className="flex items-start gap-3">
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
          {task.status === "completed" && "&#10003;"}
        </button>

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

        {task.status !== "completed" && !editing && (
          <button onClick={() => setEditing(true)} className="text-xs text-[var(--muted)] hover:text-[var(--fg)]">
            Edit
          </button>
        )}
      </div>
    </div>
  );
}
