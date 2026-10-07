import { useTabsStore } from "@/features/tabs/store";
import { DOWNLOAD_CANCELLED, loadWhisper, transcribe, unloadWhisper } from "@/features/whisper/engine";
import { useWhisperSettings } from "@/features/whisper/settings";
import { WHISPER_SAMPLE_RATE } from "@/features/audio/resample";
import { isTouchDevice } from "@/lib/platform";
import { decodeAudioFile, isAudioFile } from "./lib/decode";
import { transcriptToDoc, type WindowTranscript } from "./lib/toDoc";
import { splitWindows } from "./lib/windows";
import { useTranscriptionStore } from "./store";

const set = useTranscriptionStore.setState;
let run = 0;

/**
 * Transcribes an audio file into a new tab. Windows are processed one at a
 * time so progress is real and Cancel takes effect between windows.
 */
export async function transcribeFile(file: File) {
  if (!isAudioFile(file)) {
    set({ status: "error", fileName: file.name, error: "That file is not audio" });
    return;
  }
  const current = ++run;
  const cancelled = () => current !== run;
  set({ status: "decoding", fileName: file.name, progress: 0, error: null });

  try {
    const samples = await decodeAudioFile(file);
    if (cancelled()) return;
    await loadWhisper((fraction) => {
      if (!cancelled()) set({ status: fraction >= 1 ? "decoding" : "downloading", progress: fraction });
    });
    if (cancelled()) return;

    const timestamps = useWhisperSettings.getState().timestamps;
    const windows = splitWindows(samples, WHISPER_SAMPLE_RATE);
    const results: WindowTranscript[] = [];
    set({ status: "transcribing", progress: 0 });

    for (const [index, window] of windows.entries()) {
      const transcript = await transcribe(window.audio, timestamps);
      if (cancelled()) return;
      results.push({ start: window.start, transcript });
      set({ progress: (index + 1) / windows.length });
    }

    await useTabsStore.getState().addTabWithDoc(transcriptToDoc(file.name, results, timestamps));
    set({ status: "idle", progress: 0 });
  } catch (error) {
    if (cancelled()) return;
    if ((error as Error).message === DOWNLOAD_CANCELLED) return set({ status: "idle" });
    set({ status: "error", error: "Could not transcribe this file" });
  } finally {
    if (isTouchDevice() && !cancelled()) unloadWhisper();
  }
}

export function cancelTranscription() {
  run++;
  set({ status: "idle", progress: 0, error: null });
}

/** Opens the system file picker for audio, used by the doc menu. */
export function pickAudioFile() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "audio/*,.mp3,.m4a,.wav";
  input.onchange = () => {
    const file = input.files?.[0];
    if (file) void transcribeFile(file);
  };
  input.click();
}
