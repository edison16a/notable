import { describe, expect, it } from "vitest";
import { PauseSegmenter } from "./segmenter";
import { cleanTranscript, joinDictation } from "./transcript";

const RATE = 16000;
/** 100 ms of audio at a given amplitude. */
const chunk = (amplitude: number) => new Float32Array(RATE / 10).fill(amplitude);

function feed(segmenter: PauseSegmenter, amplitude: number, ms: number) {
  const results = [];
  for (let t = 0; t < ms; t += 100) results.push(segmenter.feed(chunk(amplitude)));
  return results;
}

describe("PauseSegmenter", () => {
  it("emits a segment after a one second pause following speech", () => {
    const segmenter = new PauseSegmenter({ sampleRate: RATE });
    feed(segmenter, 0.001, 500);
    expect(feed(segmenter, 0.2, 800).some((result) => result.segment)).toBe(false);
    const segment = feed(segmenter, 0.001, 1000).find((result) => result.segment)?.segment;
    // Pre-roll (300 ms) plus speech (800 ms) plus the pause (1000 ms).
    expect(segment?.length).toBe((RATE * 2100) / 1000);
  });

  it("ignores blips too short to be speech", () => {
    const segmenter = new PauseSegmenter({ sampleRate: RATE });
    feed(segmenter, 0.2, 100);
    expect(feed(segmenter, 0.001, 1500).some((result) => result.segment)).toBe(false);
  });

  it("warns after three seconds of silence and clears once speech starts", () => {
    const segmenter = new PauseSegmenter({ sampleRate: RATE });
    const quiet = feed(segmenter, 0, 3000);
    expect(quiet.at(-1)?.silent).toBe(true);
    expect(segmenter.feed(chunk(0.3)).silent).toBe(false);
  });

  it("cuts long speech so each piece fits Whisper's window", () => {
    const segmenter = new PauseSegmenter({ sampleRate: RATE, maxSegmentMs: 2000 });
    expect(feed(segmenter, 0.2, 2500).some((result) => result.segment)).toBe(true);
  });

  it("flushes buffered speech on stop", () => {
    const segmenter = new PauseSegmenter({ sampleRate: RATE });
    feed(segmenter, 0.2, 600);
    expect(segmenter.flush()?.length).toBe((RATE * 600) / 1000);
    expect(segmenter.flush()).toBeNull();
  });
});

describe("cleanTranscript", () => {
  it("drops tags Whisper produces for silence", () => {
    expect(cleanTranscript(" [BLANK_AUDIO] ")).toBe("");
    expect(cleanTranscript("(music) [silence]")).toBe("");
    expect(cleanTranscript("Thank you.")).toBe("");
  });

  it("keeps real speech and strips stray tags", () => {
    expect(cleanTranscript("  Call   the dentist. [BLANK_AUDIO]")).toBe("Call the dentist.");
  });
});

describe("joinDictation", () => {
  it("adds a space only when the cursor follows a word", () => {
    expect(joinDictation("d", "and more")).toBe(" and more");
    expect(joinDictation(" ", "and more")).toBe("and more");
    expect(joinDictation("", "Start")).toBe("Start");
    expect(joinDictation("x", "")).toBe("");
  });
});
