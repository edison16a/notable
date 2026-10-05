"use client";

import { useState } from "react";
import { CloseIcon } from "@/components/icons/interface";
import { isTouchDevice } from "@/lib/platform";

const DISMISSED_KEY = "notable:install-hint-dismissed";

function shouldShow(): boolean {
  if (typeof window === "undefined" || !isTouchDevice()) return false;
  if (window.matchMedia("(display-mode: standalone)").matches) return false;
  try {
    return localStorage.getItem(DISMISSED_KEY) !== "1";
  } catch {
    return false;
  }
}

/**
 * A one-time tip on phones. Browsers are much less likely to clear storage
 * for an installed web app, and local docs have no other copy.
 */
export function InstallHint() {
  const [visible, setVisible] = useState(shouldShow);
  if (!visible) return null;

  return (
    <div className="flex items-start gap-2 rounded-xl border border-line bg-bg p-2.5 text-[11px] leading-snug text-muted">
      <p className="flex-1">Add Notable to your Home Screen so your browser keeps your docs safe.</p>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={() => {
          setVisible(false);
          try {
            localStorage.setItem(DISMISSED_KEY, "1");
          } catch {
            // Private mode can block storage. The tip simply shows again next time.
          }
        }}
        className="rounded-md p-0.5 hover:bg-hover hover:text-fg"
      >
        <CloseIcon size={12} />
      </button>
    </div>
  );
}
