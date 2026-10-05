/**
 * Small feature checks used to pick a compute backend and adjust behavior on
 * phones. All of them are safe to call during render on the client only.
 */

export function isMacLike(): boolean {
  return typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
}

/** A coarse pointer is a better signal for "phone or tablet" than screen width. */
export function isTouchDevice(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;
}

/** Network Information is Chromium only. Elsewhere we assume Wi-Fi rather than nag. */
export function isOnCellular(): boolean {
  const connection = (navigator as Navigator & { connection?: { type?: string } }).connection;
  return connection?.type === "cellular";
}

export function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
