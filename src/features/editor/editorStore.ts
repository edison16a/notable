import { create } from "zustand";
import type { Editor } from "@tiptap/core";

/**
 * Holds the live editor so voice features can insert dictated text, read the
 * doc, and draw highlights without prop drilling through the whole layout.
 */
interface EditorState {
  editor: Editor | null;
  setEditor(editor: Editor | null): void;
}

export const useEditorStore = create<EditorState>((set) => ({
  editor: null,
  setEditor: (editor) => set({ editor }),
}));
