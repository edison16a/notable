import { describe, expect, it } from "vitest";
import { fractionAtOffset, splitSentences, splitWords, wordAtFraction } from "./sentences";

describe("splitSentences", () => {
  it("splits on sentence ends and keeps exact offsets", () => {
    const text = "Voices run locally. Each one is cached!  Done?";
    const spans = splitSentences(text);
    expect(spans.map((span) => span.text)).toEqual(["Voices run locally.", "Each one is cached!", "Done?"]);
    for (const span of spans) expect(text.slice(span.start, span.end)).toBe(span.text);
  });

  it("does not split after common abbreviations", () => {
    expect(splitSentences("Ask Dr. Lee about it. Then rest.")).toHaveLength(2);
  });

  it("breaks run-on text into chunks the model can handle", () => {
    const longText = Array.from({ length: 80 }, (_, i) => `word${i},`).join(" ");
    const spans = splitSentences(longText);
    expect(spans.length).toBeGreaterThan(1);
    for (const span of spans) {
      expect(span.text.length).toBeLessThanOrEqual(280);
      expect(longText.slice(span.start, span.end)).toBe(span.text);
    }
  });

  it("ignores whitespace-only input", () => {
    expect(splitSentences("   ")).toEqual([]);
  });
});

describe("word timing", () => {
  it("finds word spans", () => {
    expect(splitWords("Hi  there you").map((word) => [word.start, word.end])).toEqual([[0, 2], [4, 9], [10, 13]]);
  });

  it("maps a point in the audio to the word by character share", () => {
    const text = "one two three";
    expect(wordAtFraction(text, 0)?.text).toBe("one");
    expect(wordAtFraction(text, 0.5)?.text).toBe("two");
    expect(wordAtFraction(text, 0.99)?.text).toBe("three");
    expect(wordAtFraction(text, 5)?.text).toBe("three");
  });

  it("maps a character offset back to a share of the audio", () => {
    expect(fractionAtOffset("abcd", 1)).toBe(0.25);
    expect(fractionAtOffset("", 3)).toBe(0);
  });
});
