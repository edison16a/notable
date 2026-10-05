export interface TextSpan {
  /** Offsets into the source string, end exclusive. */
  start: number;
  end: number;
  text: string;
}

/** Kokoro handles about 500 phoneme tokens per call. Long run-on sentences are split well below that. */
const MAX_SENTENCE_CHARS = 280;

function segmentSentences(text: string): TextSpan[] {
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    const segmenter = new Intl.Segmenter("en", { granularity: "sentence" });
    return Array.from(segmenter.segment(text), (part) => ({
      start: part.index,
      end: part.index + part.segment.length,
      text: part.segment,
    }));
  }
  const spans: TextSpan[] = [];
  for (const match of text.matchAll(/[^.!?]+[.!?]*\s*/g)) {
    spans.push({ start: match.index, end: match.index + match[0].length, text: match[0] });
  }
  return spans;
}

/** Titles and short forms that end in a period without ending the sentence. */
const ABBREVIATION = /\b(?:Mr|Mrs|Ms|Dr|Prof|Sr|Jr|St|vs|etc|e\.g|i\.e|approx|no)\.\s*$/i;

/**
 * The segmenter (in browsers and Node alike) breaks after "Dr." and friends,
 * which would make the voice pause mid-name. Rejoins those pieces.
 */
function mergeAbbreviations(spans: TextSpan[]): TextSpan[] {
  const merged: TextSpan[] = [];
  for (const span of spans) {
    const previous = merged[merged.length - 1];
    if (previous && ABBREVIATION.test(previous.text)) {
      merged[merged.length - 1] = { start: previous.start, end: span.end, text: previous.text + span.text };
    } else {
      merged.push(span);
    }
  }
  return merged;
}

/** Splits an overlong span at the last comma, semicolon, or space before the limit. */
function splitLong(span: TextSpan): TextSpan[] {
  const parts: TextSpan[] = [];
  let rest = span;
  while (rest.text.length > MAX_SENTENCE_CHARS) {
    const window = rest.text.slice(0, MAX_SENTENCE_CHARS);
    const cut = Math.max(window.lastIndexOf(", "), window.lastIndexOf("; "), window.lastIndexOf(" "));
    const at = cut > 0 ? cut + 1 : MAX_SENTENCE_CHARS;
    parts.push({ start: rest.start, end: rest.start + at, text: rest.text.slice(0, at) });
    rest = { start: rest.start + at, end: rest.end, text: rest.text.slice(at) };
  }
  parts.push(rest);
  return parts;
}

/** Shrinks a span so it starts and ends on visible characters. */
function trimSpan(span: TextSpan): TextSpan | null {
  const leading = span.text.length - span.text.trimStart().length;
  const trimmed = span.text.trim();
  if (!trimmed) return null;
  const start = span.start + leading;
  return { start, end: start + trimmed.length, text: trimmed };
}

/**
 * Splits text into sentences with their offsets, so each one can be
 * generated, cached, and highlighted on its own. Uses Intl.Segmenter where
 * available because it understands abbreviations far better than a regex.
 */
export function splitSentences(text: string): TextSpan[] {
  return mergeAbbreviations(segmentSentences(text))
    .flatMap(splitLong)
    .map(trimSpan)
    .filter((span): span is TextSpan => span !== null);
}

/** Word spans inside a sentence, used for the word highlight. */
export function splitWords(text: string): TextSpan[] {
  return Array.from(text.matchAll(/\S+/g), (match) => ({
    start: match.index,
    end: match.index + match[0].length,
    text: match[0],
  }));
}

/**
 * Picks the word being spoken at `fraction` (0 to 1) of the sentence audio.
 * Timing is estimated by character count: a word that is a third of the
 * letters gets a third of the time. Rough, but it tracks speech well enough.
 */
export function wordAtFraction(text: string, fraction: number): TextSpan | null {
  const words = splitWords(text);
  if (!words.length) return null;
  const position = Math.max(0, Math.min(1, fraction)) * text.length;
  return words.find((word) => position < word.end) ?? words[words.length - 1];
}

/** The inverse of wordAtFraction: where in the audio a character offset is spoken. */
export function fractionAtOffset(text: string, offset: number): number {
  return text.length ? Math.max(0, Math.min(1, offset / text.length)) : 0;
}
