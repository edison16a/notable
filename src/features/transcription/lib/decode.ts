import { getAudioContext } from "@/features/audio/context";
import { mixToMono, resample, WHISPER_SAMPLE_RATE } from "@/features/audio/resample";

/** Extensions we accept even when the browser reports no MIME type, which happens with m4a on some systems. */
const AUDIO_EXTENSIONS = /\.(mp3|m4a|wav|ogg|oga|webm|aac|flac)$/i;

export function isAudioFile(file: File): boolean {
  return file.type.startsWith("audio/") || AUDIO_EXTENSIONS.test(file.name);
}

/**
 * Decodes any format the browser can play into 16 kHz mono samples for
 * Whisper. The Web Audio decoder handles mp3, m4a, and wav natively, so no
 * codec library is needed.
 */
export async function decodeAudioFile(file: File): Promise<Float32Array> {
  const ctx = await getAudioContext();
  const buffer = await ctx.decodeAudioData(await file.arrayBuffer());
  const channels = Array.from({ length: buffer.numberOfChannels }, (_, i) => buffer.getChannelData(i));
  return resample(mixToMono(channels), buffer.sampleRate, WHISPER_SAMPLE_RATE);
}
