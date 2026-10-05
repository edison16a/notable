/**
 * Turns analyser frequency data into bar heights between 0 and 1. Only the
 * lower part of the spectrum is used because that is where speech lives, and
 * the result is mirrored so the loudest bands sit in the middle like a
 * voice memo graph.
 */
export function barsFromSpectrum(spectrum: Uint8Array, barCount: number): number[] {
  const half = Math.ceil(barCount / 2);
  const usable = Math.max(1, Math.floor(spectrum.length * 0.6));
  const side: number[] = [];
  for (let i = 0; i < half; i++) {
    const from = Math.floor((i / half) * usable);
    const to = Math.max(from + 1, Math.floor(((i + 1) / half) * usable));
    let peak = 0;
    for (let j = from; j < to; j++) peak = Math.max(peak, spectrum[j]);
    side.push(peak / 255);
  }
  const mirrored = [...side].reverse().concat(side);
  return mirrored.slice(0, barCount);
}

/** Eases each bar toward its target so the graph glides instead of flickering. */
export function easeBars(current: number[], target: number[], factor: number): number[] {
  return target.map((value, index) => {
    const from = current[index] ?? 0;
    return from + (value - from) * factor;
  });
}

/** Average of the bars, used for the reduced-motion level meter. */
export function overallLevel(bars: number[]): number {
  return bars.length ? bars.reduce((sum, value) => sum + value, 0) / bars.length : 0;
}
