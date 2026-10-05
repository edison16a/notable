/** Replaces the bars while a model downloads. `value` is 0 to 1. */
export function ProgressTrack({ value }: { value: number }) {
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(value * 100)}
      className="h-1 w-[124px] overflow-hidden rounded-full bg-line"
    >
      <div className="h-full rounded-full bg-accent transition-[width] duration-200" style={{ width: `${value * 100}%` }} />
    </div>
  );
}
