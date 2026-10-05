"use client";

import { setReadingRate } from "../controller";
import { useReadAloudStore } from "../store";
import { SPEEDS } from "../voices";

/** Tapping steps through the speeds and wraps back to 0.75x after 2x. One control instead of a menu. */
export function SpeedButton() {
  const rate = useReadAloudStore((state) => state.rate);
  const next = SPEEDS[(SPEEDS.indexOf(rate) + 1) % SPEEDS.length] ?? 1;

  return (
    <button
      type="button"
      onClick={() => setReadingRate(next)}
      aria-label={`Speed ${rate}x, change to ${next}x`}
      title="Playback speed"
      className="h-8 min-w-12 rounded-full bg-hover px-2.5 text-xs font-medium tabular-nums hover:bg-line"
    >
      {rate.toFixed(rate % 0.5 === 0 ? 1 : 2)}x
    </button>
  );
}
