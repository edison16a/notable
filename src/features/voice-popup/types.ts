/** Every state the popup can show. Dictation and read aloud each map their own state onto these. */
export type PopupStatus =
  | "listening"
  | "silent"
  | "transcribing"
  | "preparing"
  | "reading"
  | "paused"
  | "downloading"
  | "error";

/** How the bars move. Kept separate from status because several statuses share a look. */
export type BarsMode = "live" | "flat" | "pulse" | "shimmer";

export function barsModeFor(status: PopupStatus): BarsMode {
  switch (status) {
    case "listening":
    case "reading":
      return "live";
    case "transcribing":
      return "pulse";
    case "preparing":
      return "shimmer";
    default:
      return "flat";
  }
}
