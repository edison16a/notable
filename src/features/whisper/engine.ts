import { allowModelDownload, markModelReady } from "@/features/models/downloadPrompt";
import { isTouchDevice } from "@/lib/platform";
import { WorkerClient } from "@/lib/worker/client";
import { DownloadProgress, type ModelProgressEvent } from "@/lib/worker/progress";
import { WHISPER_MODELS, useWhisperSettings } from "./settings";

export interface TranscriptChunk {
  start: number;
  end: number | null;
  text: string;
}

export interface Transcript {
  text: string;
  chunks: TranscriptChunk[];
}

export const DOWNLOAD_CANCELLED = "Download cancelled";

const client = new WorkerClient(
  () => new Worker(new URL("./worker/whisper.worker.ts", import.meta.url), { type: "module" }),
);

/**
 * Loads the Whisper model picked in settings. `onDownload` hears progress
 * only when files actually come over the network, so a cached model goes
 * straight to listening without flashing a progress bar.
 */
export async function loadWhisper(onDownload: (fraction: number) => void): Promise<void> {
  const choice = WHISPER_MODELS[useWhisperSettings.getState().quality];
  if (!(await allowModelDownload(choice.id, `the ${choice.label.toLowerCase()} speech model`, choice.size))) {
    throw new Error(DOWNLOAD_CANCELLED);
  }
  const progress = new DownloadProgress();
  const off = client.on("progress", (event) => {
    const fraction = progress.update(event as ModelProgressEvent);
    if (progress.downloading || fraction === 1) onDownload(fraction);
  });
  try {
    await client.call("load", { model: choice.id, small: isTouchDevice() });
    await markModelReady(choice.id);
  } finally {
    off();
  }
}

/** Transcribes 16 kHz mono audio. The buffer is transferred to the worker, so callers must not reuse it. */
export function transcribe(audio: Float32Array, timestamps = false): Promise<Transcript> {
  return client.call<Transcript>("transcribe", { audio, timestamps }, [audio.buffer]);
}

/** Frees Whisper's memory. Phones call this when dictation stops, since memory there is tight. */
export function unloadWhisper() {
  client.terminate();
}
