let context: AudioContext | null = null;

/**
 * One shared AudioContext for the whole app. Browsers cap how many can exist
 * and each one costs a real audio thread, so dictation, playback, and file
 * decoding all borrow this one. It must first be resumed from a user gesture,
 * which every caller here is.
 */
export async function getAudioContext(): Promise<AudioContext> {
  context ??= new AudioContext({ latencyHint: "interactive" });
  if (context.state === "suspended") await context.resume();
  return context;
}

/** An analyser tuned for the popup bars: small FFT, light smoothing so speech still looks lively. */
export function createLevelAnalyser(ctx: AudioContext): AnalyserNode {
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 256;
  analyser.smoothingTimeConstant = 0.6;
  analyser.minDecibels = -85;
  analyser.maxDecibels = -20;
  return analyser;
}
