import type { JSONContent } from "@tiptap/core";

export const UNTITLED = "Untitled";
const MAX_TITLE_LENGTH = 80;

function textOf(node: JSONContent): string {
  if (node.type === "text") return node.text ?? "";
  return (node.content ?? []).map(textOf).join("");
}

/**
 * The tab title comes from the doc's first non-empty block, usually its
 * heading. We walk the JSON rather than the live editor so it also works for
 * docs that are not open.
 */
export function deriveTitle(doc: JSONContent | null | undefined): string {
  for (const block of doc?.content ?? []) {
    const text = textOf(block).replace(/\s+/g, " ").trim();
    if (text) return text.length > MAX_TITLE_LENGTH ? `${text.slice(0, MAX_TITLE_LENGTH - 1)}…` : text;
  }
  return "";
}

/** What the sidebar shows: the stored title, or a placeholder for blank docs. */
export function displayTitle(title: string): string {
  return title.trim() || UNTITLED;
}
