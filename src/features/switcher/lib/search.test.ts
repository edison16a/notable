import { describe, expect, it } from "vitest";
import { createTab } from "@/features/tabs/lib/tree";
import { searchTabs } from "./search";

const tabs = [
  { ...createTab("research", null, 0, 1), title: "Research" },
  { ...createTab("voices", "research", 0, 1), title: "Voice models" },
  { ...createTab("kokoro", "voices", 0, 1), title: "Kokoro notes" },
  { ...createTab("reading", "research", 1, 1), title: "Reading list" },
  { ...createTab("blank", null, 1, 1), title: "" },
];

describe("searchTabs", () => {
  it("ranks a title prefix above a word match above a substring", () => {
    const results = searchTabs(tabs, "re");
    expect(results.map((result) => result.id).slice(0, 2).sort()).toEqual(["reading", "research"]);
  });

  it("includes the ancestor path", () => {
    expect(searchTabs(tabs, "kok")[0]).toMatchObject({ id: "kokoro", path: "Research / Voice models" });
  });

  it("matches the Untitled placeholder and lists everything for an empty query", () => {
    expect(searchTabs(tabs, "untit")[0].id).toBe("blank");
    expect(searchTabs(tabs, "")).toHaveLength(tabs.length);
  });

  it("returns nothing when no title matches", () => {
    expect(searchTabs(tabs, "zzz")).toEqual([]);
  });
});
