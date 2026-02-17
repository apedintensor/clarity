"use client";

import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Modal } from "./modal";

interface CalendarTaskEditModalProps {
  taskId: string;
  onClose: () => void;
  onUpdate: () => void;
}

export function CalendarTaskEditModal({ taskId, onClose, onUpdate }: CalendarTaskEditModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledStart, setScheduledStart] = useState("");
  const [scheduledDuration, setScheduledDuration] = useState(30);
  const [estimatedMinutes, setEstimatedMinutes] = useState(30);
  const [status, setStatus] = useState<string>("pending");

  // Fetch task data directly by finding it from goal data
  const { data: user } = trpc.user.getOrCreate.useQuery();
  const { data: goalsData } = trpc.goal.list.useQuery(
    { userId: user?.id ?? "", status: "active" },
    { enabled: !!user?.id },
  );

  // Populate fields from the fetched task
  useEffect(() => {
    if (!goalsData) return;
    for (const goal of goalsData.items) {
      const task = goal.tasks.find((t) => t.id === taskId);
      if (task) {
        setTitle(task.title);
        setDescription(task.description ?? "");
        setScheduledDate(task.scheduledDate ?? "");
        setScheduledStart(task.scheduledStart ?? "");
        setScheduledDuration(task.scheduledDuration ?? 30);
        setEstimatedMinutes(task.estimatedMinutes ?? 30);
        setStatus(task.status ?? "pending");
        return;
      }
    }
  }, [goalsData, taskId]);

  const updateMut = trpc.task.update.useMutation({
    onSuccess: () => onUpdate(),
  });

  const handleSave = () => {
    updateMut.mutate({
      id: taskId,
      title: title || undefined,
      description: description || undefined,
      estimatedMinutes: estimatedMinutes || undefined,
      status: status as "pending" | "in_progress" | "completed" | "skipped",
      scheduledDate: scheduledDate || null,
      scheduledStart: scheduledStart || null,
      scheduledDuration: scheduledDuration || null,
    });
  };

  return (
    <Modal onClose={onClose}>
      <div className="space-y-4">
        <h2 className="text-xl font-bold">Edit Task</h2>

        <div>
          <label className="text-sm text-[var(--muted)]">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="text-sm text-[var(--muted)]">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm"
            rows={3}
          />
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <label className="text-sm text-[var(--muted)]">Date</label>
            <input
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm"
            />
          </div>
          <div className="flex-1">
            <label className="text-sm text-[var(--muted)]">Time</label>
            <input
              type="time"
              value={scheduledStart}
              onChange={(e) => setScheduledStart(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <label className="text-sm text-[var(--muted)]">Scheduled Duration (min)</label>
            <input
              type="number"
              value={scheduledDuration}
              onChange={(e) => setScheduledDuration(parseInt(e.target.value) || 30)}
              min={5}
              max={480}
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm"
            />
          </div>
          <div className="flex-1">
            <label className="text-sm text-[var(--muted)]">Estimated Minutes</label>
            <input
              type="number"
              value={estimatedMinutes}
              onChange={(e) => setEstimatedMinutes(parseInt(e.target.value) || 30)}
              min={5}
              max={480}
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="text-sm text-[var(--muted)]">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm"
          >
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="skipped">Skipped</option>
          </select>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm hover:bg-[var(--accent)]/10"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={updateMut.isPending}
            className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm text-white hover:opacity-90 disabled:opacity-50"
          >
            {updateMut.isPending ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
