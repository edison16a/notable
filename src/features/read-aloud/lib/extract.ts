import type { Node as PMNode } from "@tiptap/pm/model";
import { splitSentences } from "./sentences";

/** One sentence ready to speak, with the doc range it came from so it can be highlighted. */
export interface SpeakableSentence {
  text: string;
  from: number;
  to: number;
  pauseAfter: number;
}

/** A short beat after headings so they sound like headings rather than run into the paragraph. */
const HEADING_PAUSE_SECONDS = 0.45;

/**
 * Walks every text block in the doc and splits it into sentences. Reading
 * the ProseMirror tree (rather than exported Markdown) is what keeps
 * markdown symbols out of the audio: there are none to read. Checklist items
 * are plain paragraphs inside the tree, so they read as plain text.
 *
 * Inside a text block, character i of `textBetween` (with one-character leaf
 * text) sits at document position blockStart + 1 + i. That 1:1 mapping is
 * what lets a sentence or word offset turn straight into a highlight range.
 */
export function collectSentences(doc: PMNode, range?: { from: number; to: number }): SpeakableSentence[] {
  const sentences: SpeakableSentence[] = [];

  doc.descendants((node, pos) => {
    if (!node.isTextblock) return true;
    const contentStart = pos + 1;
    const text = node.textBetween(0, node.content.size, undefined, " ");
    const spans = splitSentences(text);
    const pause = node.type.name === "heading" ? HEADING_PAUSE_SECONDS : 0;

    spans.forEach((span, index) => {
      let start = span.start;
      let end = span.end;
      if (range) {
        start = Math.max(start, range.from - contentStart);
        end = Math.min(end, range.to - contentStart);
      }
      const raw = text.slice(start, end);
      const trimmed = raw.trim();
      if (!trimmed) return;
      start += raw.length - raw.trimStart().length;
      sentences.push({
        text: trimmed,
        from: contentStart + start,
        to: contentStart + start + trimmed.length,
        pauseAfter: index === spans.length - 1 ? pause : 0,
      });
    });
    return false;
  });

  return sentences;
}

/** The sentence the cursor sits in, or the first one if the cursor is past the end. */
export function sentenceIndexAt(sentences: SpeakableSentence[], pos: number): number {
  const index = sentences.findIndex((sentence) => pos < sentence.to);
  return index === -1 ? 0 : index;
}
