/** Whisper expects 16 kHz mono audio. */
export const WHISPER_SAMPLE_RATE = 16000;

/**
 * Resamples by averaging the source samples that fall inside each output
 * sample. Averaging acts as a cheap low-pass filter when downsampling from
 * 44.1 or 48 kHz, which is plenty for speech recognition and avoids pulling
 * in a DSP library.
 */
export function resample(input: Float32Array, fromRate: number, toRate: number): Float32Array {
  if (fromRate === toRate) return input;
  const ratio = fromRate / toRate;
  const length = Math.floor(input.length / ratio);
  const output = new Float32Array(length);

  for (let i = 0; i < length; i++) {
    const start = i * ratio;
    const end = Math.min(input.length, start + Math.max(ratio, 1));
    let sum = 0;
    let count = 0;
    for (let j = Math.floor(start); j < end; j++) {
      sum += input[j];
      count++;
    }
    output[i] = count ? sum / count : input[Math.min(input.length - 1, Math.round(start))];
  }
  return output;
}

/** Averages every channel into one, since a stereo recording is still one speaker. */
export function mixToMono(channels: Float32Array[]): Float32Array {
  if (channels.length === 1) return channels[0];
  const length = channels[0].length;
  const mono = new Float32Array(length);
  for (const channel of channels) {
    for (let i = 0; i < length; i++) mono[i] += channel[i] / channels.length;
  }
  return mono;
}

/** Root mean square loudness of a chunk, roughly 0 for silence and 0.1 or more for speech. */
export function rms(samples: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < samples.length; i++) sum += samples[i] * samples[i];
  return samples.length ? Math.sqrt(sum / samples.length) : 0;
}
