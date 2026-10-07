import type { JSONContent } from "@tiptap/core";

/*
 * Tiptap JSON to Markdown, written by hand because the doc only uses a
 * small set of nodes and this keeps the output predictable: checklists come
 * out as "- [ ]" and "- [x]", nested lists indent by two spaces per level.
 */

type Mark = NonNullable<JSONContent["marks"]>[number];

function wrapMark(text: string, mark: Mark): string {
  switch (mark.type) {
    case "bold":
      return `**${text}**`;
    case "italic":
      return `*${text}*`;
    case "strike":
      return `~~${text}~~`;
    case "code":
      return `\`${text}\``;
    case "link":
      return `[${text}](${String(mark.attrs?.href ?? "")})`;
    default:
      return text;
  }
}

/** Escapes characters that would otherwise turn plain text into Markdown syntax. */
function escapeText(text: string): string {
  return text.replace(/([\\`*_[\]<>])/g, "\\$1");
}

/**
 * A paragraph that merely starts with "#", "-", "+", ">" or "1." would turn
 * into a heading, list, or quote when the file is opened again, so the first
 * character of such a line is escaped.
 */
function escapeLineStart(line: string): string {
  return line.replace(/^(\s*)([#>+-]|\d+(?=[.)]\s))/, "$1\\$2");
}

/** Bold and italic must hug the words: "**bold **" does not render, "**bold** " does. */
function wrapWithMarks(text: string, marks: Mark[]): string {
  const lead = text.match(/^\s*/)![0];
  const trail = text.slice(lead.length).match(/\s*$/)![0];
  const core = text.slice(lead.length, text.length - trail.length);
  if (!core) return text;
  return lead + marks.reduce(wrapMark, core) + trail;
}

export function inlineToMarkdown(nodes: JSONContent[] = []): string {
  return nodes
    .map((node) => {
      if (node.type === "hardBreak") return "  \n";
      if (node.type !== "text") return "";
      const isCode = node.marks?.some((mark) => mark.type === "code");
      const base = isCode ? (node.text ?? "") : escapeText(node.text ?? "");
      return wrapWithMarks(base, node.marks ?? []);
    })
    .join("");
}

/**
 * Lists nest by the width of their marker: "- " is 2 characters but "10. " is
 * 4, and a child indented less than that is read as part of the parent line.
 */
function listToMarkdown(list: JSONContent, indent: string): string {
  const start = Number(list.attrs?.start ?? 1);
  return (list.content ?? [])
    .map((item, index) => {
      const marker =
        list.type === "orderedList"
          ? `${start + index}.`
          : list.type === "taskList"
            ? `- [${item.attrs?.checked ? "x" : " "}]`
            : "-";
      const width = list.type === "orderedList" ? marker.length + 1 : 2;
      const [first, ...rest] = item.content ?? [];
      const head = `${indent}${marker} ${first ? escapeLineStart(inlineToMarkdown(first.content)) : ""}`;
      const tail = rest.map((child) => blockToMarkdown(child, indent + " ".repeat(width))).filter(Boolean);
      return [head, ...tail].join("\n");
    })
    .join("\n");
}

function blockToMarkdown(node: JSONContent, indent = ""): string {
  switch (node.type) {
    case "heading": {
      const text = inlineToMarkdown(node.content);
      // An untitled doc has an empty heading. "# " on its own is noise in the file.
      return text.trim() ? `${"#".repeat(Number(node.attrs?.level ?? 1))} ${text}` : "";
    }
    case "paragraph":
      return `${indent}${escapeLineStart(inlineToMarkdown(node.content))}`;
    case "bulletList":
    case "orderedList":
    case "taskList":
      return listToMarkdown(node, indent);
    case "blockquote":
      return (node.content ?? [])
        .map((child) => blockToMarkdown(child))
        .join("\n\n")
        .split("\n")
        .map((line) => `> ${line}`.trimEnd())
        .join("\n");
    case "codeBlock": {
      const code = (node.content ?? []).map((child) => child.text ?? "").join("");
      return `\`\`\`${String(node.attrs?.language ?? "")}\n${code}\n\`\`\``;
    }
    case "horizontalRule":
      return "---";
    default:
      return inlineToMarkdown(node.content);
  }
}

export function docToMarkdown(doc: JSONContent | null | undefined): string {
  // Empty paragraphs are only visual spacing in the editor. Markdown already separates blocks.
  const blocks = (doc?.content ?? []).map((node) => blockToMarkdown(node)).filter((block) => block.trim());
  return `${blocks.join("\n\n")}\n`;
}
