import { afterEach, describe, expect, it, vi } from "vitest";
import { debounce } from "./debounce";
import { formatTime } from "./format-time";
import { DownloadProgress } from "./worker/progress";

describe("formatTime", () => {
  it("formats minutes and padded seconds", () => {
    expect(formatTime(0)).toBe("0:00");
    expect(formatTime(42.9)).toBe("0:42");
    expect(formatTime(190)).toBe("3:10");
  });

  it("treats bad input as zero", () => {
    expect(formatTime(Number.NaN)).toBe("0:00");
    expect(formatTime(-5)).toBe("0:00");
  });
});

describe("debounce", () => {
  afterEach(() => vi.useRealTimers());

  it("runs once with the latest arguments after the wait", () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const debounced = debounce(fn, 500);
    debounced(1);
    debounced(2);
    vi.advanceTimersByTime(499);
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(fn).toHaveBeenCalledExactlyOnceWith(2);
  });

  it("flushes a pending call right away", () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const debounced = debounce(fn, 500);
    debounced("a");
    debounced.flush();
    expect(fn).toHaveBeenCalledWith("a");
    vi.advanceTimersByTime(1000);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

describe("DownloadProgress", () => {
  it("sums bytes across files", () => {
    const progress = new DownloadProgress();
    progress.update({ status: "progress", file: "a", loaded: 50, total: 100 });
    expect(progress.update({ status: "progress", file: "b", loaded: 0, total: 300 })).toBe(0.125);
    expect(progress.downloading).toBe(true);
    progress.update({ status: "done", file: "a" });
    expect(progress.update({ status: "done", file: "b" })).toBe(1);
    expect(progress.downloading).toBe(false);
  });

  it("reports nothing for a model loaded from cache", () => {
    const progress = new DownloadProgress();
    progress.update({ status: "ready" });
    expect(progress.fraction).toBe(0);
    expect(progress.downloading).toBe(false);
  });
});
