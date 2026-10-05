import type { Extensions } from "@tiptap/core";

/**
 * Extensions that other features contribute to the editor, such as the read
 * aloud highlight. Collected here so the editor does not import feature code
 * piecemeal and the list stays easy to scan.
 */
export function editorPlugins(): Extensions {
  return [];
}
