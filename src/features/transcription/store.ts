import { create } from "zustand";

export type TranscriptionStatus = "idle" | "downloading" | "decoding" | "transcribing" | "error";

interface TranscriptionState {
  status: TranscriptionStatus;
  fileName: string;
  /** 0 to 1: download progress while downloading, windows done while transcribing. */
  progress: number;
  error: string | null;
}

export const useTranscriptionStore = create<TranscriptionState>(() => ({
  status: "idle",
  fileName: "",
  progress: 0,
  error: null,
}));
