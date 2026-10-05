import { createLevelAnalyser, getAudioContext } from "@/features/audio/context";

export interface Microphone {
  analyser: AnalyserNode;
  sampleRate: number;
  stop(): void;
}

export class MicrophoneError extends Error {
  constructor(
    message: string,
    /** "blocked" means the user or the browser denied access, which only browser settings can fix. */
    readonly reason: "blocked" | "missing" | "unknown",
  ) {
    super(message);
  }
}

/**
 * Opens the mic and streams raw samples to `onChunk` through an AudioWorklet.
 * The same source also feeds an analyser for the popup's live bars. Samples
 * stay at the device rate here and are resampled to 16 kHz per segment.
 */
export async function openMicrophone(onChunk: (samples: Float32Array) => void): Promise<Microphone> {
  const ctx = await getAudioContext();
  let stream: MediaStream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    });
  } catch (error) {
    const name = (error as DOMException).name;
    if (name === "NotAllowedError" || name === "SecurityError") {
      throw new MicrophoneError("Microphone is blocked", "blocked");
    }
    if (name === "NotFoundError") throw new MicrophoneError("No microphone found", "missing");
    throw new MicrophoneError("Could not open the microphone", "unknown");
  }

  await ctx.audioWorklet.addModule("/worklets/pcm-capture.js");
  const source = ctx.createMediaStreamSource(stream);
  const analyser = createLevelAnalyser(ctx);
  const capture = new AudioWorkletNode(ctx, "pcm-capture");
  // A silent sink keeps the worklet pulled by the graph without playing the mic back.
  const sink = ctx.createGain();
  sink.gain.value = 0;

  source.connect(analyser);
  source.connect(capture);
  capture.connect(sink).connect(ctx.destination);
  capture.port.onmessage = (event: MessageEvent<Float32Array>) => onChunk(event.data);

  return {
    analyser,
    sampleRate: ctx.sampleRate,
    stop() {
      capture.port.onmessage = null;
      source.disconnect();
      capture.disconnect();
      sink.disconnect();
      stream.getTracks().forEach((track) => track.stop());
    },
  };
}
