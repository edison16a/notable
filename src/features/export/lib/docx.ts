import type { JSONContent } from "@tiptap/core";
import {
  CheckBox,
  Document,
  ExternalHyperlink,
  HeadingLevel,
  LevelFormat,
  Packer,
  Paragraph,
  TextRun,
  type ParagraphChild,
} from "docx";

const NUMBERED = "numbered";
const HEADINGS = [HeadingLevel.HEADING_1, HeadingLevel.HEADING_2, HeadingLevel.HEADING_3];
const INDENT_TWIPS = 360;
const NUMBERED_LEVELS = 6;
const LAST_NUMBERED_LEVEL = NUMBERED_LEVELS - 1;

/**
 * Builds a Word file in the browser. Headings map to Word's heading styles,
 * lists to real Word bullets and numbering, and checklist items to Word's
 * own checkbox content control, so the result stays editable in Word.
 */
class DocxBuilder {
  /** Each ordered list gets its own numbering instance so numbering restarts at 1. */
  private listInstance = 0;

  runs(nodes: JSONContent[] = [], strike = false): ParagraphChild[] {
    return nodes.flatMap((node): ParagraphChild[] => {
      if (node.type === "hardBreak") return [new TextRun({ text: "", break: 1 })];
      if (node.type !== "text") return [];
      const has = (type: string) => node.marks?.some((mark) => mark.type === type) ?? false;
      const link = node.marks?.find((mark) => mark.type === "link");
      const run = new TextRun({
        text: node.text ?? "",
        bold: has("bold"),
        italics: has("italic"),
        strike: strike || has("strike"),
        // docx treats an empty object as a plain single underline.
        underline: has("underline") || link ? {} : undefined,
        color: link ? "0563C1" : undefined,
        font: has("code") ? "Consolas" : undefined,
      });
      return link ? [new ExternalHyperlink({ link: String(link.attrs?.href ?? ""), children: [run] })] : [run];
    });
  }

  blocks(node: JSONContent, depth = 0): Paragraph[] {
    switch (node.type) {
      case "heading":
        return [new Paragraph({ heading: HEADINGS[Number(node.attrs?.level ?? 1) - 1], children: this.runs(node.content) })];
      case "paragraph":
        return [new Paragraph({ children: this.runs(node.content), indent: depth ? { left: depth * INDENT_TWIPS } : undefined })];
      case "bulletList":
      case "orderedList":
      case "taskList":
        return this.list(node, depth);
      case "blockquote":
        return (node.content ?? []).flatMap((child) => this.blocks(child, depth + 1));
      case "codeBlock":
        // A newline inside a single TextRun collapses to a space in Word, so every line becomes its own run.
        return [
          new Paragraph({
            children: (node.content ?? [])
              .map((child) => child.text ?? "")
              .join("")
              .split("\n")
              .map((line, index) => new TextRun({ text: line, font: "Consolas", break: index ? 1 : undefined })),
          }),
        ];
      case "horizontalRule":
        return [new Paragraph({ thematicBreak: true })];
      default:
        return [];
    }
  }

  private list(list: JSONContent, depth: number): Paragraph[] {
    const instance = this.listInstance++;
    return (list.content ?? []).flatMap((item) => {
      const [first, ...rest] = item.content ?? [];
      const checked = Boolean(item.attrs?.checked);
      let head: Paragraph;
      if (list.type === "taskList") {
        head = new Paragraph({
          indent: { left: depth * INDENT_TWIPS },
          children: [new CheckBox({ checked }), new TextRun(" "), ...this.runs(first?.content, checked)],
        });
      } else if (list.type === "orderedList") {
        // Word has a fixed number of list levels, so very deep nesting stops indenting further.
        head = new Paragraph({ numbering: { reference: NUMBERED, level: Math.min(depth, LAST_NUMBERED_LEVEL), instance }, children: this.runs(first?.content) });
      } else {
        head = new Paragraph({ bullet: { level: Math.min(depth, 8) }, children: this.runs(first?.content) });
      }
      return [head, ...rest.flatMap((child) => this.blocks(child, depth + 1))];
    });
  }
}

export async function docToDocx(doc: JSONContent | null | undefined): Promise<Blob> {
  const builder = new DocxBuilder();
  const document = new Document({
    creator: "Notable",
    numbering: {
      config: [
        {
          reference: NUMBERED,
          levels: Array.from({ length: NUMBERED_LEVELS }, (_, level) => ({
            level,
            format: LevelFormat.DECIMAL,
            text: `%${level + 1}.`,
            style: { paragraph: { indent: { left: (level + 1) * 720, hanging: 360 } } },
          })),
        },
      ],
    },
    sections: [{ children: (doc?.content ?? []).flatMap((node) => builder.blocks(node)) }],
  });
  return Packer.toBlob(document);
}
