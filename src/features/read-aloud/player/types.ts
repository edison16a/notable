import type { SpeechHighlight } from "../highlight";
import type { SpeakableSentence } from "../lib/extract";
import type { ReadStatus } from "../store";

export interface PlayerCallbacks {
  onStatus(status: Exclude<ReadStatus, "idle">): void;
  onTime(elapsed: number, total: number): void;
  onHighlight(highlight: SpeechHighlight | null): void;
  onDownload(fraction: number): void;
  onError(error: Error): void;
  onEnd(): void;
}

/**
 * The controls shared by the Kokoro player and the speechSynthesis fallback,
 * so the controller can swap one for the other without the UI noticing.
 */
export interface Player {
  load(sentences: SpeakableSentence[], startIndex: number): void;
  play(): void;
  pause(): void;
  /** Jumps to a time on the 1x timeline. */
  seek(time: number): void;
  /** Jumps to the sentence and word at a document position, used when a word is clicked. */
  seekToPosition(pos: number): void;
  next(): void;
  previous(): void;
  setRate(rate: number): void;
  setVoice(voice: string): void;
  stop(): void;
}
