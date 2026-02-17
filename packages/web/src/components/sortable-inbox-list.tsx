"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { monitorForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { reorder } from "@atlaskit/pragmatic-drag-and-drop/reorder";
import { extractClosestEdge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge";
import { draggable, dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { attachClosestEdge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge";
import { trpc } from "@/lib/trpc";
import { InboxItemRow } from "./inbox-item";
import type { InboxItem } from "@clarity/types";

interface SortableInboxListProps {
  items: InboxItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onUpdate: () => void;
}

export function SortableInboxList({ items: initialItems, selectedId, onSelect, onUpdate }: SortableInboxListProps) {
  const [items, setItems] = useState(initialItems);
  const containerRef = useRef<HTMLDivElement>(null);

  const reorderMutation = trpc.inbox.reorder.useMutation({
    onError: () => {
      setItems(initialItems);
    },
  });

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  const handleReorder = useCallback(
    (startIndex: number, finishIndex: number) => {
      const reordered = reorder({ list: items, startIndex, finishIndex });
      setItems(reordered);
      reorderMutation.mutate({ itemIds: reordered.map((i) => i.id) });
    },
    [items, reorderMutation],
  );

  useEffect(() => {
    return monitorForElements({
      onDrop({ source, location }) {
        const destination = location.current.dropTargets[0];
        if (!destination) return;

        const sourceId = source.data.itemId as string;
        const destId = destination.data.itemId as string;

        const sourceIndex = items.findIndex((i) => i.id === sourceId);
        const destIndex = items.findIndex((i) => i.id === destId);

        if (sourceIndex < 0 || destIndex < 0 || sourceIndex === destIndex) return;

        const closestEdge = extractClosestEdge(destination.data);
        const finalIndex = closestEdge === "top" ? destIndex : destIndex;

        handleReorder(sourceIndex, finalIndex);
      },
    });
  }, [items, handleReorder]);

  const showDragHandle = items.length > 1;

  return (
    <div ref={containerRef} className="space-y-2">
      {items.map((item) => (
        <DraggableInboxItem
          key={item.id}
          item={item}
          isSelected={selectedId === item.id}
          onSelect={onSelect}
          onUpdate={onUpdate}
          showDragHandle={showDragHandle}
        />
      ))}
    </div>
  );
}

function DraggableInboxItem({
  item,
  isSelected,
  onSelect,
  onUpdate,
  showDragHandle,
}: {
  item: InboxItem;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onUpdate: () => void;
  showDragHandle: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const cleanupDraggable = draggable({
      element: el,
      getInitialData: () => ({ itemId: item.id }),
      dragHandle: el.querySelector("[data-drag-handle]") as HTMLElement | undefined,
    });

    const cleanupDropTarget = dropTargetForElements({
      element: el,
      getData: ({ input, element }) => {
        return attachClosestEdge(
          { itemId: item.id },
          { input, element, allowedEdges: ["top", "bottom"] },
        );
      },
    });

    return () => {
      cleanupDraggable();
      cleanupDropTarget();
    };
  }, [item.id]);

  return (
    <div ref={ref}>
      <InboxItemRow
        item={item}
        onUpdate={onUpdate}
        isSelected={isSelected}
        onSelect={onSelect}
        draggable
        showDragHandle={showDragHandle}
      />
    </div>
  );
}
