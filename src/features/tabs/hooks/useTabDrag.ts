"use client";

import { useState, type DragEvent } from "react";
import type { DropPosition } from "../lib/tree";
import { useTabsStore } from "../store";

export interface DropTarget {
  id: string;
  position: DropPosition;
}

/**
 * Splits a row into three bands: the top quarter drops above it, the bottom
 * quarter drops below it, and the middle nests inside it. That matches what
 * people expect from file trees and needs no extra drop zones in the DOM.
 */
function positionFor(event: DragEvent<HTMLElement>): DropPosition {
  const rect = event.currentTarget.getBoundingClientRect();
  const ratio = (event.clientY - rect.top) / rect.height;
  if (ratio < 0.25) return "before";
  if (ratio > 0.75) return "after";
  return "inside";
}

export function useTabDrag() {
  const moveTab = useTabsStore((state) => state.moveTab);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [target, setTarget] = useState<DropTarget | null>(null);

  const reset = () => {
    setDraggingId(null);
    setTarget(null);
  };

  const rowHandlers = (id: string) => ({
    draggable: true,
    onDragStart(event: DragEvent<HTMLElement>) {
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", id);
      setDraggingId(id);
    },
    onDragOver(event: DragEvent<HTMLElement>) {
      if (!draggingId || draggingId === id) return;
      event.preventDefault();
      const position = positionFor(event);
      if (target?.id !== id || target.position !== position) setTarget({ id, position });
    },
    onDragLeave(event: DragEvent<HTMLElement>) {
      if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setTarget(null);
    },
    onDrop(event: DragEvent<HTMLElement>) {
      event.preventDefault();
      if (draggingId && draggingId !== id) moveTab(draggingId, id, positionFor(event));
      reset();
    },
    onDragEnd: reset,
  });

  return { draggingId, target, rowHandlers };
}
