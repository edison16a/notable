import { describe, expect, it } from "vitest";
import { unzipSync, strFromU8 } from "fflate";
import { createTab } from "@/features/tabs/lib/tree";
import { safeFileName } from "./files";
import { docToMarkdown } from "./markdown";
import { buildZip, zipEntries } from "./zip";

const text = (value: string, marks?: Array<{ type: string; attrs?: Record<string, unknown> }>) => ({ type: "text", text: value, marks });
const p = (...content: object[]) => ({ type: "paragraph", content });

describe("docToMarkdown", () => {
  it("writes headings, marks, and links", () => {
    const doc = {
      type: "doc",
      content: [
        { type: "heading", attrs: { level: 2 }, content: [text("To do")] },
        p(text("Bold", [{ type: "bold" }]), text(" and "), text("site", [{ type: "link", attrs: { href: "https://x.dev" } }])),
      ],
    };
    expect(docToMarkdown(doc)).toBe("## To do\n\n**Bold** and [site](https://x.dev)\n");
  });

  it("writes checklists as - [ ] and - [x], nesting by two spaces", () => {
    const doc = {
      type: "doc",
      content: [
        {
          type: "taskList",
          content: [
            { type: "taskItem", attrs: { checked: true }, content: [p(text("Done"))] },
            {
              type: "taskItem",
              attrs: { checked: false },
              content: [p(text("Parent")), { type: "taskList", content: [{ type: "taskItem", attrs: { checked: false }, content: [p(text("Child"))] }] }],
            },
          ],
        },
      ],
    };
    expect(docToMarkdown(doc)).toBe("- [x] Done\n- [ ] Parent\n  - [ ] Child\n");
  });

  it("numbers ordered lists from their start and fences code", () => {
    const doc = {
      type: "doc",
      content: [
        { type: "orderedList", attrs: { start: 3 }, content: [{ type: "listItem", content: [p(text("a"))] }, { type: "listItem", content: [p(text("b"))] }] },
        { type: "codeBlock", attrs: { language: "ts" }, content: [text("let x = 1;")] },
      ],
    };
    expect(docToMarkdown(doc)).toBe("3. a\n4. b\n\n```ts\nlet x = 1;\n```\n");
  });

  it("escapes Markdown characters typed as plain text and drops empty paragraphs", () => {
    const doc = { type: "doc", content: [p(text("a*b [c]")), { type: "paragraph" }, p(text("end"))] };
    expect(docToMarkdown(doc)).toBe("a\\*b \\[c\\]\n\nend\n");
  });
});

describe("docToMarkdown edge cases", () => {
  it("skips an empty heading", () => {
    expect(docToMarkdown({ type: "doc", content: [{ type: "heading", attrs: { level: 1 } }, p(text("Body"))] })).toBe("Body\n");
  });

  it("keeps spaces outside bold so it still renders", () => {
    expect(docToMarkdown({ type: "doc", content: [p(text("hi "), text("bold ", [{ type: "bold" }]), text("x"))] })).toBe("hi **bold** x\n");
  });

  it("escapes a paragraph that would otherwise become a heading, list, or quote", () => {
    const out = docToMarkdown({ type: "doc", content: [p(text("# tag")), p(text("- dash")), p(text("2. two")), p(text("a <b> c"))] });
    expect(out).toBe("\\# tag\n\n\\- dash\n\n\\2. two\n\na \\<b\\> c\n");
  });

  it("indents lists nested under numbered items by the marker width", () => {
    const doc = {
      type: "doc",
      content: [
        {
          type: "orderedList",
          attrs: { start: 1 },
          content: [{ type: "listItem", content: [p(text("one")), { type: "bulletList", content: [{ type: "listItem", content: [p(text("nested"))] }] }] }],
        },
      ],
    };
    expect(docToMarkdown(doc)).toBe("1. one\n   - nested\n");
  });
});

describe("safeFileName", () => {
  it("removes characters file systems reject", () => {
    expect(safeFileName('a/b:c*?"<>|d')).toBe("a b c d");
    expect(safeFileName("  ...  ")).toBe("Untitled");
  });
});

describe("export all", () => {
  const tabs = [
    { ...createTab("p", null, 0, 1), title: "Planning", folded: true },
    { ...createTab("w", "p", 0, 1), title: "Week plan" },
    { ...createTab("x", null, 1, 1), title: "Notes" },
    { ...createTab("y", null, 2, 1), title: "notes" },
  ];
  const docs = new Map([["w", { type: "doc", content: [p(text("Hi"))] }]]);

  it("mirrors the tree in folders, including folded branches, and never overwrites", () => {
    expect(zipEntries(tabs, docs).map((entry) => entry.path)).toEqual(["Planning.md", "Planning/Week plan.md", "Notes.md", "notes (2).md"]);
  });

  it("produces a zip that unpacks to the Markdown", () => {
    const blob = buildZip(zipEntries(tabs, docs));
    return blob.arrayBuffer().then((buffer) => {
      const files = unzipSync(new Uint8Array(buffer));
      expect(strFromU8(files["Planning/Week plan.md"])).toBe("Hi\n");
    });
  });
});
