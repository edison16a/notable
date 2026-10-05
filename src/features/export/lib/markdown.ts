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
  return text.replace(/([\\`*_[\]])/g, "\\$1");
}

export function inlineToMarkdown(nodes: JSONContent[] = []): string {
  return nodes
    .map((node) => {
      if (node.type === "hardBreak") return "  \n";
      if (node.type !== "text") return "";
      const isCode = node.marks?.some((mark) => mark.type === "code");
      const base = isCode ? (node.text ?? "") : escapeText(node.text ?? "");
      return (node.marks ?? []).reduce(wrapMark, base);
    })
    .join("");
}

function listToMarkdown(list: JSONContent, depth: number): string {
  const indent = "  ".repeat(depth);
  const start = Number(list.attrs?.start ?? 1);
  return (list.content ?? [])
    .map((item, index) => {
      const marker =
        list.type === "orderedList"
          ? `${start + index}.`
          : list.type === "taskList"
            ? `- [${item.attrs?.checked ? "x" : " "}]`
            : "-";
      const [first, ...rest] = item.content ?? [];
      const head = `${indent}${marker} ${first ? inlineToMarkdown(first.content) : ""}`;
      const tail = rest.map((child) => blockToMarkdown(child, depth + 1)).filter(Boolean);
      return [head, ...tail].join("\n");
    })
    .join("\n");
}

function blockToMarkdown(node: JSONContent, depth = 0): string {
  switch (node.type) {
    case "heading":
      return `${"#".repeat(Number(node.attrs?.level ?? 1))} ${inlineToMarkdown(node.content)}`;
    case "paragraph":
      return `${"  ".repeat(depth)}${inlineToMarkdown(node.content)}`;
    case "bulletList":
    case "orderedList":
    case "taskList":
      return listToMarkdown(node, depth);
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
  const blocks = (doc?.content ?? []).map((node) => blockToMarkdown(node));
  // Drop empty paragraphs at the edges but keep intentional spacing in between.
  while (blocks.length && !blocks[blocks.length - 1].trim()) blocks.pop();
  while (blocks.length && !blocks[0].trim()) blocks.shift();
  return `${blocks.join("\n\n")}\n`;
}
