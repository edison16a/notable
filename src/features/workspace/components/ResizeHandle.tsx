"use client";

import { useRef } from "react";
import { useUiStore } from "../uiStore";

/**
 * Drag the sidebar's right edge to resize it. Pointer capture keeps the drag
 * alive even when the cursor runs ahead of the handle over the editor.
 */
export function ResizeHandle() {
  const setSidebarWidth = useUiStore((state) => state.setSidebarWidth);
  const start = useRef<{ x: number; width: number } | null>(null);

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize sidebar"
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        start.current = { x: event.clientX, width: useUiStore.getState().sidebarWidth };
      }}
      onPointerMove={(event) => {
        if (!start.current) return;
        setSidebarWidth(start.current.width + event.clientX - start.current.x);
      }}
      onPointerUp={() => (start.current = null)}
      onDoubleClick={() => setSidebarWidth(248)}
      className="absolute inset-y-0 -right-1 z-10 w-2 cursor-col-resize after:absolute after:inset-y-0 after:left-1/2 after:w-px after:bg-transparent after:transition-colors hover:after:bg-accent"
    />
  );
}
