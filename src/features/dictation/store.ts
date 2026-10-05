import { create } from "zustand";

export type DictationStatus = "idle" | "downloading" | "preparing" | "listening" | "silent" | "transcribing" | "error";

interface DictationState {
  status: DictationStatus;
  /** Seconds since listening started, for the popup timer. */
  elapsed: number;
  downloadProgress: number;
  analyser: AnalyserNode | null;
  error: string | null;
  /** What the user can do about the error, shown as the popup's text button. */
  errorAction: string | null;
}

export const useDictationStore = create<DictationState>(() => ({
  status: "idle",
  elapsed: 0,
  downloadProgress: 0,
  analyser: null,
  error: null,
  errorAction: null,
}));
