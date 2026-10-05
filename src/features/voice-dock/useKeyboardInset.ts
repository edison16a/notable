"use client";

import { useEffect, useState } from "react";

/**
 * Height of the on-screen keyboard, in pixels. Mobile browsers shrink the
 * visual viewport when the keyboard opens but leave the layout viewport
 * alone, so the difference tells us how far to lift the voice buttons to
 * keep them floating just above the keys.
 */
export function useKeyboardInset(): number {
  const [inset, setInset] = useState(0);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    const update = () => setInset(Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop));
    update();
    viewport.addEventListener("resize", update);
    viewport.addEventListener("scroll", update);
    return () => {
      viewport.removeEventListener("resize", update);
      viewport.removeEventListener("scroll", update);
    };
  }, []);

  return inset;
}
