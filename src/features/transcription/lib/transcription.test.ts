import { describe, expect, it } from "vitest";
import { titleFromFileName, transcriptToDoc } from "./toDoc";
import { splitWindows } from "./windows";

describe("splitWindows", () => {
  it("cuts back-to-back 30 second windows with their start times", () => {
    const windows = splitWindows(new Float32Array(16000 * 70), 16000);
    expect(windows.map((window) => [window.start, window.audio.length])).toEqual([
      [0, 480000],
      [30, 480000],
      [60, 160000],
    ]);
  });

  it("copies each window so transferring one never detaches the source", () => {
    const samples = new Float32Array(10);
    expect(splitWindows(samples, 10, 1)[0].audio.buffer).not.toBe(samples.buffer);
  });
});

describe("transcriptToDoc", () => {
  const windows = [
    { start: 0, transcript: { text: " Hello there.", chunks: [{ start: 0, end: 2, text: " Hello there." }] } },
    { start: 30, transcript: { text: " [BLANK_AUDIO]", chunks: [] } },
    { start: 60, transcript: { text: " Bye.", chunks: [{ start: 5, end: 6, text: " Bye." }] } },
  ];

  it("titles the doc after the file and skips empty windows", () => {
    const doc = transcriptToDoc("Team call.m4a", windows, false);
    expect(doc.content?.[0].content?.[0].text).toBe("Team call");
    expect(doc.content?.slice(1).map((block) => block.content?.[0].text)).toEqual(["Hello there.", "Bye."]);
  });

  it("prefixes timestamps offset by the window start", () => {
    const doc = transcriptToDoc("call.mp3", windows, true);
    expect(doc.content?.slice(1).map((block) => block.content?.[0].text)).toEqual(["[0:00] Hello there.", "[1:05] Bye."]);
  });

  it("says so when no speech was found", () => {
    const doc = transcriptToDoc("quiet.wav", [windows[1]], false);
    expect(doc.content?.[1].content?.[0].text).toMatch(/No speech/);
  });

  it("derives clean titles from file names", () => {
    expect(titleFromFileName("notes.final.wav")).toBe("notes.final");
    expect(titleFromFileName(".mp3")).toBe("Transcript");
  });
});
