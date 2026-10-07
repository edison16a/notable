"use client";

import { useEffect } from "react";
import { requestPersistentStorage } from "@/features/storage/persistence";
import { startTabPersistence } from "@/features/tabs/persist";
import { useTabsStore } from "@/features/tabs/store";
import { useWhisperSettings } from "@/features/whisper/settings";
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
      // allSettled so one store failing to load never stops the rest, or saving, from starting.
      await Promise.allSettled([
        useTabsStore.getState().hydrate(),
        useUiStore.getState().hydrate(),
        useWhisperSettings.getState().hydrate(),
      ]);
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
