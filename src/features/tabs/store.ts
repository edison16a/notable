import { create } from "zustand";
import type { JSONContent } from "@tiptap/core";
import { createId } from "@/lib/id";
import { getMeta, loadDoc, loadTabs, saveDoc } from "@/features/storage/repository";
import { deriveTitle } from "./lib/title";
import * as tree from "./lib/tree";

export const ACTIVE_TAB_KEY = "activeTabId";

interface TabsState {
  ready: boolean;
  tabs: tree.Tab[];
  activeId: string | null;
  /** Loads the saved tree, or creates the single blank doc a first launch opens into. */
  hydrate(): Promise<void>;
  addTab(parentId: string | null): string;
  /** Creates a tab whose doc already has content, used for transcripts and imports. */
  addTabWithDoc(content: JSONContent, parentId?: string | null): Promise<string>;
  deleteTab(id: string): void;
  renameTab(id: string, title: string): void;
  /** Called by the editor as the user types. Ignored once the user has renamed the tab. */
  setDerivedTitle(id: string, title: string): void;
  toggleFold(id: string): void;
  moveTab(id: string, targetId: string, position: tree.DropPosition): void;
  select(id: string): void;
}

export const useTabsStore = create<TabsState>((set, get) => ({
  ready: false,
  tabs: [],
  activeId: null,

  async hydrate() {
    let tabs: tree.Tab[] = [];
    let savedActive: string | undefined;
    try {
      tabs = await loadTabs();
      savedActive = await getMeta<string>(ACTIVE_TAB_KEY);
    } catch {
      // Storage can be blocked (some private windows). Notable still works, it just will not remember anything.
    }
    // Another window may have removed a parent while its children were still being written. Lift those to the top level.
    const ids = new Set(tabs.map((tab) => tab.id));
    tabs = tabs.map((tab) => (tab.parentId && !ids.has(tab.parentId) ? { ...tab, parentId: null } : tab));
    if (!tabs.length) tabs = [tree.createTab(createId(), null, 0)];
    const activeId = tabs.some((tab) => tab.id === savedActive) ? savedActive! : (tree.visibleRows(tabs)[0]?.tab.id ?? tabs[0].id);
    // Folds are restored exactly as they were left, even if the active doc sits inside a folded tab.
    set({ tabs, activeId, ready: true });
  },

  addTab(parentId) {
    const tab = tree.createTab(createId(), parentId, 0);
    set((state) => ({ tabs: tree.addTab(state.tabs, tab), activeId: tab.id }));
    return tab.id;
  },

  async addTabWithDoc(content, parentId = null) {
    const id = createId();
    await saveDoc(id, content);
    const tab = { ...tree.createTab(id, parentId, 0), title: deriveTitle(content) };
    set((state) => ({ tabs: tree.addTab(state.tabs, tab), activeId: id }));
    return id;
  },

  deleteTab(id) {
    const { tabs, activeId } = get();
    let next = tree.removeTab(tabs, id);
    let nextActive = activeId;
    if (!next.some((tab) => tab.id === activeId)) {
      // Land on the row just above the deleted one, which is where the eye already is.
      const rows = tree.visibleRows(tabs);
      const index = rows.findIndex((row) => row.tab.id === id);
      const survivors = rows.slice(0, index).reverse().concat(rows.slice(index + 1));
      nextActive = survivors.find((row) => next.some((tab) => tab.id === row.tab.id))?.tab.id ?? null;
    }
    if (!next.length) {
      const blank = tree.createTab(createId(), null, 0);
      next = [blank];
      nextActive = blank.id;
    }
    set({ tabs: next, activeId: nextActive });
  },

  renameTab(id, title) {
    const trimmed = title.trim();
    // Clearing the name hands the title back to the doc's first line.
    set((state) => ({ tabs: tree.updateTab(state.tabs, id, { title: trimmed, customTitle: trimmed.length > 0 }) }));
    if (!trimmed) {
      void loadDoc(id)
        .then((doc) => get().setDerivedTitle(id, deriveTitle(doc)))
        .catch(() => undefined);
    }
  },

  setDerivedTitle(id, title) {
    const tab = get().tabs.find((candidate) => candidate.id === id);
    if (!tab || tab.customTitle || tab.title === title) return;
    set((state) => ({ tabs: tree.updateTab(state.tabs, id, { title }) }));
  },

  toggleFold(id) {
    set((state) => ({
      tabs: state.tabs.map((tab) => (tab.id === id ? { ...tab, folded: !tab.folded } : tab)),
    }));
  },

  moveTab(id, targetId, position) {
    set((state) => ({ tabs: tree.moveTab(state.tabs, id, targetId, position) }));
  },

  select(id) {
    set((state) => ({ activeId: id, tabs: tree.revealTab(state.tabs, id) }));
  },
}));
