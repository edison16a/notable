"use client";

import { useEffect } from "react";

/**
 * Registers the offline service worker in production builds only. In
 * development it would serve stale bundles and fight hot reloading.
 */
export function useServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Offline support is a bonus. The app works the same without it.
    });
  }, []);
}
