import { debounce } from "@/lib/debounce";
import { onPageLeave } from "@/lib/pageLifecycle";
import { saveTabs, setMeta } from "@/features/storage/repository";
import type { Tab } from "./lib/tree";
import { ACTIVE_TAB_KEY, useTabsStore } from "./store";

const SAVE_DELAY_MS = 500;

/**
 * Mirrors the tab store into IndexedDB. Tree edits are debounced like doc
 * edits, while the active tab is written right away because it is a single
 * tiny row and the user expects it to stick even after a quick reload.
 * Returns a cleanup function for the effect that starts it.
 */
export function startTabPersistence(): () => void {
  // Tabs removed since the last write. Collected across the debounce so none are missed.
  const removed = new Set<string>();
  const saveTree = debounce((tabs: Tab[]) => {
    const ids = [...removed];
    removed.clear();
    saveTabs(tabs, ids).catch((error) => console.warn("Could not save the tab tree", error));
  }, SAVE_DELAY_MS);

  const unsubscribe = useTabsStore.subscribe((state, previous) => {
    if (!state.ready) return;
    if (state.tabs !== previous.tabs) {
      const alive = new Set(state.tabs.map((tab) => tab.id));
      for (const tab of previous.tabs) if (!alive.has(tab.id)) removed.add(tab.id);
      saveTree(state.tabs);
    }
    if (state.activeId !== previous.activeId && state.activeId) void setMeta(ACTIVE_TAB_KEY, state.activeId);
  });

  // Save once up front so a first-launch blank tab exists on disk before any edit.
  saveTree(useTabsStore.getState().tabs);

  const stopWatching = onPageLeave(() => saveTree.flush());

  return () => {
    saveTree.flush();
    unsubscribe();
    stopWatching();
  };
}
