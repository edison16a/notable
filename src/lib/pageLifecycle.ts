/**
 * Runs `callback` when the page is about to go away: a tab switch, a close,
 * a reload, or leaving the site. `visibilitychange` fires first and while the
 * page is still fully alive, which gives an async save the best chance to
 * finish. `pagehide` is kept as the backstop, since some browsers skip the
 * other one. Returns a function that removes both listeners.
 */
export function onPageLeave(callback: () => void): () => void {
  const onVisibility = () => {
    if (document.visibilityState === "hidden") callback();
  };
  document.addEventListener("visibilitychange", onVisibility);
  window.addEventListener("pagehide", callback);
  return () => {
    document.removeEventListener("visibilitychange", onVisibility);
    window.removeEventListener("pagehide", callback);
  };
}
