"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

interface PopoverProps {
  /** Renders the trigger. Gets the open state and a toggle so it can style itself. */
  trigger(props: { open: boolean; toggle(): void }): ReactNode;
  children(close: () => void): ReactNode;
  align?: "start" | "end";
  side?: "top" | "bottom";
  className?: string;
}

/**
 * A glass panel anchored to a trigger. Closes on outside click or Esc. Used
 * for the document menu and the voice picker, which both need the same thing.
 */
export function Popover({ trigger, children, align = "end", side = "bottom", className }: PopoverProps) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <div ref={root} className="relative">
      {trigger({ open, toggle: () => setOpen((value) => !value) })}
      {open && (
        <div
          role="menu"
          className={cn(
            "glass glass-menu glass-enter absolute z-40 min-w-56 rounded-2xl p-1.5",
            align === "end" ? "right-0" : "left-0",
            side === "bottom" ? "top-full mt-2" : "bottom-full mb-2",
            className,
          )}
        >
          {children(close)}
        </div>
      )}
    </div>
  );
}
