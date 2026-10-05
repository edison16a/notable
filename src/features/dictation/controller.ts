import { getAudioContext } from "@/features/audio/context";
import { resample, WHISPER_SAMPLE_RATE } from "@/features/audio/resample";
import { useEditorStore } from "@/features/editor/editorStore";
import { DOWNLOAD_CANCELLED, loadWhisper, transcribe, unloadWhisper } from "@/features/whisper/engine";
import { isTouchDevice } from "@/lib/platform";
import { insertAtCursor } from "./lib/insert";
import { PauseSegmenter } from "./lib/segmenter";
import { cleanTranscript } from "./lib/transcript";
import { MicrophoneError, openMicrophone, type Microphone } from "./microphone";
import { useDictationStore } from "./store";

/*
 * Owns one dictation session: mic, segmenter, and a serial queue of
 * segments waiting for Whisper. Segments are transcribed in order so text
 * always lands in the order it was spoken. `run` guards against a stop (or
 * a second start) arriving while an earlier start is still awaiting.
 */

const set = useDictationStore.setState;
let mic: Microphone | null = null;
let segmenter: PauseSegmenter | null = null;
let queue: Promise<void> = Promise.resolve();
let pending = 0;
let timer: ReturnType<typeof setInterval> | undefined;
let run = 0;

const isListening = () => {
  const { status } = useDictationStore.getState();
  return status === "listening" || status === "silent";
};

function onChunk(chunk: Float32Array) {
  if (!segmenter || !isListening()) return;
  const { segment, silent } = segmenter.feed(chunk);
  const status = silent ? "silent" : "listening";
  if (useDictationStore.getState().status !== status) set({ status });
  if (segment) enqueue(segment, mic!.sampleRate);
}

function enqueue(segment: Float32Array, sampleRate: number) {
  const audio = resample(segment, sampleRate, WHISPER_SAMPLE_RATE);
  pending++;
  queue = queue
    .then(async () => {
      const { text } = await transcribe(audio);
      const editor = useEditorStore.getState().editor;
      if (editor) insertAtCursor(editor, cleanTranscript(text));
    })
    .catch(() => undefined)
    .finally(() => pending--);
}

function release() {
  clearInterval(timer);
  mic?.stop();
  mic = null;
  segmenter = null;
}

export async function startDictation() {
  const current = ++run;
  // Created inside the click so the browser lets audio start.
  void getAudioContext();
  set({ status: "preparing", elapsed: 0, error: null, errorAction: null, downloadProgress: 0 });

  try {
    // Ask for the mic first so the permission prompt appears right away, then fetch the model.
    mic = await openMicrophone(onChunk);
    if (current !== run) return release();
    await loadWhisper((fraction) =>
      set({ status: fraction >= 1 ? "preparing" : "downloading", downloadProgress: fraction }),
    );
    if (current !== run) return release();
  } catch (error) {
    release();
    if (current !== run) return;
    if ((error as Error).message === DOWNLOAD_CANCELLED) return set({ status: "idle" });
    const blocked = error instanceof MicrophoneError && error.reason === "blocked";
    return set({
      status: "error",
      error: error instanceof MicrophoneError ? error.message : "Could not start dictation",
      errorAction: blocked ? "Allow the mic, then try again" : "Try again",
    });
  }

  segmenter = new PauseSegmenter({ sampleRate: mic.sampleRate });
  const startedAt = performance.now();
  timer = setInterval(() => set({ elapsed: (performance.now() - startedAt) / 1000 }), 250);
  set({ status: "listening", analyser: mic.analyser });
}

/**
 * Stops listening, transcribes whatever was still buffered, and waits for
 * the queue to drain before the popup goes away.
 */
export async function stopDictation() {
  const current = ++run;
  const sampleRate = mic?.sampleRate ?? WHISPER_SAMPLE_RATE;
  const tail = segmenter?.flush();
  release();
  if (tail) enqueue(tail, sampleRate);

  if (pending > 0) {
    set({ status: "transcribing" });
    await queue;
  }
  if (current !== run) return;
  set({ status: "idle", analyser: null, elapsed: 0 });
  // Phones keep total model memory near 100 MB, so Whisper only stays loaded while dictating.
  if (isTouchDevice()) unloadWhisper();
}

export function dismissDictationError() {
  run++;
  set({ status: "idle", error: null, errorAction: null });
}
