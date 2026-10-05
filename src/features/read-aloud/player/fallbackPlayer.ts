import type { SpeakableSentence } from "../lib/extract";
import { estimateDuration, locate, startTimes, totalLength, type TimedItem } from "../lib/timeline";
import type { Player, PlayerCallbacks } from "./types";

type Item = SpeakableSentence & TimedItem;

/**
 * Reads with the browser's built-in speechSynthesis voice when Kokoro cannot
 * load. It cannot scrub inside a sentence or feed the level graph, so jumps
 * land on sentence starts and the popup pulses instead. Word highlights come
 * from the engine's own boundary events, which are exact where supported.
 */
export class FallbackPlayer implements Player {
  private items: Item[] = [];
  private index = 0;
  private rate = 1;
  private session = 0;
  private startedAt = 0;
  private timer: ReturnType<typeof setInterval> | undefined;

  constructor(private readonly cb: PlayerCallbacks) {}

  load(sentences: SpeakableSentence[], startIndex: number) {
    this.halt();
    this.items = sentences.map((sentence) => ({ ...sentence, duration: null }));
    this.index = startIndex;
    this.emitTime(0);
  }

  play() {
    this.speak(this.index);
  }

  pause() {
    // speechSynthesis.pause() is unreliable across browsers, so pausing stops and resumes at the sentence start.
    this.halt();
    this.cb.onStatus("paused");
  }

  seek(time: number) {
    this.speak(locate(this.items, time).index);
  }

  seekToPosition(pos: number) {
    const index = this.items.findIndex((item) => pos <= item.to);
    if (index !== -1) this.speak(index);
  }

  next() {
    if (this.index + 1 < this.items.length) this.speak(this.index + 1);
  }

  previous() {
    this.speak(Math.max(0, this.index - 1));
  }

  setRate(rate: number) {
    this.rate = rate;
  }

  setVoice() {
    // The browser voice is fixed. Kokoro voices do not apply here.
  }

  stop() {
    this.halt();
    this.cb.onHighlight(null);
  }

  private halt() {
    this.session++;
    clearInterval(this.timer);
    speechSynthesis.cancel();
  }

  private speak(index: number) {
    this.halt();
    const item = this.items[index];
    if (!item) {
      this.cb.onHighlight(null);
      return this.cb.onEnd();
    }
    const session = this.session;
    this.index = index;
    const utterance = new SpeechSynthesisUtterance(item.text);
    utterance.rate = this.rate;
    utterance.onboundary = (event) => {
      if (session !== this.session || event.name !== "word") return;
      const length = event.charLength || item.text.slice(event.charIndex).search(/\s|$/);
      this.cb.onHighlight({
        sentence: { from: item.from, to: item.to },
        word: { from: item.from + event.charIndex, to: item.from + event.charIndex + length },
      });
    };
    utterance.onend = () => {
      if (session !== this.session) return;
      item.duration = (performance.now() - this.startedAt) / 1000 * this.rate;
      setTimeout(() => session === this.session && this.speak(index + 1), (item.pauseAfter / this.rate) * 1000);
    };
    utterance.onerror = (event) => {
      if (session === this.session && event.error !== "interrupted" && event.error !== "canceled") {
        this.cb.onError(new Error("The browser voice stopped"));
      }
    };

    this.cb.onHighlight({ sentence: { from: item.from, to: item.to }, word: null });
    this.startedAt = performance.now();
    speechSynthesis.speak(utterance);
    this.cb.onStatus("reading");
    this.timer = setInterval(() => {
      const spoken = ((performance.now() - this.startedAt) / 1000) * this.rate;
      this.emitTime(Math.min(spoken, item.duration ?? estimateDuration(item.text)));
    }, 200);
  }

  private emitTime(within: number) {
    this.cb.onTime((startTimes(this.items)[this.index] ?? 0) + within, totalLength(this.items));
  }
}
