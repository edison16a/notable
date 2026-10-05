import { isMacLike } from "@/lib/platform";

/**
 * Shortcut labels that match the user's platform, like "⌘K" on a Mac and
 * "Ctrl+K" elsewhere. Browsers reserve Cmd/Ctrl with T, W, and N, so tab
 * actions use Alt instead.
 */
export function shortcutLabel(key: string): string {
  return isMacLike() ? `⌘${key}` : `Ctrl+${key}`;
}

/** True when the platform's main modifier (Cmd on Mac, Ctrl elsewhere) is held. */
export function hasModifier(event: KeyboardEvent): boolean {
  return isMacLike() ? event.metaKey : event.ctrlKey;
}
