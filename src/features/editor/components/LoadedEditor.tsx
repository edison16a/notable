"use client";

import { useEffect, useMemo } from "react";
import type { JSONContent } from "@tiptap/core";
import { EditorContent, useEditor } from "@tiptap/react";
import { isTouchDevice } from "@/lib/platform";
import { EMPTY_DOC, createExtensions } from "../extensions";
import { useEditorStore } from "../editorStore";
import { useDocAutosave } from "../hooks/useDocAutosave";
import { editorPlugins } from "../plugins";
import "../editor.css";

interface LoadedEditorProps {
  docId: string;
  initialContent: JSONContent | null;
}

export function LoadedEditor({ docId, initialContent }: LoadedEditorProps) {
  const setEditor = useEditorStore((state) => state.setEditor);
  const extensions = useMemo(() => createExtensions(editorPlugins()), []);

  const editor = useEditor({
    extensions,
    content: initialContent ?? EMPTY_DOC,
    immediatelyRender: false,
    // Put the cursor in the doc on desktop. On phones this would pop the keyboard on every tab switch.
    autofocus: isTouchDevice() ? false : "end",
    editorProps: {
      attributes: { class: "notable-prose", spellcheck: "true", "aria-label": "Document" },
    },
  });

  useDocAutosave(editor, docId);

  useEffect(() => {
    if (!editor) return;
    setEditor(editor);
    return () => setEditor(null);
  }, [editor, setEditor]);

  return <EditorContent editor={editor} className="min-h-full" />;
}
