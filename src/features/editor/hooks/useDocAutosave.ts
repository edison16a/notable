"use client";

import { useEffect, useMemo } from "react";
import type { Editor, JSONContent } from "@tiptap/core";
import { debounce } from "@/lib/debounce";
import { onPageLeave } from "@/lib/pageLifecycle";
import { saveDoc } from "@/features/storage/repository";
import { deriveTitle } from "@/features/tabs/lib/title";
import { useTabsStore } from "@/features/tabs/store";

const SAVE_DELAY_MS = 500;

/**
 * Saves the doc about half a second after the last edit and keeps the tab
 * title in sync with the first line. Pending saves are flushed when the doc
 * closes or the page hides, so switching tabs mid-sentence never loses text.
 */
export function useDocAutosave(editor: Editor | null, docId: string) {
  const setDerivedTitle = useTabsStore((state) => state.setDerivedTitle);

  const save = useMemo(
    () =>
      debounce((json: JSONContent) => {
        void saveDoc(docId, json);
        setDerivedTitle(docId, deriveTitle(json));
      }, SAVE_DELAY_MS),
    [docId, setDerivedTitle],
  );

  useEffect(() => {
    if (!editor) return;
    // Snapshot on every update so a flush still has the latest text even if
    // the editor is destroyed before our cleanup runs.
    const onUpdate = () => save(editor.getJSON());
    editor.on("update", onUpdate);
    const stopWatching = onPageLeave(() => save.flush());
    return () => {
      save.flush();
      editor.off("update", onUpdate);
      stopWatching();
    };
  }, [editor, save]);
}
