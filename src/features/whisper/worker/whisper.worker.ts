/// <reference lib="webworker" />
import { pipeline } from "@huggingface/transformers";
import { pickComputeDevice } from "@/lib/compute";
import { serveRpc } from "@/lib/worker/host";

interface TranscriptChunk {
  start: number;
  end: number | null;
  text: string;
}

/** Narrow call signature for the speech recognition pipeline. The library's own types are too broad to be useful here. */
type Recognizer = (
  audio: Float32Array,
  options: { return_timestamps?: boolean; chunk_length_s?: number },
) => Promise<{ text: string; chunks?: Array<{ timestamp: [number, number | null]; text: string }> }>;

let current: { model: string; recognizer: Promise<Recognizer> } | null = null;

/**
 * Runs Whisper off the main thread. On WebGPU the encoder stays in full
 * precision (it is sensitive to quantization) while the decoder uses 4-bit
 * weights. On WASM both use 8-bit weights, which is the fastest CPU option.
 */
serveRpc({
  async load({ model, small }: { model: string; small: boolean }, emit) {
    if (current?.model !== model) {
      const recognizer = (async () => {
        const device = small ? "wasm" : await pickComputeDevice();
        const asr = await pipeline("automatic-speech-recognition", model, {
          device,
          dtype: device === "webgpu" ? { encoder_model: "fp32", decoder_model_merged: "q4" } : "q8",
          progress_callback: (progress: unknown) => emit("progress", progress),
        });
        return asr as unknown as Recognizer;
      })();
      current = { model, recognizer };
    }
    try {
      await current.recognizer;
    } catch (error) {
      current = null;
      throw error;
    }
    return true;
  },

  async transcribe({ audio, timestamps }: { audio: Float32Array; timestamps: boolean }) {
    if (!current) throw new Error("Speech model is not loaded");
    const recognize = await current.recognizer;
    const output = await recognize(audio, { return_timestamps: timestamps, chunk_length_s: 30 });
    const chunks: TranscriptChunk[] = (output.chunks ?? []).map((chunk) => ({
      start: chunk.timestamp[0],
      end: chunk.timestamp[1],
      text: chunk.text,
    }));
    return { text: output.text, chunks };
  },
});
