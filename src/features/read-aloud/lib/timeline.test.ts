import { describe, expect, it } from "vitest";
import { estimateDuration, locate, startTimes, totalLength, type TimedItem } from "./timeline";

const items: TimedItem[] = [
  { text: "First", duration: 2, pauseAfter: 0.5 },
  { text: "Second", duration: 3, pauseAfter: 0 },
  { text: "x".repeat(30), duration: null, pauseAfter: 0 },
];

describe("timeline", () => {
  it("estimates unknown sentences from their length", () => {
    expect(estimateDuration("x".repeat(30))).toBe(2);
    expect(estimateDuration("Hi")).toBe(0.6);
  });

  it("adds pauses into start times and the total", () => {
    expect(startTimes(items)).toEqual([0, 2.5, 5.5]);
    expect(totalLength(items)).toBe(7.5);
  });

  it("locates the sentence and offset for a scrub position", () => {
    expect(locate(items, 3)).toEqual({ index: 1, offset: 0.5 });
    expect(locate(items, 6)).toEqual({ index: 2, offset: 0.5 });
  });

  it("clamps a position inside a pause to the end of that sentence's audio", () => {
    expect(locate(items, 2.3)).toEqual({ index: 0, offset: 2 });
  });

  it("handles an empty queue", () => {
    expect(locate([], 4)).toEqual({ index: 0, offset: 0 });
  });
});
