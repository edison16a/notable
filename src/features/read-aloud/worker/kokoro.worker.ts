/// <reference lib="webworker" />
import { KokoroTTS } from "kokoro-js";
import { encodeWav } from "@/features/audio/wav";
import { pickComputeDevice, type ComputeDevice } from "@/lib/compute";
import { serveRpc, withTransfer } from "@/lib/worker/host";

const MODEL_ID = "onnx-community/Kokoro-82M-v1.0-ONNX";

let model: Promise<KokoroTTS> | null = null;
let device: ComputeDevice = "wasm";

type VoiceId = Parameters<KokoroTTS["generate"]>[1] extends { voice?: infer V } | undefined ? V : string;

/**
 * Runs Kokoro off the main thread. WebGPU wants full precision weights while
 * WASM runs best on the 8-bit ones, which are also a quarter of the size.
 * `small` forces the 8-bit model on phones to keep memory near 100 MB.
 */
serveRpc({
  async load({ small }: { small: boolean }, emit) {
    model ??= (async () => {
      device = small ? "wasm" : await pickComputeDevice();
      return KokoroTTS.from_pretrained(MODEL_ID, {
        dtype: device === "webgpu" ? "fp32" : "q8",
        device,
        progress_callback: (progress) => emit("progress", progress),
      });
    })();
    try {
      await model;
    } catch (error) {
      // Forget the failed attempt so a retry starts from scratch.
      model = null;
      throw error;
    }
    return { device };
  },

  async generate({ text, voice }: { text: string; voice: string }) {
    if (!model) throw new Error("Voice model is not loaded");
    const tts = await model;
    const audio = await tts.generate(text, { voice: voice as VoiceId });
    const wav = encodeWav(audio.audio, audio.sampling_rate);
    return withTransfer({ wav, duration: audio.audio.length / audio.sampling_rate }, [wav]);
  },
});
