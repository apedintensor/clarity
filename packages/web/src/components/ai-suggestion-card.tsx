"use client";

import { useState } from "react";

export interface AISuggestion {
  title: string;
  purpose: string;
  tasks: Array<{
    title: string;
    description?: string;
    estimatedMinutes: number;
  }>;
}

interface AISuggestionCardProps {
  suggestion: AISuggestion;
  accepted?: boolean;
  onAccept: (suggestion: AISuggestion) => void;
  onReject: () => void;
}

export function AISuggestionCard({ suggestion, accepted, onAccept, onReject }: AISuggestionCardProps) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(suggestion.title);
  const [purpose, setPurpose] = useState(suggestion.purpose);
  const [tasks, setTasks] = useState(
    suggestion.tasks.map((t) => ({ ...t })),
  );

  const handleAccept = () => {
    onAccept({ title, purpose, tasks });
  };

  const updateTask = (index: number, field: string, value: string | number) => {
    setTasks((prev) =>
      prev.map((t, i) => (i === index ? { ...t, [field]: value } : t)),
    );
  };

  const removeTask = (index: number) => {
    setTasks((prev) => prev.filter((_, i) => i !== index));
  };

  const addTask = () => {
    setTasks((prev) => [
      ...prev,
      { title: "New task", description: "", estimatedMinutes: 30 },
    ]);
  };

  if (accepted) {
    return (
      <div className="rounded-lg border border-[var(--success)] bg-[var(--success)]/5 p-4 space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-[var(--success)]">Goal Created</span>
        </div>
        <h4 className="font-semibold text-sm">{title}</h4>
        <p className="text-xs text-[var(--muted)]">{purpose}</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-[var(--accent)] bg-[var(--accent)]/5 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-[var(--accent)]">AI Suggested Goal</span>
        <div className="flex gap-2">
          <button
            onClick={() => setEditing(!editing)}
            className="text-xs px-2 py-1 rounded border border-[var(--border)] hover:bg-[var(--accent)]/10"
          >
            {editing ? "Done Editing" : "Modify"}
          </button>
          <button
            onClick={handleAccept}
            className="text-xs px-2 py-1 rounded bg-[var(--accent)] text-white hover:opacity-90"
          >
            Accept
          </button>
          <button
            onClick={onReject}
            className="text-xs px-2 py-1 rounded border border-[var(--border)] text-[var(--muted)] hover:text-red-500 hover:border-red-500"
          >
            Reject
          </button>
        </div>
      </div>

      {editing ? (
        <div className="space-y-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded border border-[var(--border)] bg-transparent px-2 py-1 text-sm font-semibold"
            placeholder="Goal title"
          />
          <input
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            className="w-full rounded border border-[var(--border)] bg-transparent px-2 py-1 text-xs"
            placeholder="Purpose"
          />
        </div>
      ) : (
        <div>
          <h4 className="font-semibold text-sm">{title}</h4>
          <p className="text-xs text-[var(--muted)]">{purpose}</p>
        </div>
      )}

      <div className="space-y-1">
        <p className="text-xs font-medium text-[var(--muted)]">Tasks ({tasks.length})</p>
        {tasks.map((task, i) =>
          editing ? (
            <div key={i} className="flex items-center gap-2 text-xs pl-2">
              <span className="text-[var(--muted)]">{i + 1}.</span>
              <input
                value={task.title}
                onChange={(e) => updateTask(i, "title", e.target.value)}
                className="flex-1 rounded border border-[var(--border)] bg-transparent px-1 py-0.5 text-xs"
              />
              <input
                type="number"
                value={task.estimatedMinutes}
                onChange={(e) =>
                  updateTask(i, "estimatedMinutes", parseInt(e.target.value) || 30)
                }
                min={5}
                max={120}
                className="w-14 rounded border border-[var(--border)] bg-transparent px-1 py-0.5 text-xs text-center"
              />
              <span className="text-[var(--muted)]">min</span>
              <button
                onClick={() => removeTask(i)}
                className="text-[var(--muted)] hover:text-red-500"
                title="Remove task"
              >
                &times;
              </button>
            </div>
          ) : (
            <div key={i} className="flex items-center gap-2 text-xs pl-2">
              <span className="text-[var(--muted)]">{i + 1}.</span>
              <span>{task.title}</span>
              <span className="text-[var(--muted)]">~{task.estimatedMinutes}min</span>
            </div>
          ),
        )}
        {editing && (
          <button
            onClick={addTask}
            className="ml-2 text-xs text-[var(--accent)] hover:underline mt-1"
          >
            + Add task
          </button>
        )}
      </div>
    </div>
  );
}

export function parseSuggestions(text: string): AISuggestion[] {
  const match = text.match(/---SUGGESTIONS---\s*([\s\S]*?)\s*---END_SUGGESTIONS---/);
  if (!match?.[1]) return [];

  try {
    const parsed = JSON.parse(match[1]) as AISuggestion[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function removeSuggestionBlock(text: string): string {
  return text.replace(/---SUGGESTIONS---[\s\S]*?---END_SUGGESTIONS---/, "").trim();
}
