import { allowModelDownload, markModelReady } from "@/features/models/downloadPrompt";
import { clipKey, readClip, writeClip } from "@/features/storage/audio-db";
import { isTouchDevice } from "@/lib/platform";
import { WorkerClient } from "@/lib/worker/client";
import { DownloadProgress, type ModelProgressEvent } from "@/lib/worker/progress";

export interface Clip {
  blob: Blob;
  duration: number;
}

export type ProgressListener = (fraction: number) => void;

const MODEL_KEY = "kokoro";
export const DOWNLOAD_CANCELLED = "Download cancelled";

/**
 * Turns a sentence into audio. Every clip is cached by voice and text in
 * IndexedDB, so replays, scrubbing back, and re-reading an unchanged doc are
 * instant and never wake the model. The model itself only loads on the first
 * cache miss.
 */
export class KokoroEngine {
  private readonly client = new WorkerClient(
    () => new Worker(new URL("../worker/kokoro.worker.ts", import.meta.url), { type: "module" }),
  );
  private loading: Promise<void> | null = null;
  /** Called with download progress while the model files come over the network. */
  onDownload: ProgressListener | null = null;
  /** Set when the model itself failed to load, which is the cue to switch to the fallback voice. */
  loadFailed = false;

  async synthesize(text: string, voice: string): Promise<Clip> {
    const key = clipKey(voice, text);
    const cached = await readClip(key);
    if (cached) return { blob: cached.wav, duration: cached.duration };

    await this.ensureLoaded();
    const result = await this.client.call<{ wav: ArrayBuffer; duration: number }>("generate", { text, voice });
    const blob = new Blob([result.wav], { type: "audio/wav" });
    void writeClip({ key, wav: blob, duration: result.duration, createdAt: Date.now() });
    return { blob, duration: result.duration };
  }

  /** Loads the model once. A failed load is forgotten so the next attempt retries. */
  ensureLoaded(): Promise<void> {
    this.loading ??= this.load().catch((error: Error) => {
      this.loading = null;
      this.loadFailed = error.message !== DOWNLOAD_CANCELLED;
      throw error;
    });
    return this.loading;
  }

  private async load() {
    if (!(await allowModelDownload(MODEL_KEY, "the reading voice", "90 MB"))) {
      throw new Error(DOWNLOAD_CANCELLED);
    }
    const progress = new DownloadProgress();
    const off = this.client.on("progress", (event) => {
      const fraction = progress.update(event as ModelProgressEvent);
      if (progress.downloading) this.onDownload?.(fraction);
    });
    try {
      await this.client.call("load", { small: isTouchDevice() });
      await markModelReady(MODEL_KEY);
    } finally {
      off();
    }
  }
}
