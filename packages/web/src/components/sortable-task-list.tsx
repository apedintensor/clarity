"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { monitorForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { reorder } from "@atlaskit/pragmatic-drag-and-drop/reorder";
import { extractClosestEdge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge";
import type { Task } from "@clarity/types";
import { trpc } from "@/lib/trpc";
import { TaskItem } from "./task-item";

interface SortableTaskListProps {
  tasks: Task[];
  goalId: string;
  onUpdate: () => void;
}

export function SortableTaskList({ tasks, goalId, onUpdate }: SortableTaskListProps) {
  const [items, setItems] = useState(tasks);
  const containerRef = useRef<HTMLDivElement>(null);

  const reorderMutation = trpc.task.reorder.useMutation({
    onError: () => {
      // Rollback on error
      setItems(tasks);
    },
  });

  // Sync with parent when tasks change
  useEffect(() => {
    setItems(tasks);
  }, [tasks]);

  const handleReorder = useCallback(
    (startIndex: number, finishIndex: number) => {
      const reordered = reorder({ list: items, startIndex, finishIndex });
      setItems(reordered);

      // Persist new order
      reorderMutation.mutate({
        goalId,
        taskIds: reordered.map((t) => t.id),
      });
    },
    [items, goalId, reorderMutation],
  );

  useEffect(() => {
    return monitorForElements({
      onDrop({ source, location }) {
        const destination = location.current.dropTargets[0];
        if (!destination) return;

        const sourceId = source.data.taskId as string;
        const destId = destination.data.taskId as string;

        const sourceIndex = items.findIndex((t) => t.id === sourceId);
        const destIndex = items.findIndex((t) => t.id === destId);

        if (sourceIndex < 0 || destIndex < 0 || sourceIndex === destIndex) return;

        const closestEdge = extractClosestEdge(destination.data);
        const finalIndex = closestEdge === "top" ? destIndex : destIndex;

        handleReorder(sourceIndex, finalIndex);
      },
    });
  }, [items, handleReorder]);

  return (
    <div ref={containerRef} className="space-y-2">
      {items.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          onUpdate={onUpdate}
          draggable
        />
      ))}
    </div>
  );
}
