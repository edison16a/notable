/**
 * Whisper sometimes "hears" silence as tags like [BLANK_AUDIO] or (music),
 * or as a polite "Thank you." learned from subtitle data. Those never belong
 * in a note, so they are dropped. Real text is trimmed and spaced.
 */
const NOISE_ONLY = /^(\s*(\[[^\]]*\]|\([^)]*\)|\*[^*]*\*)\s*)+$/;
const PHANTOM_PHRASES = new Set(["thank you.", "thanks for watching!", "you", "."]);

export function cleanTranscript(raw: string): string {
  const text = raw.replace(/\s+/g, " ").trim();
  if (!text || NOISE_ONLY.test(text)) return "";
  if (PHANTOM_PHRASES.has(text.toLowerCase())) return "";
  return text.replace(/\[[^\]]*\]/g, "").replace(/\s+/g, " ").trim();
}

/**
 * Text to insert after `before` (the character left of the cursor). Adds a
 * space unless we are at the start of a line or after whitespace already.
 */
export function joinDictation(before: string, text: string): string {
  if (!text) return "";
  const needsSpace = before !== "" && !/\s$/.test(before);
  return needsSpace ? ` ${text}` : text;
}
