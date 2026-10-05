import { create } from "zustand";
import { getMeta, setMeta } from "@/features/storage/repository";

export type WhisperQuality = "fast" | "accurate";

/** English-only checkpoints: smaller and more accurate than the multilingual ones for English. */
export const WHISPER_MODELS: Record<WhisperQuality, { id: string; label: string; size: string }> = {
  fast: { id: "onnx-community/whisper-tiny.en", label: "Fast", size: "40 MB" },
  accurate: { id: "onnx-community/whisper-base.en", label: "Accurate", size: "80 MB" },
};

const SETTINGS_KEY = "whisperSettings";

interface WhisperSettings {
  quality: WhisperQuality;
  /** Prefix each transcribed line with its start time, for audio file transcription. */
  timestamps: boolean;
}

interface SettingsState extends WhisperSettings {
  hydrate(): Promise<void>;
  setQuality(quality: WhisperQuality): void;
  setTimestamps(timestamps: boolean): void;
}

export const useWhisperSettings = create<SettingsState>((set, get) => {
  const save = () => {
    const { quality, timestamps } = get();
    void setMeta(SETTINGS_KEY, { quality, timestamps } satisfies WhisperSettings);
  };
  return {
    quality: "fast",
    timestamps: false,
    async hydrate() {
      const saved = await getMeta<WhisperSettings>(SETTINGS_KEY);
      if (saved) set(saved);
    },
    setQuality(quality) {
      set({ quality });
      save();
    },
    setTimestamps(timestamps) {
      set({ timestamps });
      save();
    },
  };
});
