import { rms } from "@/features/audio/resample";

export interface SegmenterOptions {
  sampleRate: number;
  /** Quiet time after speech that ends a segment. About one second feels natural. */
  pauseMs?: number;
  /** Quiet time with no speech at all before we warn that we cannot hear anything. */
  silentWarningMs?: number;
  /** Segments are cut at this length even mid-sentence, since Whisper works on 30 second windows. */
  maxSegmentMs?: number;
}

export interface SegmenterResult {
  /** A finished stretch of speech ready to transcribe, if one just ended. */
  segment: Float32Array | null;
  /** True while nothing has been heard for `silentWarningMs`. */
  silent: boolean;
}

const MIN_SPEECH_MS = 250;
const PRE_ROLL_MS = 300;

/**
 * Splits a live microphone stream into utterances at natural pauses, so text
 * can appear segment by segment instead of all at the end.
 *
 * Speech detection compares each chunk's loudness to a slowly tracked noise
 * floor rather than a fixed level, which copes with quiet rooms and noisy
 * cafes alike. A short pre-roll keeps the first syllable from being clipped.
 */
export class PauseSegmenter {
  private readonly pauseMs: number;
  private readonly silentWarningMs: number;
  private readonly maxSegmentMs: number;
  private chunks: Float32Array[] = [];
  private preRoll: Float32Array[] = [];
  private speechMs = 0;
  private quietMs = 0;
  private sinceSpeechMs = 0;
  private noiseFloor = 0.004;

  constructor(private readonly options: SegmenterOptions) {
    this.pauseMs = options.pauseMs ?? 1000;
    this.silentWarningMs = options.silentWarningMs ?? 3000;
    this.maxSegmentMs = options.maxSegmentMs ?? 25000;
  }

  feed(chunk: Float32Array): SegmenterResult {
    const ms = (chunk.length / this.options.sampleRate) * 1000;
    const level = rms(chunk);
    const isSpeech = level > Math.max(0.01, this.noiseFloor * 3);
    if (!isSpeech) this.noiseFloor = this.noiseFloor * 0.95 + level * 0.05;

    let segment: Float32Array | null = null;
    if (isSpeech) {
      if (!this.chunks.length) this.chunks.push(...this.preRoll);
      this.chunks.push(chunk);
      this.speechMs += ms;
      this.quietMs = 0;
      this.sinceSpeechMs = 0;
    } else {
      this.sinceSpeechMs += ms;
      if (this.chunks.length) {
        this.chunks.push(chunk);
        this.quietMs += ms;
        if (this.quietMs >= this.pauseMs) segment = this.take();
      } else {
        this.rememberPreRoll(chunk, ms);
      }
    }

    if (!segment && this.lengthMs() >= this.maxSegmentMs) segment = this.take();
    return { segment, silent: this.sinceSpeechMs >= this.silentWarningMs };
  }

  /** Hands back whatever speech is buffered, used when dictation stops mid-sentence. */
  flush(): Float32Array | null {
    return this.chunks.length ? this.take() : null;
  }

  private take(): Float32Array | null {
    const enoughSpeech = this.speechMs >= MIN_SPEECH_MS;
    const merged = enoughSpeech ? concat(this.chunks) : null;
    this.chunks = [];
    this.preRoll = [];
    this.speechMs = 0;
    this.quietMs = 0;
    return merged;
  }

  private rememberPreRoll(chunk: Float32Array, ms: number) {
    this.preRoll.push(chunk);
    const perChunk = ms || 1;
    while (this.preRoll.length * perChunk > PRE_ROLL_MS) this.preRoll.shift();
  }

  private lengthMs(): number {
    const samples = this.chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    return (samples / this.options.sampleRate) * 1000;
  }
}

function concat(chunks: Float32Array[]): Float32Array {
  const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const out = new Float32Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  return out;
}
