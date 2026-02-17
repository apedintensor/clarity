"use client";

import { useState, useEffect, useCallback } from "react";

interface UseCardSelectionOptions {
  onDelete?: (id: string) => void;
}

export function useCardSelection(options?: UseCardSelectionOptions) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const select = useCallback((id: string) => {
    setSelectedId(id);
  }, []);

  const deselect = useCallback(() => {
    setSelectedId(null);
  }, []);

  // Deselect on click-outside (any click on document that isn't stopped)
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // If the click is on a card (has data-card-id), selection is handled by the card itself
      if (target.closest("[data-card-id]")) return;
      // Don't deselect when clicking inside a modal/portal overlay
      if (target.closest("[data-modal-overlay]")) return;
      setSelectedId(null);
    };

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Delete key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Delete" && selectedId && options?.onDelete) {
        // Don't trigger if user is typing in an input/textarea
        const tag = (e.target as HTMLElement).tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
        options.onDelete(selectedId);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [selectedId, options]);

  return { selectedId, select, deselect };
}
