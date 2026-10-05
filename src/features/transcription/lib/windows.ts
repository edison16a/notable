export interface AudioWindow {
  /** Start of this window in the original recording, in seconds. */
  start: number;
  audio: Float32Array;
}

/**
 * Cuts a long recording into back-to-back windows. Whisper's context is 30
 * seconds, and transcribing one window at a time is what lets the popup show
 * steady progress on an hour-long file. Each window is a copy, because its
 * buffer is transferred to the worker and would otherwise detach the source.
 */
export function splitWindows(samples: Float32Array, sampleRate: number, seconds = 30): AudioWindow[] {
  const size = Math.max(1, Math.floor(sampleRate * seconds));
  const windows: AudioWindow[] = [];
  for (let offset = 0; offset < samples.length; offset += size) {
    windows.push({ start: offset / sampleRate, audio: samples.slice(offset, offset + size) });
  }
  return windows;
}
