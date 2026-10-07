"use client";

import { useEffect, useRef, useState, type CSSProperties, type MouseEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";

interface PopoverProps {
  /** Renders the trigger. Wire `toggle` to its onClick: the panel is placed next to the clicked element. */
  trigger(props: { open: boolean; toggle(event: MouseEvent<HTMLElement>): void }): ReactNode;
  children(close: () => void): ReactNode;
  align?: "start" | "end";
  side?: "top" | "bottom";
  className?: string;
}

const GAP = 8;

/** Places the panel next to the trigger in viewport coordinates, since it lives in a portal. */
function placement(trigger: DOMRect, align: "start" | "end", side: "top" | "bottom"): CSSProperties {
  return {
    position: "fixed",
    ...(side === "bottom" ? { top: trigger.bottom + GAP } : { bottom: window.innerHeight - trigger.top + GAP }),
    ...(align === "end" ? { right: window.innerWidth - trigger.right } : { left: trigger.left }),
  };
}

/**
 * A glass panel anchored to a trigger. Closes on outside click or Esc. Used
 * for the document menu and the voice picker.
 *
 * The panel renders into document.body. Inside another glass panel (the
 * voice picker sits in the playback bar) Chromium composites a nested
 * backdrop wrongly and the page bleeds through, so the menu must not be a
 * descendant of one.
 */
export function Popover({ trigger, children, align = "end", side = "bottom", className }: PopoverProps) {
  const [style, setStyle] = useState<CSSProperties | null>(null);
  const anchor = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const open = style !== null;

  useEffect(() => {
    if (!open) return;
    const close = () => setStyle(null);
    const onPointer = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!anchor.current?.contains(target) && !panel.current?.contains(target)) close();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  const toggle = (event: MouseEvent<HTMLElement>) => {
    if (open) return setStyle(null);
    setStyle(placement(event.currentTarget.getBoundingClientRect(), align, side));
  };
  const close = () => setStyle(null);

  return (
    <div ref={anchor} className="relative">
      {trigger({ open, toggle })}
      {open &&
        createPortal(
          <div
            ref={panel}
            role="menu"
            style={style}
            className={cn("glass glass-solid glass-enter z-50 min-w-56 rounded-2xl p-1.5 text-fg", className)}
          >
            {children(close)}
          </div>,
          document.body,
        )}
    </div>
  );
}
