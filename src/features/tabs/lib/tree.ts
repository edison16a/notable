import type { TabRecord } from "@/features/storage/db";

/*
 * Pure operations on the flat tab list. Every function returns a new array
 * and never mutates its input, so the store can hand results straight to
 * React and the tests can check them without any setup.
 */

export type Tab = TabRecord;
export type DropPosition = "before" | "after" | "inside";

export interface VisibleRow {
  tab: Tab;
  depth: number;
  hasChildren: boolean;
}

export function childrenOf(tabs: Tab[], parentId: string | null): Tab[] {
  return tabs.filter((tab) => tab.parentId === parentId).sort((a, b) => a.order - b.order);
}

/** Flattens the tree in display order, skipping anything inside a folded tab. */
export function visibleRows(tabs: Tab[]): VisibleRow[] {
  const rows: VisibleRow[] = [];
  const walk = (parentId: string | null, depth: number) => {
    for (const tab of childrenOf(tabs, parentId)) {
      const hasChildren = tabs.some((other) => other.parentId === tab.id);
      rows.push({ tab, depth, hasChildren });
      if (hasChildren && !tab.folded) walk(tab.id, depth + 1);
    }
  };
  walk(null, 0);
  return rows;
}

/** Every tab nested under `id`, at any depth. */
export function descendantIds(tabs: Tab[], id: string): string[] {
  const result: string[] = [];
  const stack = [id];
  while (stack.length) {
    const current = stack.pop()!;
    for (const tab of tabs) {
      if (tab.parentId === current) {
        result.push(tab.id);
        stack.push(tab.id);
      }
    }
  }
  return result;
}

/** Ancestors from the root down to the direct parent of `id`. */
export function ancestorIds(tabs: Tab[], id: string): string[] {
  const byId = new Map(tabs.map((tab) => [tab.id, tab]));
  const path: string[] = [];
  let current = byId.get(id)?.parentId ?? null;
  while (current) {
    path.unshift(current);
    current = byId.get(current)?.parentId ?? null;
  }
  return path;
}

export function createTab(id: string, parentId: string | null, order: number, now = Date.now()): Tab {
  return { id, parentId, order, title: "", customTitle: false, folded: false, createdAt: now };
}

/** Adds a tab at the end of its siblings and unfolds the parent so the new row is visible. */
export function addTab(tabs: Tab[], tab: Tab): Tab[] {
  const siblings = childrenOf(tabs, tab.parentId);
  const order = siblings.length ? siblings[siblings.length - 1].order + 1 : 0;
  const next = tabs.map((other) => (other.id === tab.parentId ? { ...other, folded: false } : other));
  return [...next, { ...tab, order }];
}

/** Removes a tab and everything nested under it. */
export function removeTab(tabs: Tab[], id: string): Tab[] {
  const doomed = new Set([id, ...descendantIds(tabs, id)]);
  return tabs.filter((tab) => !doomed.has(tab.id));
}

export function updateTab(tabs: Tab[], id: string, patch: Partial<Tab>): Tab[] {
  return tabs.map((tab) => (tab.id === id ? { ...tab, ...patch } : tab));
}

/** Unfolds every ancestor of `id`, used when the quick switcher jumps to a deep tab. */
export function revealTab(tabs: Tab[], id: string): Tab[] {
  const path = new Set(ancestorIds(tabs, id));
  return tabs.map((tab) => (path.has(tab.id) && tab.folded ? { ...tab, folded: false } : tab));
}

/**
 * Moves `id` relative to `targetId`. Dropping a tab onto itself or into its
 * own subtree would create a cycle, so those moves return the list unchanged.
 * Sibling orders are rewritten as 0..n so they never drift into gaps.
 */
export function moveTab(tabs: Tab[], id: string, targetId: string, position: DropPosition): Tab[] {
  if (id === targetId || descendantIds(tabs, id).includes(targetId)) return tabs;
  const target = tabs.find((tab) => tab.id === targetId);
  const moving = tabs.find((tab) => tab.id === id);
  if (!target || !moving) return tabs;

  const parentId = position === "inside" ? target.id : target.parentId;
  const siblings = childrenOf(tabs, parentId).filter((tab) => tab.id !== id);
  let index = siblings.length;
  if (position !== "inside") {
    index = siblings.findIndex((tab) => tab.id === targetId) + (position === "after" ? 1 : 0);
  }
  siblings.splice(index, 0, { ...moving, parentId });

  const orders = new Map(siblings.map((tab, order) => [tab.id, order]));
  return tabs.map((tab) => {
    if (tab.id === id) return { ...moving, parentId, order: orders.get(id)! };
    if (orders.has(tab.id)) return { ...tab, order: orders.get(tab.id)! };
    if (position === "inside" && tab.id === target.id) return { ...tab, folded: false };
    return tab;
  });
}
