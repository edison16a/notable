import type { JSONContent } from "@tiptap/core";

/*
 * A last-second backup for text typed just before the page goes away. An
 * IndexedDB write started while the page is unloading is not guaranteed to
 * finish, but localStorage is synchronous, so the text is parked there and
 * put back the next time the doc opens. Every call tolerates storage being
 * blocked, since the backup is only a safety net.
 */

const key = (docId: string) => `notable:unsaved:${docId}`;

export function writeUnsaved(docId: string, content: JSONContent): void {
  try {
    localStorage.setItem(key(docId), JSON.stringify(content));
  } catch {
    // Quota or private mode. The normal save still runs.
  }
}

export function readUnsaved(docId: string): JSONContent | null {
  try {
    const raw = localStorage.getItem(key(docId));
    return raw ? (JSON.parse(raw) as JSONContent) : null;
  } catch {
    return null;
  }
}

export function clearUnsaved(docId: string): void {
  try {
    localStorage.removeItem(key(docId));
  } catch {
    // Nothing to clear if storage is unavailable.
  }
}
