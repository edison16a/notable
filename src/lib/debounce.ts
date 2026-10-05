export interface Debounced<A extends unknown[]> {
  (...args: A): void;
  /** Runs the pending call right away, used when the page is about to hide. */
  flush(): void;
  cancel(): void;
}

/**
 * Delays a call until the caller has been quiet for `wait` ms. Autosave uses
 * this so typing a sentence produces one write instead of one per keystroke.
 */
export function debounce<A extends unknown[]>(fn: (...args: A) => void, wait: number): Debounced<A> {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let pending: A | null = null;

  const run = () => {
    timer = null;
    if (!pending) return;
    const args = pending;
    pending = null;
    fn(...args);
  };

  const debounced = ((...args: A) => {
    pending = args;
    if (timer) clearTimeout(timer);
    timer = setTimeout(run, wait);
  }) as Debounced<A>;

  debounced.flush = () => {
    if (timer) clearTimeout(timer);
    run();
  };
  debounced.cancel = () => {
    if (timer) clearTimeout(timer);
    timer = null;
    pending = null;
  };
  return debounced;
}
