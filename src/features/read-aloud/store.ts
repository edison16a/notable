import { create } from "zustand";
import { DEFAULT_VOICE } from "./voices";

export type ReadStatus = "idle" | "downloading" | "preparing" | "reading" | "paused" | "error";

/** What the playback bar and popup render. The player writes here, components only read. */
interface ReadAloudState {
  status: ReadStatus;
  /** Seconds at 1x. The UI divides by `rate` to show real listening time. */
  elapsed: number;
  total: number;
  rate: number;
  voice: string;
  downloadProgress: number;
  error: string | null;
  analyser: AnalyserNode | null;
  /** True when Kokoro could not load and the browser's own voice is reading instead. */
  usingFallback: boolean;
}

export const useReadAloudStore = create<ReadAloudState>(() => ({
  status: "idle",
  elapsed: 0,
  total: 0,
  rate: 1,
  voice: DEFAULT_VOICE,
  downloadProgress: 0,
  error: null,
  analyser: null,
  usingFallback: false,
}));

export const isReadAloudActive = (status: ReadStatus) => status !== "idle";
