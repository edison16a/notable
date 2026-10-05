import type { Extensions, JSONContent } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { TaskItem, TaskList } from "@tiptap/extension-list";
import { Placeholder } from "@tiptap/extensions";

/** New docs start with an empty title heading so the first line naturally names the tab. */
export const EMPTY_DOC: JSONContent = {
  type: "doc",
  content: [{ type: "heading", attrs: { level: 1 } }],
};

/**
 * The editor's feature set. StarterKit already turns "# ", "- " and "1. "
 * into blocks as you type. TaskItem's own input rule accepts "[] " as well as
 * "[ ] ", which is exactly the checklist trigger the spec asks for.
 */
export function createExtensions(extra: Extensions = []): Extensions {
  return [
    StarterKit.configure({
      heading: { levels: [1, 2, 3] },
      link: { openOnClick: false, autolink: true },
    }),
    TaskList,
    TaskItem.configure({ nested: true }),
    Placeholder.configure({
      showOnlyCurrent: true,
      placeholder: ({ node, editor }) => {
        const isFirst = editor.state.doc.firstChild === node;
        if (node.type.name === "heading") return isFirst ? "Untitled" : "Heading";
        return "Write, or type # for a heading and [] for a checklist";
      },
    }),
    ...extra,
  ];
}
