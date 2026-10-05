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
    editorProps: {
      attributes: { class: "notable-prose", spellcheck: "true", "aria-label": "Document" },
    },
  });

  useDocAutosave(editor, docId);

  useEffect(() => {
    if (!editor) return;
    setEditor(editor);
    // Put the cursor in the doc on desktop, unless the user is typing somewhere else (like
    // renaming a tab). On phones focusing would pop the keyboard on every tab switch.
    const typingElsewhere = document.activeElement instanceof HTMLInputElement;
    if (!isTouchDevice() && !typingElsewhere) editor.commands.focus("end");
    return () => setEditor(null);
  }, [editor, setEditor]);

  return <EditorContent editor={editor} className="min-h-full" />;
}
