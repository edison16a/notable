import type { JSONContent } from "@tiptap/core";
import { useEditorStore } from "@/features/editor/editorStore";
import { loadAllDocs } from "@/features/storage/repository";
import { displayTitle } from "@/features/tabs/lib/title";
import { useTabsStore } from "@/features/tabs/store";
import { downloadBlob, safeFileName } from "./lib/files";
import { docToMarkdown } from "./lib/markdown";
import { printAsPdf } from "./lib/print";
import { buildZip, zipEntries } from "./lib/zip";

export type ExportFormat = "markdown" | "word" | "pdf";

function activeDoc(): { title: string; json: JSONContent; html: string } | null {
  const editor = useEditorStore.getState().editor;
  const { tabs, activeId } = useTabsStore.getState();
  if (!editor) return null;
  const title = displayTitle(tabs.find((tab) => tab.id === activeId)?.title ?? "");
  return { title, json: editor.getJSON(), html: editor.getHTML() };
}

/** Exports the open doc. Reads the live editor so the very last keystroke is included. */
export async function exportActiveDoc(format: ExportFormat) {
  const doc = activeDoc();
  if (!doc) return;
  const name = safeFileName(doc.title);

  if (format === "markdown") {
    downloadBlob(new Blob([docToMarkdown(doc.json)], { type: "text/markdown" }), `${name}.md`);
  } else if (format === "word") {
    // The docx library is large, so it only loads when someone actually exports to Word.
    const { docToDocx } = await import("./lib/docx");
    downloadBlob(await docToDocx(doc.json), `${name}.docx`);
  } else {
    printAsPdf(doc.title, doc.html);
  }
}

/**
 * Downloads every doc as a zip of Markdown files. Local-only docs vanish if
 * the browser's data is cleared, so this is the user's backup.
 */
export async function exportAllDocs() {
  const { tabs, activeId } = useTabsStore.getState();
  const docs = await loadAllDocs();
  const editor = useEditorStore.getState().editor;
  // The open doc may have an unsaved edit still inside the autosave delay.
  if (editor && activeId) docs.set(activeId, editor.getJSON());
  const date = new Date().toISOString().slice(0, 10);
  downloadBlob(buildZip(zipEntries(tabs, docs)), `Notable ${date}.zip`);
}
