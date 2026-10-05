import { describe, expect, it } from "vitest";
import { barsFromSpectrum, easeBars, overallLevel } from "./levels";
import { mixToMono, resample, rms } from "./resample";
import { encodeWav } from "./wav";

describe("resample", () => {
  it("returns the input when rates match", () => {
    const input = new Float32Array([1, 2, 3]);
    expect(resample(input, 16000, 16000)).toBe(input);
  });

  it("downsamples by averaging, keeping a steady signal steady", () => {
    const output = resample(new Float32Array(48000).fill(0.5), 48000, 16000);
    expect(output.length).toBe(16000);
    expect(output.every((value) => Math.abs(value - 0.5) < 1e-6)).toBe(true);
  });

  it("handles uneven ratios like 44.1 kHz", () => {
    expect(resample(new Float32Array(44100), 44100, 16000).length).toBe(16000);
  });
});

describe("mixToMono and rms", () => {
  it("averages channels", () => {
    expect(Array.from(mixToMono([new Float32Array([1, 0]), new Float32Array([0, 1])]))).toEqual([0.5, 0.5]);
  });

  it("measures loudness", () => {
    expect(rms(new Float32Array([0.5, -0.5]))).toBe(0.5);
    expect(rms(new Float32Array(0))).toBe(0);
  });
});

describe("encodeWav", () => {
  it("writes a valid 16-bit mono header and clamps samples", () => {
    const buffer = encodeWav(new Float32Array([0, 1, -1, 2]), 24000);
    const view = new DataView(buffer);
    const tag = (offset: number) => String.fromCharCode(...new Uint8Array(buffer, offset, 4));
    expect(tag(0)).toBe("RIFF");
    expect(tag(8)).toBe("WAVE");
    expect(view.getUint32(24, true)).toBe(24000);
    expect(view.getUint32(40, true)).toBe(8);
    expect(view.getInt16(46, true)).toBe(0x7fff);
    expect(view.getInt16(48, true)).toBe(-0x8000);
    expect(view.getInt16(50, true)).toBe(0x7fff);
  });
});

describe("level bars", () => {
  it("mirrors the spectrum so loud bands sit in the middle", () => {
    const spectrum = new Uint8Array(128);
    spectrum[0] = 255;
    const bars = barsFromSpectrum(spectrum, 40);
    expect(bars).toHaveLength(40);
    expect(bars[19]).toBe(1);
    expect(bars[20]).toBe(1);
    expect(bars[0]).toBe(0);
  });

  it("eases toward the target", () => {
    expect(easeBars([0, 1], [1, 0], 0.25)).toEqual([0.25, 0.75]);
    expect(overallLevel([0.2, 0.4])).toBeCloseTo(0.3);
  });
});
