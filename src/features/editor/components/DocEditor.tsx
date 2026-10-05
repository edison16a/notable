"use client";

import { useEffect, useState } from "react";
import type { JSONContent } from "@tiptap/core";
import { loadDoc } from "@/features/storage/repository";
import { LoadedEditor } from "./LoadedEditor";

/**
 * Loads a doc from IndexedDB, then mounts the editor with it. The workspace
 * keys this component by doc id, so every doc gets a fresh editor and its own
 * undo history instead of undo leaking across tabs.
 */
export function DocEditor({ docId }: { docId: string }) {
  const [content, setContent] = useState<JSONContent | null | undefined>(undefined);

  useEffect(() => {
    let alive = true;
    loadDoc(docId).then((loaded) => {
      if (alive) setContent(loaded);
    });
    return () => {
      alive = false;
    };
  }, [docId]);

  if (content === undefined) return <div className="flex-1" aria-busy="true" />;
  return <LoadedEditor docId={docId} initialContent={content} />;
}
