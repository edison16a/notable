import { describe, expect, it } from "vitest";
import { getSchema } from "@tiptap/core";
import { Node as PMNode } from "@tiptap/pm/model";
import { createExtensions } from "@/features/editor/extensions";
import { collectSentences, sentenceIndexAt } from "./extract";

const schema = getSchema(createExtensions());

const doc = PMNode.fromJSON(schema, {
  type: "doc",
  content: [
    { type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: "Week plan" }] },
    { type: "paragraph", content: [{ type: "text", text: "Ship it. " }, { type: "text", text: "Then rest.", marks: [{ type: "bold" }] }] },
    {
      type: "taskList",
      content: [{ type: "taskItem", attrs: { checked: true }, content: [{ type: "paragraph", content: [{ type: "text", text: "Buy milk" }] }] }],
    },
  ],
});

describe("collectSentences", () => {
  const sentences = collectSentences(doc);

  it("reads headings, paragraphs, and checklist items as plain text", () => {
    expect(sentences.map((sentence) => sentence.text)).toEqual(["Week plan", "Ship it.", "Then rest.", "Buy milk"]);
  });

  it("maps every sentence to its exact range in the doc", () => {
    for (const sentence of sentences) {
      expect(doc.textBetween(sentence.from, sentence.to)).toBe(sentence.text);
    }
  });

  it("pauses briefly after headings only", () => {
    expect(sentences[0].pauseAfter).toBeGreaterThan(0);
    expect(sentences.slice(1).every((sentence) => sentence.pauseAfter === 0)).toBe(true);
  });

  it("limits reading to a selection", () => {
    const start = sentences[1].from + 5;
    const picked = collectSentences(doc, { from: start, to: sentences[2].to });
    expect(picked.map((sentence) => sentence.text)).toEqual(["it.", "Then rest."]);
    expect(doc.textBetween(picked[0].from, picked[0].to)).toBe("it.");
  });
});

describe("sentenceIndexAt", () => {
  const sentences = collectSentences(doc);

  it("finds the sentence holding the cursor", () => {
    expect(sentenceIndexAt(sentences, sentences[2].from + 1)).toBe(2);
  });

  it("starts from the top when the cursor is past the last sentence", () => {
    expect(sentenceIndexAt(sentences, doc.content.size)).toBe(0);
  });
});
