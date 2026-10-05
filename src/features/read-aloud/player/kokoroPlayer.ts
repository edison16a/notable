import type { KokoroEngine } from "../engine/kokoroEngine";
import type { SpeakableSentence } from "../lib/extract";
import { fractionAtOffset, wordAtFraction } from "../lib/sentences";
import { estimateDuration, locate, startTimes, totalLength } from "../lib/timeline";
import { ClipQueue } from "./clipQueue";
import type { Player, PlayerCallbacks } from "./types";

/** Going back within this many seconds of a sentence's start goes to the previous one instead of restarting. */
const RESTART_WINDOW = 1.5;

/**
 * Plays Kokoro clips one sentence at a time through a single audio element.
 * One element (rather than one per clip) is what lets Media Session and the
 * Web Audio analyser stay attached for the whole session.
 *
 * `session` is bumped on every jump. Async work checks it when it resumes
 * and quietly gives up if the user has moved on in the meantime.
 */
export class KokoroPlayer implements Player {
  readonly audio = new Audio();
  private queue: ClipQueue;
  private index = 0;
  private loadedIndex = -1;
  private wantPlaying = false;
  private session = 0;
  private frame = 0;
  private gapTimer: ReturnType<typeof setTimeout> | undefined;
  private rate = 1;
  private lastWordStart = -1;

  constructor(engine: KokoroEngine, private readonly cb: PlayerCallbacks, voice: string) {
    this.queue = new ClipQueue(engine, voice, () => this.emitTime());
    this.audio.preservesPitch = true;
    this.audio.addEventListener("ended", () => this.onEnded());
    engine.onDownload = (fraction) => {
      cb.onStatus("downloading");
      cb.onDownload(fraction);
    };
  }

  load(sentences: SpeakableSentence[], startIndex: number) {
    this.halt();
    this.queue.reset(sentences);
    this.index = startIndex;
    this.loadedIndex = -1;
    this.emitTime();
  }

  play() {
    this.wantPlaying = true;
    if (this.loadedIndex === this.index && !this.audio.ended && this.audio.src) {
      void this.audio.play().then(() => this.startTicking());
      this.cb.onStatus("reading");
    } else {
      void this.playFrom(this.audio.ended ? this.index + 1 : this.index, 0);
    }
  }

  pause() {
    this.wantPlaying = false;
    clearTimeout(this.gapTimer);
    this.audio.pause();
    cancelAnimationFrame(this.frame);
    this.cb.onStatus("paused");
  }

  seek(time: number) {
    const { index, offset } = locate(this.queue.items, time);
    void this.playFrom(index, offset);
  }

  seekToPosition(pos: number) {
    const items = this.queue.items;
    let index = items.findIndex((item) => pos >= item.from && pos <= item.to);
    if (index === -1) index = items.findIndex((item) => item.from > pos);
    if (index === -1) return;
    const item = items[index];
    const length = item.duration ?? estimateDuration(item.text);
    void this.playFrom(index, fractionAtOffset(item.text, pos - item.from) * length);
  }

  next() {
    if (this.index + 1 < this.queue.items.length) void this.playFrom(this.index + 1, 0);
  }

  previous() {
    const restart = this.loadedIndex === this.index && this.audio.currentTime > RESTART_WINDOW;
    void this.playFrom(restart ? this.index : Math.max(0, this.index - 1), 0);
  }

  setRate(rate: number) {
    this.rate = rate;
    this.audio.playbackRate = rate;
  }

  setVoice(voice: string) {
    this.queue.setVoice(voice);
    this.loadedIndex = -1;
    if (this.wantPlaying) void this.playFrom(this.index, 0);
  }

  stop() {
    this.halt();
    this.queue.dispose();
    this.cb.onHighlight(null);
  }

  private halt() {
    this.session++;
    this.wantPlaying = false;
    clearTimeout(this.gapTimer);
    cancelAnimationFrame(this.frame);
    this.audio.pause();
    this.audio.removeAttribute("src");
    this.lastWordStart = -1;
  }

  private async playFrom(index: number, offset: number) {
    const session = ++this.session;
    clearTimeout(this.gapTimer);
    cancelAnimationFrame(this.frame);
    this.audio.pause();
    if (index >= this.queue.items.length) return this.finish();

    this.index = index;
    this.highlight(offset);
    this.emitTime();
    if (!this.queue.items[index].url) this.cb.onStatus("preparing");

    let url: string;
    try {
      url = await this.queue.url(index);
    } catch (error) {
      if (session === this.session) this.cb.onError(error as Error);
      return;
    }
    if (session !== this.session) return;

    this.audio.src = url;
    this.loadedIndex = index;
    this.audio.playbackRate = this.rate;
    if (offset > 0) {
      await new Promise((resolve) => this.audio.addEventListener("loadedmetadata", resolve, { once: true }));
      if (session !== this.session) return;
      this.audio.currentTime = offset;
    }
    this.queue.prefetch(index);

    if (!this.wantPlaying) return this.cb.onStatus("paused");
    try {
      await this.audio.play();
    } catch {
      // Autoplay was blocked, usually after a long generation outlived the click. Wait for the play button.
      if (session === this.session) this.pause();
      return;
    }
    if (session !== this.session) return;
    this.cb.onStatus("reading");
    this.startTicking();
  }

  private onEnded() {
    cancelAnimationFrame(this.frame);
    const item = this.queue.items[this.index];
    const gap = ((item?.pauseAfter ?? 0) / this.rate) * 1000;
    this.gapTimer = setTimeout(() => void this.playFrom(this.index + 1, 0), gap);
  }

  private finish() {
    this.halt();
    this.cb.onHighlight(null);
    this.cb.onEnd();
  }

  /** Per-frame updates while audio plays: the word highlight and the timeline position. */
  private startTicking() {
    cancelAnimationFrame(this.frame);
    const tick = () => {
      if (this.audio.paused) return;
      this.highlight(this.audio.currentTime);
      this.emitTime();
      this.frame = requestAnimationFrame(tick);
    };
    this.frame = requestAnimationFrame(tick);
  }

  private highlight(offset: number) {
    const item = this.queue.items[this.index];
    if (!item) return;
    const length = item.duration ?? estimateDuration(item.text);
    const word = wordAtFraction(item.text, offset / length);
    const wordStart = item.from + (word?.start ?? 0);
    if (wordStart === this.lastWordStart) return;
    this.lastWordStart = wordStart;
    this.cb.onHighlight({
      sentence: { from: item.from, to: item.to },
      word: word ? { from: item.from + word.start, to: item.from + word.end } : null,
    });
  }

  private emitTime() {
    const items = this.queue.items;
    const start = startTimes(items)[this.index] ?? 0;
    const within = this.loadedIndex === this.index ? this.audio.currentTime || 0 : 0;
    this.cb.onTime(start + within, totalLength(items));
  }
}
