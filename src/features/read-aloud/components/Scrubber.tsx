"use client";

import { useRef, useState, type PointerEvent } from "react";
import { formatTime } from "@/lib/format-time";

interface ScrubberProps {
  value: number;
  max: number;
  onSeek(value: number): void;
}

/**
 * The timeline. While dragging it follows the pointer locally and only seeks
 * on release, so dragging across sentences that are not generated yet does
 * not queue up a pile of generation work.
 */
export function Scrubber({ value, max, onSeek }: ScrubberProps) {
  const track = useRef<HTMLDivElement>(null);
  const [dragValue, setDragValue] = useState<number | null>(null);
  const shown = dragValue ?? value;
  const percent = max > 0 ? Math.min(100, (shown / max) * 100) : 0;

  const valueAt = (event: PointerEvent) => {
    const rect = track.current!.getBoundingClientRect();
    return Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)) * max;
  };

  return (
    <div
      ref={track}
      role="slider"
      tabIndex={0}
      aria-label="Playback position"
      aria-valuemin={0}
      aria-valuemax={Math.round(max)}
      aria-valuenow={Math.round(shown)}
      aria-valuetext={formatTime(shown)}
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        setDragValue(valueAt(event));
      }}
      onPointerMove={(event) => dragValue !== null && setDragValue(valueAt(event))}
      onPointerUp={(event) => {
        if (dragValue === null) return;
        onSeek(valueAt(event));
        setDragValue(null);
      }}
      onKeyDown={(event) => {
        if (event.key === "ArrowRight") onSeek(Math.min(max, value + 5));
        if (event.key === "ArrowLeft") onSeek(Math.max(0, value - 5));
      }}
      className="group relative flex h-6 min-w-16 flex-1 cursor-pointer touch-none items-center"
    >
      <div className="h-1 w-full overflow-hidden rounded-full bg-line">
        <div className="h-full rounded-full bg-accent" style={{ width: `${percent}%` }} />
      </div>
      <div
        className="absolute size-3 -translate-x-1/2 rounded-full border-2 border-bg bg-accent shadow transition-transform group-hover:scale-110"
        style={{ left: `${percent}%` }}
      />
    </div>
  );
}
