import { describe, expect, it } from "vitest";
import { addTab, ancestorIds, createTab, descendantIds, moveTab, removeTab, revealTab, visibleRows, type Tab } from "./tree";

/** Builds a small tree: a > (b > d), c. */
function sample(): Tab[] {
  return [
    { ...createTab("a", null, 0, 1), title: "A" },
    { ...createTab("b", "a", 0, 1), title: "B" },
    { ...createTab("c", null, 1, 1), title: "C" },
    { ...createTab("d", "b", 0, 1), title: "D" },
  ];
}

const ids = (tabs: Tab[]) => visibleRows(tabs).map((row) => `${row.depth}:${row.tab.id}`);

describe("visibleRows", () => {
  it("lists tabs depth first in order", () => {
    expect(ids(sample())).toEqual(["0:a", "1:b", "2:d", "0:c"]);
  });

  it("skips everything inside a folded tab", () => {
    const tabs = sample().map((tab) => (tab.id === "a" ? { ...tab, folded: true } : tab));
    expect(ids(tabs)).toEqual(["0:a", "0:c"]);
  });

  it("marks rows that have children", () => {
    const rows = visibleRows(sample());
    expect(rows.find((row) => row.tab.id === "b")?.hasChildren).toBe(true);
    expect(rows.find((row) => row.tab.id === "c")?.hasChildren).toBe(false);
  });
});

describe("ancestry", () => {
  it("finds descendants at any depth", () => {
    expect(descendantIds(sample(), "a").sort()).toEqual(["b", "d"]);
  });

  it("lists ancestors from the root down", () => {
    expect(ancestorIds(sample(), "d")).toEqual(["a", "b"]);
  });
});

describe("addTab", () => {
  it("appends after the last sibling and unfolds the parent", () => {
    const folded = sample().map((tab) => (tab.id === "a" ? { ...tab, folded: true } : tab));
    const next = addTab(folded, createTab("e", "a", 0, 1));
    expect(next.find((tab) => tab.id === "e")?.order).toBe(1);
    expect(next.find((tab) => tab.id === "a")?.folded).toBe(false);
  });
});

describe("removeTab", () => {
  it("removes the tab and its whole subtree", () => {
    expect(removeTab(sample(), "a").map((tab) => tab.id)).toEqual(["c"]);
  });
});

describe("moveTab", () => {
  it("reorders before a sibling", () => {
    expect(ids(moveTab(sample(), "c", "a", "before"))).toEqual(["0:c", "0:a", "1:b", "2:d"]);
  });

  it("nests inside another tab as its last child", () => {
    expect(ids(moveTab(sample(), "c", "b", "inside"))).toEqual(["0:a", "1:b", "2:d", "2:c"]);
  });

  it("moves a nested tab back to the top level", () => {
    expect(ids(moveTab(sample(), "d", "c", "after"))).toEqual(["0:a", "1:b", "0:c", "0:d"]);
  });

  it("refuses to drop a tab into its own subtree", () => {
    const tabs = sample();
    expect(moveTab(tabs, "a", "d", "inside")).toBe(tabs);
    expect(moveTab(tabs, "a", "a", "after")).toBe(tabs);
  });
});

describe("revealTab", () => {
  it("unfolds every ancestor of a deep tab", () => {
    const folded = sample().map((tab) => ({ ...tab, folded: true }));
    const revealed = revealTab(folded, "d");
    expect(revealed.filter((tab) => !tab.folded).map((tab) => tab.id).sort()).toEqual(["a", "b"]);
  });
});
