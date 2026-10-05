import type { JSONContent } from "@tiptap/core";
import { strToU8, zipSync } from "fflate";
import { ancestorIds, visibleRows, type Tab } from "@/features/tabs/lib/tree";
import { displayTitle } from "@/features/tabs/lib/title";
import { safeFileName } from "./files";
import { docToMarkdown } from "./markdown";

export interface ZipEntry {
  path: string;
  content: string;
}

/**
 * One Markdown file per doc, laid out like the sidebar: a tab's subtabs go
 * in a folder named after it. Two docs with the same name in one folder get
 * " (2)", " (3)" and so on, so nothing overwrites anything.
 */
export function zipEntries(tabs: Tab[], docs: Map<string, JSONContent | null>): ZipEntry[] {
  const names = new Map(tabs.map((tab) => [tab.id, safeFileName(displayTitle(tab.title))]));
  const used = new Set<string>();
  // Walk the full tree in sidebar order, including folded branches.
  const ordered = visibleRows(tabs.map((tab) => ({ ...tab, folded: false })));

  return ordered.map(({ tab }) => {
    const folder = ancestorIds(tabs, tab.id).map((id) => names.get(id)).join("/");
    const base = folder ? `${folder}/${names.get(tab.id)}` : names.get(tab.id)!;
    let path = `${base}.md`;
    for (let n = 2; used.has(path.toLowerCase()); n++) path = `${base} (${n}).md`;
    used.add(path.toLowerCase());
    return { path, content: docToMarkdown(docs.get(tab.id)) };
  });
}

export function buildZip(entries: ZipEntry[]): Blob {
  const files = Object.fromEntries(entries.map((entry) => [entry.path, strToU8(entry.content)]));
  const bytes = zipSync(files, { level: 6 });
  return new Blob([bytes.buffer as ArrayBuffer], { type: "application/zip" });
}
