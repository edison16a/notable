import type { KokoroEngine } from "../engine/kokoroEngine";
import type { SpeakableSentence } from "../lib/extract";
import type { TimedItem } from "../lib/timeline";

export interface QueueItem extends SpeakableSentence, TimedItem {
  pending: Promise<string> | null;
  url: string | null;
}

/** How many sentences to generate ahead of the one playing. Hides slow WASM generation on phones. */
const LOOKAHEAD = 2;

/**
 * Owns the sentence list and the audio for each sentence. Generation happens
 * on demand and is shared, so a sentence requested by both prefetch and a
 * seek is only generated once. Durations fill in as clips arrive, which is
 * what makes the timeline sharpen from an estimate into the real length.
 */
export class ClipQueue {
  items: QueueItem[] = [];
  private voice: string;
  /** Bumped whenever audio is discarded, so a clip that finishes late is dropped instead of leaking a URL. */
  private generation = 0;

  constructor(
    private readonly engine: KokoroEngine,
    voice: string,
    private readonly onDurationsChanged: () => void,
  ) {
    this.voice = voice;
  }

  reset(sentences: SpeakableSentence[]) {
    this.dispose();
    this.items = sentences.map((sentence) => ({ ...sentence, duration: null, pending: null, url: null }));
  }

  /** Object URL for a sentence's audio, generating it first if needed. */
  url(index: number): Promise<string> {
    const item = this.items[index];
    if (!item) return Promise.reject(new Error("No sentence there"));
    const voice = this.voice;
    const generation = this.generation;
    item.pending ??= this.engine.synthesize(item.text, voice).then(
      (clip) => {
        if (generation !== this.generation) throw new Error("Reading was stopped");
        // The voice may have changed while this was generating. Drop the stale clip.
        if (voice !== this.voice) return this.url(index);
        item.duration = clip.duration;
        item.url = URL.createObjectURL(clip.blob);
        this.onDurationsChanged();
        return item.url;
      },
      (error) => {
        item.pending = null;
        throw error;
      },
    );
    return item.pending;
  }

  prefetch(index: number) {
    for (let i = index + 1; i <= index + LOOKAHEAD && i < this.items.length; i++) {
      this.url(i).catch(() => undefined);
    }
  }

  setVoice(voice: string) {
    this.voice = voice;
    this.dispose();
    for (const item of this.items) {
      item.pending = null;
      item.url = null;
      item.duration = null;
    }
  }

  dispose() {
    this.generation++;
    for (const item of this.items) if (item.url) URL.revokeObjectURL(item.url);
  }
}
