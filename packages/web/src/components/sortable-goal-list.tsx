"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { monitorForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { reorder } from "@atlaskit/pragmatic-drag-and-drop/reorder";
import { extractClosestEdge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge";
import { draggable, dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { attachClosestEdge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge";
import { trpc } from "@/lib/trpc";
import { GoalCard } from "./goal-card";
import type { GoalWithCounts } from "@clarity/types";

interface SortableGoalListProps {
  goals: GoalWithCounts[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onOpenDetail: (id: string) => void;
  onUpdate: () => void;
}

export function SortableGoalList({ goals, selectedId, onSelect, onOpenDetail, onUpdate }: SortableGoalListProps) {
  const [items, setItems] = useState(goals);
  const containerRef = useRef<HTMLDivElement>(null);

  const reorderMutation = trpc.goal.reorder.useMutation({
    onError: () => {
      setItems(goals);
    },
  });

  useEffect(() => {
    setItems(goals);
  }, [goals]);

  const handleReorder = useCallback(
    (startIndex: number, finishIndex: number) => {
      const reordered = reorder({ list: items, startIndex, finishIndex });
      setItems(reordered);
      reorderMutation.mutate({ goalIds: reordered.map((g) => g.id) });
    },
    [items, reorderMutation],
  );

  useEffect(() => {
    return monitorForElements({
      onDrop({ source, location }) {
        const destination = location.current.dropTargets[0];
        if (!destination) return;

        const sourceId = source.data.goalId as string;
        const destId = destination.data.goalId as string;

        const sourceIndex = items.findIndex((g) => g.id === sourceId);
        const destIndex = items.findIndex((g) => g.id === destId);

        if (sourceIndex < 0 || destIndex < 0 || sourceIndex === destIndex) return;

        const closestEdge = extractClosestEdge(destination.data);
        const finalIndex = closestEdge === "top" ? destIndex : destIndex;

        handleReorder(sourceIndex, finalIndex);
      },
    });
  }, [items, handleReorder]);

  const showDragHandle = items.length > 1;

  return (
    <div ref={containerRef} className="space-y-3">
      {items.map((goal) => (
        <DraggableGoalCard
          key={goal.id}
          goal={goal}
          isSelected={selectedId === goal.id}
          onSelect={onSelect}
          onOpenDetail={onOpenDetail}
          onUpdate={onUpdate}
          showDragHandle={showDragHandle}
        />
      ))}
    </div>
  );
}

function DraggableGoalCard({
  goal,
  isSelected,
  onSelect,
  onOpenDetail,
  onUpdate,
  showDragHandle,
}: {
  goal: GoalWithCounts;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onOpenDetail: (id: string) => void;
  onUpdate: () => void;
  showDragHandle: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const cleanupDraggable = draggable({
      element: el,
      getInitialData: () => ({ goalId: goal.id }),
      dragHandle: el.querySelector("[data-drag-handle]") as HTMLElement | undefined,
    });

    const cleanupDropTarget = dropTargetForElements({
      element: el,
      getData: ({ input, element }) => {
        return attachClosestEdge(
          { goalId: goal.id },
          { input, element, allowedEdges: ["top", "bottom"] },
        );
      },
    });

    return () => {
      cleanupDraggable();
      cleanupDropTarget();
    };
  }, [goal.id]);

  return (
    <div ref={ref}>
      <GoalCard
        goal={goal}
        isSelected={isSelected}
        onSelect={onSelect}
        onOpenDetail={onOpenDetail}
        onUpdate={onUpdate}
        showDragHandle={showDragHandle}
      />
    </div>
  );
}
