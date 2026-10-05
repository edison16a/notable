/** Joins class names, skipping falsy values so conditional classes read cleanly inline. */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}
