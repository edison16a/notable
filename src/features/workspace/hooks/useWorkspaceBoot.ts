"use client";

import { useEffect } from "react";
import { requestPersistentStorage } from "@/features/storage/persistence";
import { startTabPersistence } from "@/features/tabs/persist";
import { useTabsStore } from "@/features/tabs/store";
import { useUiStore } from "../uiStore";

/**
 * Loads saved state once on startup, then starts mirroring tab changes back
 * to IndexedDB. Persistence only begins after hydration so the empty initial
 * store never overwrites the saved tree.
 */
export function useWorkspaceBoot() {
  useEffect(() => {
    let stop: (() => void) | undefined;
    let cancelled = false;

    void (async () => {
      await Promise.all([useTabsStore.getState().hydrate(), useUiStore.getState().hydrate()]);
      if (cancelled) return;
      stop = startTabPersistence();
      void requestPersistentStorage();
    })();

    return () => {
      cancelled = true;
      stop?.();
    };
  }, []);
}
