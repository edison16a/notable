import { describe, expect, it } from "vitest";
import { deriveTitle, displayTitle } from "./title";

describe("deriveTitle", () => {
  it("uses the first non-empty block", () => {
    const doc = {
      type: "doc",
      content: [
        { type: "paragraph" },
        { type: "heading", content: [{ type: "text", text: "Week " }, { type: "text", text: "plan" }] },
      ],
    };
    expect(deriveTitle(doc)).toBe("Week plan");
  });

  it("reads into lists and collapses whitespace", () => {
    const doc = {
      type: "doc",
      content: [{ type: "taskList", content: [{ type: "taskItem", content: [{ type: "paragraph", content: [{ type: "text", text: "  Buy   milk " }] }] }] }],
    };
    expect(deriveTitle(doc)).toBe("Buy milk");
  });

  it("shortens very long first lines", () => {
    const title = deriveTitle({ type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "x".repeat(200) }] }] });
    expect(title.length).toBe(80);
    expect(title.endsWith("…")).toBe(true);
  });

  it("returns an empty string for an empty doc", () => {
    expect(deriveTitle({ type: "doc", content: [{ type: "heading" }] })).toBe("");
    expect(deriveTitle(null)).toBe("");
  });
});

describe("displayTitle", () => {
  it("falls back to Untitled", () => {
    expect(displayTitle("  ")).toBe("Untitled");
    expect(displayTitle("Notes")).toBe("Notes");
  });
});
