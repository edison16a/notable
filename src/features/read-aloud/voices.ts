export interface VoiceOption {
  id: string;
  name: string;
  accent: "American" | "British";
  gender: "Female" | "Male";
}

/**
 * A short curated list from Kokoro's voices, picked for clarity over
 * novelty. Two per accent and gender keeps the picker small enough to scan.
 */
export const VOICES: VoiceOption[] = [
  { id: "af_heart", name: "Heart", accent: "American", gender: "Female" },
  { id: "af_bella", name: "Bella", accent: "American", gender: "Female" },
  { id: "am_michael", name: "Michael", accent: "American", gender: "Male" },
  { id: "am_fenrir", name: "Fenrir", accent: "American", gender: "Male" },
  { id: "bf_emma", name: "Emma", accent: "British", gender: "Female" },
  { id: "bf_isabella", name: "Isabella", accent: "British", gender: "Female" },
  { id: "bm_george", name: "George", accent: "British", gender: "Male" },
  { id: "bm_fable", name: "Fable", accent: "British", gender: "Male" },
];

export const DEFAULT_VOICE = VOICES[0].id;

export const SPEEDS = [0.75, 1, 1.25, 1.5, 1.75, 2];

export function voiceName(id: string): string {
  return VOICES.find((voice) => voice.id === id)?.name ?? "Voice";
}

/** Groups voices for the picker, like "American female". */
export function groupedVoices(): Array<{ label: string; voices: VoiceOption[] }> {
  const groups = new Map<string, VoiceOption[]>();
  for (const voice of VOICES) {
    const label = `${voice.accent} ${voice.gender.toLowerCase()}`;
    groups.set(label, [...(groups.get(label) ?? []), voice]);
  }
  return Array.from(groups, ([label, voices]) => ({ label, voices }));
}
