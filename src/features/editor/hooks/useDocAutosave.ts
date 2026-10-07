"use client";

import { useEffect, useMemo } from "react";
import type { Editor, JSONContent } from "@tiptap/core";
import { debounce } from "@/lib/debounce";
import { onPageLeave } from "@/lib/pageLifecycle";
import { saveDoc } from "@/features/storage/repository";
import { clearUnsaved, writeUnsaved } from "@/features/storage/unsaved";
import { deriveTitle } from "@/features/tabs/lib/title";
import { useTabsStore } from "@/features/tabs/store";

const SAVE_DELAY_MS = 500;

/**
 * Saves the doc about half a second after the last edit and keeps the tab
 * title in sync with the first line. Pending saves are flushed when the doc
 * closes, so switching tabs mid-sentence never loses text. When the whole page
 * is going away the async write may not finish, so the pending text is also
 * parked in localStorage and restored on the next load.
 */
export function useDocAutosave(editor: Editor | null, docId: string) {
  const setDerivedTitle = useTabsStore((state) => state.setDerivedTitle);
  // The debounced writer and the text still waiting for it live together, so they are always reset as a pair.
  const saver = useMemo(() => {
    /** Text typed since the last write started. Null when nothing is waiting. */
    const pending: { json: JSONContent | null } = { json: null };
    const save = debounce((json: JSONContent) => {
      pending.json = null;
      // A deleted tab's doc must not be written back by the editor's last flush.
      if (!useTabsStore.getState().tabs.some((tab) => tab.id === docId)) return;
      saveDoc(docId, json)
        .then(() => clearUnsaved(docId))
        .catch((error) => console.warn("Could not save the doc", error));
      setDerivedTitle(docId, deriveTitle(json));
    }, SAVE_DELAY_MS);
    return { pending, save };
  }, [docId, setDerivedTitle]);

  useEffect(() => {
    if (!editor) return;
    // Snapshot on every update so a flush still has the latest text even if
    // the editor is destroyed before our cleanup runs.
    const { pending, save } = saver;
    const onUpdate = () => {
      pending.json = editor.getJSON();
      save(pending.json);
    };
    editor.on("update", onUpdate);
    const stopWatching = onPageLeave(() => {
      if (pending.json) writeUnsaved(docId, pending.json);
      save.flush();
    });
    return () => {
      save.flush();
      editor.off("update", onUpdate);
      stopWatching();
    };
  }, [editor, saver, docId]);
}
