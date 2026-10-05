/** Rough speaking rate at 1x, used for sentences that have not been generated yet. */
const CHARS_PER_SECOND = 15;

export function estimateDuration(text: string): number {
  return Math.max(0.6, text.length / CHARS_PER_SECOND);
}

export interface TimedItem {
  text: string;
  /** Real audio length once generated, otherwise null and we estimate. */
  duration: number | null;
  /** Silence after this item, such as the short pause after a heading. */
  pauseAfter: number;
}

export function itemLength(item: TimedItem): number {
  return (item.duration ?? estimateDuration(item.text)) + item.pauseAfter;
}

/** Start time of every item, in seconds at 1x. */
export function startTimes(items: TimedItem[]): number[] {
  const starts: number[] = [];
  let time = 0;
  for (const item of items) {
    starts.push(time);
    time += itemLength(item);
  }
  return starts;
}

export function totalLength(items: TimedItem[]): number {
  return items.reduce((sum, item) => sum + itemLength(item), 0);
}

/**
 * Maps a timeline position to the sentence that contains it and how far into
 * that sentence's audio it falls. Used when the user drags the scrubber.
 */
export function locate(items: TimedItem[], time: number): { index: number; offset: number } {
  if (!items.length) return { index: 0, offset: 0 };
  const starts = startTimes(items);
  for (let i = items.length - 1; i >= 0; i--) {
    if (time >= starts[i]) {
      const audioLength = items[i].duration ?? estimateDuration(items[i].text);
      return { index: i, offset: Math.min(time - starts[i], audioLength) };
    }
  }
  return { index: 0, offset: 0 };
}
