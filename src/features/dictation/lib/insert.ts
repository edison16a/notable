import type { Editor } from "@tiptap/core";
import { joinDictation } from "./transcript";

/**
 * Types dictated text at the cursor, the same as if the user had typed it.
 * Reads the character just before the cursor to decide on a leading space.
 */
export function insertAtCursor(editor: Editor, text: string) {
  if (editor.isDestroyed || !text) return;
  const { from, $from } = editor.state.selection;
  const before = $from.parent.isTextblock ? editor.state.doc.textBetween(Math.max($from.start(), from - 1), from) : "";
  // Insert as a text node, never as an HTML string, so a dictated "<" stays a "<".
  editor.chain().insertContent({ type: "text", text: joinDictation(before, text) }).scrollIntoView().run();
}
