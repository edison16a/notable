"use client";

import { useSyncExternalStore } from "react";

/**
 * Tracks a CSS media query. Used where hiding with CSS is not enough, such
 * as rendering the sidebar once (desktop column or phone drawer) instead of
 * twice with one copy hidden.
 */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/** Matches Tailwind's md breakpoint, where the sidebar becomes a column. */
export const DESKTOP_QUERY = "(min-width: 768px)";
