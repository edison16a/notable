"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(pointer: coarse)";

/**
 * True when the main input is a finger, which is how we tell phones and
 * tablets from computers. A touch laptop still reports a fine pointer as its
 * primary input, so it is not caught.
 *
 * Returns null until the browser has answered, so callers can render nothing
 * for that first moment instead of flashing the wrong screen.
 */
export function useCoarsePointer(): boolean | null {
  return useSyncExternalStore(
    (onChange) => {
      const list = window.matchMedia(QUERY);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    () => window.matchMedia(QUERY).matches,
    () => null,
  );
}
